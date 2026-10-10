import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { categories, db, productPrograms, products, programs, workouts } from "@/db";
import { adminDict } from "@/admin/i18n";
import { BiField, Check, Field, PageHead, Save, SavedBanner, Section, Select } from "@/admin/ui";
import { ConfirmButton, MediaPicker, Sortable } from "@/admin/client";
import { deleteProgram, saveProgram, saveWorkout } from "@/admin/actions";
import { formatPrice, missingLangs } from "@/lib/l10n";

export default async function ProgramEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const p = id === "new" ? null : (await db.select().from(programs).where(eq(programs.id, Number(id))).limit(1))[0];
  if (id !== "new" && !p) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const ws = p ? await db.select().from(workouts).where(eq(workouts.programId, p.id)).orderBy(asc(workouts.sortOrder)) : [];
  const prods = p
    ? await db.select({ p: products }).from(productPrograms).innerJoin(products, eq(products.id, productPrograms.productId)).where(eq(productPrograms.programId, p.id))
    : [];
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  return (
    <div className="max-w-5xl">
      <PageHead
        title={p ? (ru ? p.titleRu || p.titleEn : p.titleEn || p.titleRu) : a.new}
        back="/admin/programs"
        actions={p && <a href={`/${lang}/programs/${p.slug}`} target="_blank" className="btn-ghost !py-2">↗ {a.viewSite}</a>}
      />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveProgram}>
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <Section>
          <div className="space-y-4">
            <BiField label={a.title} name="title" row={p} missingText={a.missing} />
            <BiField label={a.subtitle} name="subtitle" row={p} missingText={a.missing} />
            <BiField label={a.description} name="desc" row={p} area rows={4} missingText={a.missing} />
            <BiField label={a.equipment} name="equipment" row={p} missingText={a.missing} />
            <div className="grid gap-4 md:grid-cols-4">
              <Select label={a.category} name="categoryId" defaultValue={p?.categoryId} options={cats.map((c) => [c.id, ru ? c.titleRu : c.titleEn])} />
              <Select label={a.level} name="level" defaultValue={p?.level ?? "all"} options={[["beginner", ru ? "Новичок" : "Beginner"], ["intermediate", ru ? "Средний" : "Intermediate"], ["advanced", ru ? "Продвинутый" : "Advanced"], ["all", ru ? "Любой" : "All levels"]]} />
              <Field label={a.weeks} name="weeks" type="number" defaultValue={p?.weeks ?? 4} />
              <Field label={a.slug} name="slug" defaultValue={p?.slug} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MediaPicker name="coverId" value={p?.coverId ?? null} label={a.cover} {...pick} />
              <MediaPicker name="trailerId" value={p?.trailerId ?? null} kind="video" label={a.trailer} {...pick} />
            </div>
            <div className="flex flex-wrap gap-6">
              <Check label={a.published} name="published" defaultChecked={p?.published ?? true} />
              <Check label={a.featured} name="featured" defaultChecked={p?.featured} />
              <Check label={a.free} name="isFree" defaultChecked={p?.isFree} />
            </div>
            {!p && (
              <div className="grid items-end gap-4 rounded-xl border border-line p-4 md:grid-cols-2">
                <Check label={ru ? "Сразу создать товар для продажи" : "Create a product to sell it"} name="createProduct" defaultChecked />
                <Field label={`${a.price} (USD)`} name="price" defaultValue="19" inputMode="decimal" />
              </div>
            )}
          </div>
        </Section>
        <Save label={a.save} />
      </form>

      {p && (
        <>
          <Section title={a.products}>
            <ul className="space-y-2 text-sm">
              {prods.map(({ p: pr }) => (
                <li key={pr.id}><Link className="hover:text-accent" href={`/admin/products/${pr.id}`}>{pr.titleEn} — {formatPrice(pr.priceCents, pr.currency, lang)} {pr.active ? "" : "(inactive)"}</Link></li>
              ))}
              {!prods.length && <li className="text-muted">{p.isFree ? a.free : a.none}</li>}
            </ul>
            <Link href="/admin/products/new" className="mt-3 inline-block text-sm text-accent">+ {a.new}</Link>
          </Section>
          <Section title={a.workouts}>
            <Sortable table="workouts" hint={a.sortHint} items={ws.map((w) => ({
              id: w.id, label: ru ? w.titleRu || w.titleEn : w.titleEn || w.titleRu,
              sub: `${w.minutes} min${w.rounds ? ` · ${w.rounds}×${w.roundSec}s` : ""}${w.isPreview ? " · preview" : ""}`,
              href: `/admin/workouts/${w.id}`,
              badge: ["title", "desc"].some((f) => missingLangs(w, f).length === 1) ? a.missing : undefined,
            }))} />
            <form action={saveWorkout} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="programId" value={p.id} />
              <input type="hidden" name="minutes" value="20" />
              <label className="flex-1"><span className="label">{a.title} EN</span><input className="input" name="titleEn" required /></label>
              <label className="flex-1"><span className="label">{a.title} RU</span><input className="input" name="titleRu" /></label>
              <button className="btn-primary !py-3">+ {a.add}</button>
            </form>
          </Section>
          <form action={deleteProgram}><input type="hidden" name="id" value={p.id} /><ConfirmButton label={a.delete} confirm={a.confirmDelete} /></form>
        </>
      )}
    </div>
  );
}
