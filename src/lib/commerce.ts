import "server-only";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { bookings, db, entitlements, orders, productPrograms, products, users } from "@/db";
import type { Locale } from "@/i18n/config";
import { notifyOwner, sendTemplate } from "./email";
import { formatPrice } from "./l10n";
import { getSettings } from "./settings";
import { formatInZone } from "./booking";

let stripe: Stripe | null = null;
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export const devCheckoutAllowed = () => process.env.ALLOW_DEV_CHECKOUT === "true" && !process.env.STRIPE_SECRET_KEY;

export const orderRef = (id: number) => `MMF-${String(id).padStart(5, "0")}`;

/** Marks an order as paid (idempotent): grants program access, confirms booking, sends emails. */
export async function markOrderPaid(orderId: number, provider?: "stripe" | "manual" | "dev" | "free", ref?: string) {
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o || o.status === "paid") return o ?? null;
  await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date(), ...(provider ? { provider } : {}), ...(ref ? { providerRef: ref } : {}) })
    .where(eq(orders.id, orderId));

  const [p] = await db.select().from(products).where(eq(products.id, o.productId)).limit(1);
  const [u] = await db.select().from(users).where(eq(users.id, o.userId)).limit(1);
  const progs = await db.select().from(productPrograms).where(eq(productPrograms.productId, o.productId));
  for (const pp of progs) {
    await db.insert(entitlements).values({ userId: o.userId, programId: pp.programId, orderId }).onConflictDoNothing();
  }
  const locale = (u?.locale ?? "en") as Locale;
  const title = p ? (locale === "ru" ? p.titleRu || p.titleEn : p.titleEn || p.titleRu) : "";
  const amount = formatPrice(o.amountCents, o.currency, locale);

  if (o.bookingId) {
    const s = await getSettings();
    await db
      .update(bookings)
      .set({ status: "confirmed", meetingUrl: s.coach.meetingUrl })
      .where(and(eq(bookings.id, o.bookingId), eq(bookings.status, "pending_payment")));
    const [b] = await db.select().from(bookings).where(eq(bookings.id, o.bookingId)).limit(1);
    if (b && u) {
      const when = formatInZone(b.startAt, u.timezone || s.coach.timezone, locale);
      await sendTemplate(u.email, "bookingConfirmed", locale, { name: u.name || u.email, product: title, when, meeting: b.meetingUrl });
      await notifyOwner(
        `New booking: ${title} — ${formatInZone(b.startAt, s.coach.timezone, "en")}`,
        `${u.name} <${u.email}> booked "${title}" for ${formatInZone(b.startAt, s.coach.timezone, "en")} (${s.coach.timezone}).\nNotes: ${b.notes || "—"}\nOrder ${orderRef(o.id)}, ${amount}.`,
      );
    }
  } else if (u) {
    await notifyOwner(`New order ${orderRef(o.id)}: ${title}`, `${u.name} <${u.email}> paid ${amount} for "${title}".`);
  }
  if (u) await sendTemplate(u.email, "orderPaid", locale, { name: u.name || u.email, product: title, amount });
  return o;
}

export async function cancelOrder(orderId: number) {
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o) return;
  await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
  if (o.bookingId) await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, o.bookingId));
}
