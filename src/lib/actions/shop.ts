"use server";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { bookings, db, entitlements, orders, productPrograms, products } from "@/db";
import { getUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/i18n/config";
import { availableSlots } from "@/lib/booking";
import { devCheckoutAllowed, getStripe, markOrderPaid, orderRef } from "@/lib/commerce";
import { sendTemplate } from "@/lib/email";
import { formatPrice, tr } from "@/lib/l10n";
import { getSettings, MANUAL_METHODS, type ManualMethodKey } from "@/lib/settings";

const loc = (v: FormDataEntryValue | null): Locale => (isLocale(v) ? v : "en");
const site = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

async function loadOwnOrder(orderId: number) {
  const u = await getUser();
  if (!u) return null;
  const [o] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, u.id))).limit(1);
  return o ? { o, u } : null;
}

/** Creates (or reuses) a pending order for a program/bundle and goes to checkout. */
export async function startCheckout(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const productId = Number(fd.get("productId"));
  const back = String(fd.get("back") || `/${locale}/training`);
  const u = await getUser();
  if (!u) redirect(`/${locale}/login?next=${encodeURIComponent(back)}`);
  const [p] = await db.select().from(products).where(and(eq(products.id, productId), eq(products.active, true))).limit(1);
  if (!p || p.type === "session" || p.type === "consultation") redirect(back);

  const progs = await db.select().from(productPrograms).where(eq(productPrograms.productId, p.id));
  if (progs.length) {
    const owned = await db
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.userId, u.id), inArray(entitlements.programId, progs.map((x) => x.programId))));
    if (owned.length === progs.length) redirect(back);
  }
  const [existing] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, u.id), eq(orders.productId, p.id), eq(orders.status, "pending")))
    .limit(1);
  const id =
    existing?.id ??
    (await db.insert(orders).values({ userId: u.id, productId: p.id, amountCents: p.priceCents, currency: p.currency, provider: "stripe" }).returning())[0].id;
  redirect(`/${locale}/checkout/${id}`);
}

/** Reserves a session slot and creates its order. */
export async function bookSession(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const productId = Number(fd.get("productId"));
  const start = String(fd.get("start") || "");
  const notes = String(fd.get("notes") || "").slice(0, 1000);
  const u = await getUser();
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!p) redirect(`/${locale}/online-training`);
  if (!u) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/book/${p.slug}`)}`);
  const s = await getSettings();
  const slots = await availableSlots({
    durationMin: p.durationMin || 60,
    timezone: s.coach.timezone,
    noticeHours: s.coach.noticeHours,
    windowDays: s.coach.windowDays,
    stepMin: s.coach.slotStepMin,
  });
  const slot = slots.find((x) => x.start === start);
  if (!slot) redirect(`/${locale}/book/${p.slug}?taken=1`);
  const [b] = await db
    .insert(bookings)
    .values({ userId: u.id, productId: p.id, startAt: new Date(slot.start), endAt: new Date(slot.end), notes })
    .returning();
  const [o] = await db
    .insert(orders)
    .values({ userId: u.id, productId: p.id, amountCents: p.priceCents, currency: p.currency, provider: "stripe", bookingId: b.id })
    .returning();
  redirect(`/${locale}/checkout/${o.id}`);
}

export async function payWithStripe(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const r = await loadOwnOrder(Number(fd.get("orderId")));
  if (!r || r.o.status !== "pending") redirect(`/${locale}/account`);
  const stripe = getStripe();
  if (!stripe) redirect(`/${locale}/checkout/${r.o.id}`);
  const [p] = await db.select().from(products).where(eq(products.id, r.o.productId)).limit(1);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: r.u.email,
    locale: locale === "ru" ? "ru" : "en",
    line_items: [
      {
        quantity: 1,
        price_data: { currency: r.o.currency, unit_amount: r.o.amountCents, product_data: { name: tr(p, "title", locale) || "Order" } },
      },
    ],
    metadata: { orderId: String(r.o.id) },
    client_reference_id: String(r.o.id),
    success_url: `${site()}/${locale}/checkout/${r.o.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site()}/${locale}/checkout/${r.o.id}`,
  });
  await db.update(orders).set({ provider: "stripe", providerRef: session.id }).where(eq(orders.id, r.o.id));
  redirect(session.url!);
}

/** Simulated payment for local testing when Stripe isn't configured. */
export async function payDev(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const r = await loadOwnOrder(Number(fd.get("orderId")));
  if (!r || !devCheckoutAllowed()) redirect(`/${locale}/account`);
  await markOrderPaid(r.o.id, "dev", "test-payment");
  redirect(`/${locale}/checkout/${r.o.id}`);
}

export async function chooseManual(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const method = String(fd.get("method")) as ManualMethodKey;
  const r = await loadOwnOrder(Number(fd.get("orderId")));
  if (!r || r.o.status !== "pending" || !MANUAL_METHODS.includes(method)) redirect(`/${locale}/account`);
  const s = await getSettings();
  const m = s.payments.manual[method];
  if (!m?.enabled) redirect(`/${locale}/checkout/${r.o.id}`);
  await db.update(orders).set({ provider: "manual", method }).where(eq(orders.id, r.o.id));
  const [p] = await db.select().from(products).where(eq(products.id, r.o.productId)).limit(1);
  await sendTemplate(r.u.email, "manualPending", locale, {
    name: r.u.name || r.u.email,
    order: String(r.o.id),
    method: m.label,
    product: tr(p, "title", locale),
    amount: formatPrice(r.o.amountCents, r.o.currency, locale),
    details: [m.details, locale === "ru" ? m.instructionsRu : m.instructionsEn].filter(Boolean).join("\n"),
    ref: orderRef(r.o.id),
  });
  redirect(`/${locale}/checkout/${r.o.id}`);
}

export async function resetPaymentMethod(fd: FormData) {
  const locale = loc(fd.get("locale"));
  const r = await loadOwnOrder(Number(fd.get("orderId")));
  if (r && r.o.status === "pending") await db.update(orders).set({ provider: "stripe", method: "" }).where(eq(orders.id, r.o.id));
  redirect(`/${locale}/checkout/${fd.get("orderId")}`);
}
