import { asc } from "drizzle-orm";
import { achievements, db } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, PageHead, SavedBanner, Section } from "@/admin/ui";
import { Sortable, SubmitButton } from "@/admin/client";
import { saveAchievement } from "@/admin/actions";

export default async function AchievementsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const rows = await db.select().from(achievements).orderBy(asc(achievements.sortOrder));
  return (
    <div className="max-w-5xl">
      <PageHead title={a.achievements} sub={ru ? "Публикуются только одобренные. Подтвердите неподтверждённые титулы документами перед одобрением." : "Only approved items are published. Confirm unverified titles with documents before approving."} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <Section><Sortable table="achievements" hint={a.sortHint} items={rows.map((r) => ({ id: r.id, label: ru ? r.textRu : r.textEn, sub: r.status, badge: r.status === "pending" ? a.pending : undefined }))} /></Section>
      {[...rows, null].map((r) => (
        <form key={r?.id ?? "new"} action={saveAchievement} className={`card mb-3 space-y-3 p-5 ${r?.status === "pending" ? "border-yellow-400/40" : ""}`}>
          <input type="hidden" name="id" value={r?.id ?? ""} />
          {!r && <div className="font-display uppercase">+ {a.add}</div>}
          <BiField label={a.title} name="text" row={r} missingText={a.missing} />
          <div className="grid items-end gap-3 md:grid-cols-[200px_1fr_auto]">
            <label><span className="label">{a.status}</span>
              <select name="status" defaultValue={r?.status ?? "pending"} className="input">
                <option value="approved">{a.approved}</option><option value="pending">{a.pending}</option>
              </select>
            </label>
            <label><span className="label">{ru ? "Заметка / источник" : "Note / source"}</span><input name="note" defaultValue={r?.note} className="input" /></label>
            <div className="flex gap-3">
              <SubmitButton label={a.save} className="btn-primary !py-3" />
              {r && <button name="act" value="delete" className="text-sm text-accent">{a.delete}</button>}
            </div>
          </div>
        </form>
      ))}
    </div>
  );
}
