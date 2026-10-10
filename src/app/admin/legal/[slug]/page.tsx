import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, legalPages } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, PageHead, Save, SavedBanner, Section } from "@/admin/ui";
import { saveLegal } from "@/admin/actions";

export default async function LegalEdit({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const [r] = await db.select().from(legalPages).where(eq(legalPages.slug, slug)).limit(1);
  if (!r) notFound();
  return (
    <div className="max-w-5xl">
      <PageHead title={r.titleEn} back="/admin/legal" />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveLegal}>
        <input type="hidden" name="slug" value={r.slug} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={r} missingText={a.missing} />
            <BiField label="Markdown" name="body" row={r} area rows={20} missingText={a.missing} />
            <Check label={lang === "ru" ? "Проверено юристом" : "Reviewed by a lawyer"} name="reviewed" defaultChecked={r.reviewed} />
          </div>
        </Section>
        <Save label={a.save} />
      </form>
    </div>
  );
}
