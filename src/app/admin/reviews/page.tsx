import { desc } from "drizzle-orm";
import { db, reviews } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead, SavedBanner, Section } from "@/admin/ui";
import { reviewAction } from "@/admin/actions";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  const btn = (id: number, act: string, label: string, cls: string) => (
    <form action={reviewAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="act" value={act} /><button className={`rounded-lg px-3 py-1 text-xs ${cls}`}>{label}</button></form>
  );
  return (
    <div className="max-w-4xl">
      <PageHead title={a.reviews} sub={ru ? "На сайте показываются только одобренные настоящие отзывы." : "Only approved, genuine reviews are shown on the site."} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>{r.name}</b> <span className="text-lime">{"★".repeat(r.rating)}</span> <span className="text-xs uppercase text-muted">{r.locale}</span> {r.userId ? <Badge>{ru ? "клиент сайта" : "site member"}</Badge> : <Badge>{ru ? "добавлен вручную" : "added manually"}</Badge>}</div>
              <Badge tone={r.status === "approved" ? "ok" : r.status === "pending" ? "warn" : "muted"}>{r.status}</Badge>
            </div>
            <p className="mt-3 text-muted">{r.text}</p>
            <div className="mt-4 flex gap-2">
              {r.status !== "approved" && btn(r.id, "approve", a.approve, "bg-lime font-semibold text-black")}
              {r.status !== "rejected" && btn(r.id, "reject", a.reject, "border border-line")}
              {btn(r.id, "delete", a.delete, "text-accent")}
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-muted">{a.none}</p>}
      </div>
      <Section title={ru ? "Добавить настоящий отзыв, полученный в другом месте" : "Add a genuine review received elsewhere"} className="mt-8">
        <form action={reviewAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="act" value="add" />
          <input name="name" required placeholder={ru ? "Имя клиента" : "Client name"} className="input" />
          <div className="flex gap-2">
            <select name="rating" className="input">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
            <select name="locale" className="input"><option value="en">EN</option><option value="ru">RU</option></select>
          </div>
          <textarea name="text" required rows={3} placeholder={ru ? "Текст отзыва (дословно, с согласия клиента)" : "Review text (verbatim, with the client's consent)"} className="input md:col-span-2" />
          <button className="btn-primary md:col-span-2">+ {a.add}</button>
        </form>
      </Section>
    </div>
  );
}
