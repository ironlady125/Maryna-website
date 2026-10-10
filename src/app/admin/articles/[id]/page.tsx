import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { articles, categories, db } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section, Select } from "@/admin/ui";
import { ConfirmButton, MediaPicker } from "@/admin/client";
import { saveArticle } from "@/admin/actions";

export default async function ArticleEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const r = id === "new" ? null : (await db.select().from(articles).where(eq(articles.id, Number(id))).limit(1))[0];
  if (id !== "new" && !r) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  return (
    <div className="max-w-5xl">
      <PageHead title={r ? r.titleEn || r.titleRu : a.new} back="/admin/articles" />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveArticle}>
        <input type="hidden" name="id" value={r?.id ?? ""} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={r} missingText={a.missing} />
            <BiField label={a.subtitle} name="excerpt" row={r} area rows={2} missingText={a.missing} />
            <BiField label="Markdown" name="body" row={r} area rows={18} missingText={a.missing} hint="## Heading · **bold** · - list · > note" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={a.slug} name="slug" defaultValue={r?.slug} />
              <Select label={a.category} name="categoryId" defaultValue={r?.categoryId ?? ""} options={[["", "—"], ...cats.map((c) => [c.id, lang === "ru" ? c.titleRu : c.titleEn] as [number, string])]} />
            </div>
            <MediaPicker name="coverId" value={r?.coverId ?? null} label={a.cover} {...pick} />
            <Check label={a.published} name="published" defaultChecked={r?.published ?? true} />
          </div>
        </Section>
        <Save label={a.save} />
      </form>
      {r && (
        <form action={saveArticle} className="mt-4">
          <input type="hidden" name="id" value={r.id} /><input type="hidden" name="act" value="delete" />
          <ConfirmButton label={a.delete} confirm={a.confirmDelete} />
        </form>
      )}
    </div>
  );
}
