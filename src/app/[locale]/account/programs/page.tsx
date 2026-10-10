import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { db, orders, products } from "@/db";
import { formatPrice, tr } from "@/lib/l10n";
import { requireUser } from "@/lib/auth";
import { memberPrograms } from "@/lib/progress";
import { orderRef } from "@/lib/commerce";

export default async function MyPrograms({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const user = await requireUser(locale);
  const progs = await memberPrograms(user);
  const os = await db.select({ o: orders, p: products }).from(orders).innerJoin(products, eq(products.id, orders.productId)).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  const L = (p: string) => `/${locale}${p}`;
  return (
    <div className="space-y-12">
      <section>
        <h2 className="display mb-5 text-3xl">{t.account.myPrograms}</h2>
        {progs.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {progs.map(({ program: p, total, completed }) => (
              <Link key={p.id} href={L(`/programs/${p.slug}`)} className="card block p-5 transition hover:border-accent/60">
                <div className="font-display text-xl uppercase">{tr(p, "title", locale)}</div>
                <div className="mt-1 text-sm text-muted">{fmt(t.program.progress, { done: completed, total })}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-lime" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} /></div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted">{t.account.noPrograms} <Link className="text-accent" href={L("/training")}>{t.account.browse}</Link></p>
        )}
      </section>
      <section>
        <h2 className="display mb-5 text-3xl">{t.account.orders}</h2>
        {os.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {os.map(({ o, p }) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span><span className="font-mono text-muted">{orderRef(o.id)}</span> · {tr(p, "title", locale)}</span>
                <span className="flex items-center gap-3">
                  <span>{formatPrice(o.amountCents, o.currency, locale)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${o.status === "paid" ? "bg-lime/20 text-lime" : o.status === "pending" ? "bg-accent/20" : "bg-surface-2 text-muted"}`}>{t.account.status[o.status]}</span>
                  {o.status === "pending" && <Link className="text-accent" href={L(`/checkout/${o.id}`)}>→</Link>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t.account.noOrders}</p>
        )}
      </section>
    </div>
  );
}
