import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, productPrograms, products, programs } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section, Select } from "@/admin/ui";
import { ConfirmButton, MediaPicker } from "@/admin/client";
import { deleteProduct, saveProduct } from "@/admin/actions";

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const p = id === "new" ? null : (await db.select().from(products).where(eq(products.id, Number(id))).limit(1))[0];
  if (id !== "new" && !p) notFound();
  const progs = await db.select().from(programs).orderBy(asc(programs.sortOrder));
  const linked = new Set(p ? (await db.select().from(productPrograms).where(eq(productPrograms.productId, p.id))).map((x) => x.programId) : []);
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  return (
    <div className="max-w-4xl">
      <PageHead title={p ? p.titleEn || p.titleRu : a.new} back="/admin/products" />
      <SavedBanner show={!!sp.saved && !sp.error} text={a.saved} />
      {sp.error && <p className="mb-4 rounded-xl bg-accent/15 p-3 text-sm">{ru ? "У товара есть заказы — он отключён, а не удалён." : "This product has orders — it was deactivated instead of deleted."}</p>}
      <form action={saveProduct}>
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={p} missingText={a.missing} />
            <BiField label={a.description} name="desc" row={p} area rows={2} missingText={a.missing} />
            <BiField label={ru ? "Что входит (по одному в строке)" : "Features (one per line)"} name="features" row={p} area rows={3} missingText={a.missing} />
            <div className="grid gap-4 md:grid-cols-4">
              <Select label="Type" name="type" defaultValue={p?.type ?? "program"} options={[
                ["program", ru ? "Программа" : "Program"], ["bundle", ru ? "Комплект" : "Bundle"],
                ["session", ru ? "Персональная тренировка" : "1-on-1 session"], ["consultation", ru ? "Консультация" : "Consultation"],
              ]} />
              <Field label={`${a.price}`} name="price" defaultValue={p ? (p.priceCents / 100).toFixed(2) : "19.00"} inputMode="decimal" required />
              <Field label="Currency" name="currency" defaultValue={p?.currency ?? "usd"} />
              <Field label={ru ? "Длительность занятия (мин)" : "Session length (min)"} name="durationMin" type="number" defaultValue={p?.durationMin ?? 0} />
            </div>
            <Field label={a.slug} name="slug" defaultValue={p?.slug} />
            <MediaPicker name="coverId" value={p?.coverId ?? null} label={a.cover} {...pick} />
            <div className="flex gap-6">
              <Check label={ru ? "Продаётся" : "Active"} name="active" defaultChecked={p?.active ?? true} />
              <Check label={a.featured} name="featured" defaultChecked={p?.featured} />
            </div>
          </div>
        </Section>
        <Section title={ru ? "Открывает программы" : "Unlocks programs"}>
          <div className="grid gap-2 sm:grid-cols-2">
            {progs.map((x) => (
              <label key={x.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="programIds" value={x.id} defaultChecked={linked.has(x.id)} className="h-4 w-4 accent-[var(--brand-accent)]" />
                {ru ? x.titleRu || x.titleEn : x.titleEn}
              </label>
            ))}
          </div>
        </Section>
        <Save label={a.save} />
      </form>
      {p && <form action={deleteProduct} className="mt-4"><input type="hidden" name="id" value={p.id} /><ConfirmButton label={a.delete} confirm={a.confirmDelete} /></form>}
    </div>
  );
}
