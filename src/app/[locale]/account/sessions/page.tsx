import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { bookings, db, orders, products } from "@/db";
import { tr } from "@/lib/l10n";
import { requireUser } from "@/lib/auth";
import { formatInZone } from "@/lib/booking";

export default async function MySessions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const user = await requireUser(locale);
  const rows = await db
    .select({ b: bookings, p: products, o: orders })
    .from(bookings)
    .innerJoin(products, eq(products.id, bookings.productId))
    .leftJoin(orders, eq(orders.bookingId, bookings.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.startAt));
  const now = Date.now();
  const upcoming = rows.filter((r) => r.b.endAt.getTime() >= now && r.b.status !== "cancelled").reverse();
  const past = rows.filter((r) => !upcoming.includes(r));
  const List = ({ items }: { items: typeof rows }) => (
    <ul className="divide-y divide-line rounded-2xl border border-line">
      {items.map(({ b, p, o }) => (
        <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="font-display text-lg uppercase">{tr(p, "title", locale)}</div>
            <div className="text-sm text-muted">{formatInZone(b.startAt, user.timezone, locale)}</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs ${b.status === "confirmed" ? "bg-lime/20 text-lime" : "bg-surface-2 text-muted"}`}>{t.account.status[b.status]}</span>
            {b.status === "pending_payment" && o && <Link className="text-accent" href={`/${locale}/checkout/${o.id}`}>→</Link>}
            {b.status === "confirmed" && b.meetingUrl && <a className="btn-lime !py-2" href={b.meetingUrl} target="_blank" rel="noopener noreferrer">{t.account.joinLink}</a>}
          </div>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="space-y-12">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="display text-3xl">{t.account.upcoming}</h2>
          <Link href={`/${locale}/online-training`} className="text-sm uppercase tracking-widest text-accent">{t.home.onlineCta} →</Link>
        </div>
        {upcoming.length ? <List items={upcoming} /> : <p className="text-muted">{t.account.noBookings}</p>}
      </section>
      {past.length > 0 && (
        <section>
          <h2 className="display mb-5 text-3xl">{t.account.past}</h2>
          <List items={past} />
        </section>
      )}
    </div>
  );
}
