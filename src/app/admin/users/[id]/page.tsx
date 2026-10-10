import { notFound } from "next/navigation";
import { asc, count, desc, eq } from "drizzle-orm";
import { db, entitlements, orders, products, programs, progress, users } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead, SavedBanner, Section } from "@/admin/ui";
import { userAction } from "@/admin/actions";
import { formatPrice } from "@/lib/l10n";
import { orderRef } from "@/lib/commerce";

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) notFound();
  const ent = await db.select({ p: programs }).from(entitlements).innerJoin(programs, eq(programs.id, entitlements.programId)).where(eq(entitlements.userId, id));
  const allProgs = await db.select().from(programs).orderBy(asc(programs.sortOrder));
  const os = await db.select({ o: orders, p: products }).from(orders).innerJoin(products, eq(products.id, orders.productId)).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt));
  const [{ n }] = await db.select({ n: count() }).from(progress).where(eq(progress.userId, id));
  return (
    <div className="max-w-4xl">
      <PageHead title={u.name || u.email} back="/admin/users" sub={`${u.email} · ${u.timezone} · ${u.locale.toUpperCase()} · ${ru ? "тренировок" : "workouts"}: ${n}`} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <Section title="Role">
        <form action={userAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={u.id} /><input type="hidden" name="act" value="role" />
          <select name="role" defaultValue={u.role} className="input max-w-xs"><option value="user">user</option><option value="admin">admin</option></select>
          <button className="btn-ghost !py-2">{a.save}</button>
        </form>
      </Section>
      <Section title={ru ? "Доступ к программам" : "Program access"}>
        <ul className="mb-4 space-y-2 text-sm">
          {ent.map(({ p }) => (
            <li key={p.id} className="flex items-center justify-between">
              {ru ? p.titleRu : p.titleEn}
              <form action={userAction}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="act" value="revoke" /><input type="hidden" name="programId" value={p.id} /><button className="text-xs text-accent">{a.remove}</button></form>
            </li>
          ))}
          {!ent.length && <li className="text-muted">{a.none}</li>}
        </ul>
        <form action={userAction} className="flex gap-2">
          <input type="hidden" name="id" value={u.id} /><input type="hidden" name="act" value="grant" />
          <select name="programId" className="input">{allProgs.map((p) => <option key={p.id} value={p.id}>{ru ? p.titleRu : p.titleEn}</option>)}</select>
          <button className="btn-primary !py-2">{ru ? "Выдать доступ" : "Grant access"}</button>
        </form>
      </Section>
      <Section title={a.orders}>
        <ul className="divide-y divide-line text-sm">
          {os.map(({ o, p }) => (
            <li key={o.id} className="flex justify-between py-2">
              <span className="font-mono text-xs">{orderRef(o.id)}</span><span>{p.titleEn}</span><span>{formatPrice(o.amountCents, o.currency, lang)}</span><Badge tone={o.status === "paid" ? "ok" : "muted"}>{o.status}</Badge>
            </li>
          ))}
          {!os.length && <li className="text-muted">{a.none}</li>}
        </ul>
      </Section>
    </div>
  );
}
