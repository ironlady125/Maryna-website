import { asc } from "drizzle-orm";
import { db, faqs } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, PageHead, SavedBanner, Section } from "@/admin/ui";
import { Sortable, SubmitButton } from "@/admin/client";
import { saveFaq } from "@/admin/actions";

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const rows = await db.select().from(faqs).orderBy(asc(faqs.sortOrder));
  return (
    <div className="max-w-5xl">
      <PageHead title={a.faqs} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <Section><Sortable table="faqs" hint={a.sortHint} items={rows.map((r) => ({ id: r.id, label: lang === "ru" ? r.qRu : r.qEn }))} /></Section>
      {[...rows, null].map((r) => (
        <form key={r?.id ?? "new"} action={saveFaq} className="card mb-3 space-y-3 p-5">
          <input type="hidden" name="id" value={r?.id ?? ""} />
          {!r && <div className="font-display uppercase">+ {a.add}</div>}
          <BiField label="Q" name="q" row={r} missingText={a.missing} />
          <BiField label="A" name="a" row={r} area rows={3} missingText={a.missing} />
          <div className="flex gap-3">
            <SubmitButton label={a.save} />
            {r && <button name="act" value="delete" className="text-sm text-accent">{a.delete}</button>}
          </div>
        </form>
      ))}
    </div>
  );
}
