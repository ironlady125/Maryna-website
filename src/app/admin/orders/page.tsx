import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, orders, products, users } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead, SavedBanner, Table } from "@/admin/ui";
import { orderAction } from "@/admin/actions";
import { formatPrice } from "@/lib/l10n";
import { orderRef } from "@/lib/commerce";

const STATUSES = ["pending", "paid", "cancelled", "refunded"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const st = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof STATUSES)[number]) : undefined;
  const rows = await db
    .select({ o: orders, u: users, p: products })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(products, eq(products.id, orders.productId))
    .where(st ? eq(orders.status, st) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(300);
  const back = `/admin/orders${st ? `?status=${st}` : ""}`;
  return (
    <div>
      <PageHead title={a.orders} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={`rounded-full px-4 py-2 text-sm ${!st ? "bg-accent text-white" : "border border-line text-muted"}`}>{ru ? "Все" : "All"}</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-4 py-2 text-sm ${st === s ? "bg-accent text-white" : "border border-line text-muted"}`}>{s}</Link>)}
      </div>
      <Table head={["#", ru ? "Клиент" : "Customer", ru ? "Товар" : "Product", a.price, ru ? "Способ" : "Method", a.status, a.actions]}>
        {rows.map(({ o, u, p }) => (
          <tr key={o.id}>
            <td className="px-4 py-3 font-mono text-xs">{orderRef(o.id)}<br /><span className="text-muted">{o.createdAt.toLocaleDateString()}</span></td>
            <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="hover:text-accent">{u.name || "—"}</Link><br /><span className="text-xs text-muted">{u.email}</span></td>
            <td className="px-4 py-3">{p.titleEn}{o.bookingId ? " 📅" : ""}</td>
            <td className="px-4 py-3">{formatPrice(o.amountCents, o.currency, lang)}</td>
            <td className="px-4 py-3 text-muted">{o.provider}{o.method ? ` · ${o.method}` : ""}</td>
            <td className="px-4 py-3"><Badge tone={o.status === "paid" ? "ok" : o.status === "pending" ? "warn" : "muted"}>{o.status}</Badge></td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {o.status === "pending" && (
                  <>
                    <form action={orderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="act" value="paid" /><button className="rounded-lg bg-lime px-3 py-1 text-xs font-semibold text-black">{a.markPaid}</button></form>
                    <form action={orderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="act" value="cancel" /><button className="rounded-lg border border-line px-3 py-1 text-xs">{a.cancel}</button></form>
                  </>
                )}
                {o.status === "paid" && (
                  <form action={orderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={back} /><input type="hidden" name="act" value="refunded" /><button className="rounded-lg border border-line px-3 py-1 text-xs">{ru ? "Отметить возврат" : "Mark refunded"}</button></form>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <p className="mt-4 text-muted">{a.none}</p>}
      <p className="mt-4 text-xs text-muted">{ru ? "Возврат денег по картам делается в панели Stripe; здесь только отметка статуса." : "Card refunds are issued in your Stripe dashboard; this only records the status."}</p>
    </div>
  );
}
