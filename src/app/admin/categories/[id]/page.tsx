import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { categories, db } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section, Select } from "@/admin/ui";
import { ConfirmButton, MediaPicker } from "@/admin/client";
import { deleteCategory, saveCategory } from "@/admin/actions";

export default async function CategoryEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const c = id === "new" ? null : (await db.select().from(categories).where(eq(categories.id, Number(id))).limit(1))[0];
  if (id !== "new" && !c) notFound();
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  return (
    <div className="max-w-4xl">
      <PageHead title={c ? c.titleEn || c.titleRu : a.new} back="/admin/categories" />
      <SavedBanner show={!!sp.saved && !sp.error} text={a.saved} />
      {sp.error && <p className="mb-4 rounded-xl bg-accent/15 p-3 text-sm">{lang === "ru" ? "Сначала перенесите или удалите программы этой категории." : "Move or delete this category's programs first."}</p>}
      <form action={saveCategory}>
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={c} missingText={a.missing} />
            <BiField label={a.subtitle} name="subtitle" row={c} area rows={2} missingText={a.missing} />
            <BiField label={a.description} name="desc" row={c} area rows={3} missingText={a.missing} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={a.slug} name="slug" defaultValue={c?.slug} />
              <Select label="Type" name="kind" defaultValue={c?.kind ?? "training"} options={[["training", lang === "ru" ? "Тренировки (программы)" : "Training (programs)"], ["service", lang === "ru" ? "Онлайн-занятия (запись)" : "Online sessions (booking)"]]} />
            </div>
            <MediaPicker name="coverId" value={c?.coverId ?? null} label={a.cover} {...pick} />
            <Check label={a.published} name="published" defaultChecked={c?.published ?? true} />
          </div>
        </Section>
        <Save label={a.save} />
      </form>
      {c && <form action={deleteCategory} className="mt-4"><input type="hidden" name="id" value={c.id} /><ConfirmButton label={a.delete} confirm={a.confirmDelete} /></form>}
    </div>
  );
}
