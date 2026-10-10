import Link from "next/link";
import { and, asc, count, eq, gte, sum } from "drizzle-orm";
import { achievements, bookings, db, legalPages, media, orders, products, reviews, users } from "@/db";
import { adminDict } from "@/admin/i18n";
import { PageHead } from "@/admin/ui";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/l10n";
import { formatInZone } from "@/lib/booking";
import { translationReport } from "@/admin/translations";

export default async function AdminHome() {
  const { a, lang } = await adminDict();
  const s = await getSettings();
  const [[rev], [ord], [cust], [pendMan], [pendRev], [pendAch], [unver], [legal]] = await Promise.all([
    db.select({ v: sum(orders.amountCents) }).from(orders).where(eq(orders.status, "paid")),
    db.select({ v: count() }).from(orders).where(eq(orders.status, "paid")),
    db.select({ v: count() }).from(users).where(eq(users.role, "user")),
    db.select({ v: count() }).from(orders).where(and(eq(orders.status, "pending"), eq(orders.provider, "manual"))),
    db.select({ v: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ v: count() }).from(achievements).where(eq(achievements.status, "pending")),
    db.select({ v: count() }).from(media).where(eq(media.licenseStatus, "unverified")),
    db.select({ v: count() }).from(legalPages).where(eq(legalPages.reviewed, false)),
  ]);
  const upcoming = await db
    .select({ b: bookings, u: users, p: products })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.userId))
    .innerJoin(products, eq(products.id, bookings.productId))
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.endAt, new Date())))
    .orderBy(asc(bookings.startAt))
    .limit(5);
  const missing = (await translationReport()).length;
  const contactsEmpty = !Object.values(s.contacts).some(Boolean);
  const todo: [boolean, string, string][] = [
    [!process.env.STRIPE_SECRET_KEY, a.stripeOff, "/admin/settings?tab=payments"],
    [Number(pendMan.v) > 0, `${a.pendingManual}: ${pendMan.v}`, "/admin/orders?status=pending"],
    [Number(pendAch.v) > 0, `${a.pendingAchievements}: ${pendAch.v}`, "/admin/achievements"],
    [Number(pendRev.v) > 0, `${a.pendingReviews}: ${pendRev.v}`, "/admin/reviews"],
    [Number(legal.v) > 0, `${a.legalDraft}: ${legal.v}`, "/admin/legal"],
    [Number(unver.v) > 0, `${a.unverifiedMedia}: ${unver.v}`, "/admin/media"],
    [missing > 0, `${a.translationMissing}: ${missing}`, "/admin/translations"],
    [contactsEmpty, a.contactsEmpty, "/admin/settings?tab=contacts"],
  ];
  return (
    <div>
      <PageHead title={a.dashboard} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [formatPrice(Number(rev.v ?? 0), "usd", lang), a.revenue],
          [ord.v, a.orders],
          [cust.v, a.customers],
          [upcoming.length, a.upcoming],
        ].map(([v, l]) => (
          <div key={String(l)} className="card p-5">
            <div className="font-display text-3xl">{v}</div>
            <div className="text-xs uppercase tracking-widest text-muted">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg uppercase">{a.todo}</h2>
          <ul className="space-y-2 text-sm">
            {todo.filter(([on]) => on).map(([, label, href]) => (
              <li key={href + label}><Link href={href} className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 hover:text-accent"><span className="text-accent">●</span>{label}</Link></li>
            ))}
            {!todo.some(([on]) => on) && <li className="text-muted">✓</li>}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg uppercase">{a.upcoming}</h2>
          <ul className="divide-y divide-line text-sm">
            {upcoming.map(({ b, u, p }) => (
              <li key={b.id} className="flex justify-between gap-3 py-3">
                <span>{lang === "ru" ? p.titleRu : p.titleEn}<br /><span className="text-muted">{u.name} · {u.email}</span></span>
                <span className="text-right text-muted">{formatInZone(b.startAt, s.coach.timezone, lang)}</span>
              </li>
            ))}
            {!upcoming.length && <li className="py-3 text-muted">{a.none}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
