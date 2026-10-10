import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { bookings, db, orders, products } from "@/db";
import { formatPrice, tr } from "@/lib/l10n";
import { getUser } from "@/lib/auth";
import { getSettings, MANUAL_METHODS } from "@/lib/settings";
import { devCheckoutAllowed, getStripe, markOrderPaid, orderRef } from "@/lib/commerce";
import { formatInZone } from "@/lib/booking";
import { chooseManual, payDev, payWithStripe, resetPaymentMethod } from "@/lib/actions/shop";

type P = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ session_id?: string }> };
export const metadata = { robots: { index: false } };

export default async function CheckoutPage({ params, searchParams }: P) {
  const { locale: lc, id } = await params;
  const locale = lc as Locale;
  const { session_id } = await searchParams;
  const t = getDict(locale);
  const user = await getUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout/${id}`)}`);
  let [o] = await db.select().from(orders).where(and(eq(orders.id, Number(id)), eq(orders.userId, user.id))).limit(1);
  if (!o) notFound();

  // Returning from Stripe: confirm directly (the webhook does the same; whichever runs first wins).
  const stripe = getStripe();
  if (o.status === "pending" && session_id && stripe && session_id === o.providerRef) {
    const sess = await stripe.checkout.sessions.retrieve(session_id);
    if (sess.payment_status === "paid" && sess.metadata?.orderId === String(o.id)) {
      await markOrderPaid(o.id, "stripe", sess.id);
      [o] = await db.select().from(orders).where(eq(orders.id, o.id)).limit(1);
    }
  }

  const [p] = await db.select().from(products).where(eq(products.id, o.productId)).limit(1);
  const [b] = o.bookingId ? await db.select().from(bookings).where(eq(bookings.id, o.bookingId)).limit(1) : [];
  const s = await getSettings();
  const amount = formatPrice(o.amountCents, o.currency, locale);
  const manual = MANUAL_METHODS.map((k) => [k, s.payments.manual[k]] as const).filter(([, m]) => m.enabled);
  const chosen = o.provider === "manual" && o.method ? s.payments.manual[o.method as (typeof MANUAL_METHODS)[number]] : null;
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderId" value={o.id} />
    </>
  );

  return (
    <div className="container-x max-w-3xl py-14">
      <div className="eyebrow mb-3">{fmt(t.checkout.order, { ref: orderRef(o.id) })}</div>
      <h1 className="display text-5xl">{o.status === "paid" ? t.checkout.paidTitle : t.checkout.title}</h1>

      <div className="card mt-8 divide-y divide-line">
        <div className="flex items-start justify-between gap-4 p-6">
          <div>
            <div className="font-display text-2xl uppercase">{tr(p, "title", locale)}</div>
            {b && <div className="mt-1 text-sm text-muted">{t.checkout.session}: {formatInZone(b.startAt, user.timezone, locale)}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-muted">{t.checkout.total}</div>
            <div className="font-display text-3xl">{amount}</div>
          </div>
        </div>

        {o.status === "paid" && (
          <div className="p-6">
            <p className="text-lg">{b ? t.checkout.paidBooking : t.checkout.paidText}</p>
            <Link href={`/${locale}/account`} className="btn-primary mt-5">{t.checkout.goAccount}</Link>
          </div>
        )}

        {o.status === "cancelled" && <p className="p-6 text-muted">{t.checkout.cancelled}</p>}

        {o.status === "pending" && chosen && (
          <div className="space-y-4 p-6">
            <h2 className="display text-2xl">{fmt(t.checkout.instructionsTitle, { method: chosen.label })}</h2>
            {chosen.details ? (
              <div className="rounded-xl border border-line bg-bg p-4">
                <div className="label">{fmt(t.checkout.sendTo, { amount })}</div>
                <div className="whitespace-pre-wrap break-all font-mono text-lg">{chosen.details}</div>
              </div>
            ) : (
              <p className="text-muted">{t.checkout.detailsComing}</p>
            )}
            {(locale === "ru" ? chosen.instructionsRu : chosen.instructionsEn) && (
              <p className="whitespace-pre-wrap text-muted">{locale === "ru" ? chosen.instructionsRu || chosen.instructionsEn : chosen.instructionsEn || chosen.instructionsRu}</p>
            )}
            <div className="rounded-xl border border-lime/40 bg-lime/10 p-4">
              <div className="label">{t.checkout.reference}</div>
              <div className="font-mono text-xl">{orderRef(o.id)}</div>
              <p className="mt-1 text-sm text-muted">{t.checkout.referenceNote}</p>
            </div>
            <p className="text-sm text-muted">{t.checkout.pendingNote}</p>
            <form action={resetPaymentMethod}>{hidden}<button className="text-sm text-muted underline">← {t.checkout.otherMethods}</button></form>
          </div>
        )}

        {o.status === "pending" && !chosen && (
          <div className="space-y-6 p-6">
            {stripe && s.payments.stripeEnabled && (
              <form action={payWithStripe}>{hidden}<button className="btn-primary w-full !py-4">{t.checkout.payCard}</button></form>
            )}
            {!stripe && devCheckoutAllowed() && (
              <div className="space-y-3 rounded-xl border border-dashed border-lime/50 p-4">
                <p className="text-sm text-muted">{t.checkout.testMode}</p>
                <form action={payDev}>{hidden}<button className="btn-lime w-full">{t.checkout.payTest}</button></form>
              </div>
            )}
            {manual.length > 0 && (
              <div>
                <div className="eyebrow mb-3">{t.checkout.otherMethods}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {manual.map(([k, m]) => (
                    <form key={k} action={chooseManual}>
                      {hidden}
                      <input type="hidden" name="method" value={k} />
                      <button className="w-full rounded-xl border border-line px-3 py-3 text-sm font-semibold transition hover:border-accent">{m.label}</button>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
