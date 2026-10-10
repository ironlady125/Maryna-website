import "server-only";
import { achievements, articles, categories, db, exercises, faqs, legalPages, products, programs, workouts } from "@/db";
import { missingLangs } from "@/lib/l10n";

export type MissingRow = { type: string; label: string; field: string; langs: string[]; href: string };

/** Lists every bilingual field that is filled in one language but empty in the other. */
export async function translationReport(): Promise<MissingRow[]> {
  const out: MissingRow[] = [];
  const check = (type: string, row: Record<string, unknown>, fields: string[], label: string, href: string) => {
    for (const f of fields) {
      const m = missingLangs(row, f);
      if (m.length === 1) out.push({ type, label, field: f, langs: m, href });
    }
  };
  for (const r of await db.select().from(categories)) check("Category", r, ["title", "subtitle", "desc"], r.titleEn || r.titleRu, `/admin/categories/${r.id}`);
  for (const r of await db.select().from(programs)) check("Program", r, ["title", "subtitle", "desc", "equipment"], r.titleEn || r.titleRu, `/admin/programs/${r.id}`);
  for (const r of await db.select().from(workouts)) check("Workout", r, ["title", "desc"], r.titleEn || r.titleRu, `/admin/workouts/${r.id}`);
  for (const r of await db.select().from(exercises)) check("Exercise", r, ["title", "desc", "cues", "dose"], r.titleEn || r.titleRu, `/admin/workouts/${r.workoutId}#ex-${r.id}`);
  for (const r of await db.select().from(products)) check("Product", r, ["title", "desc", "features"], r.titleEn || r.titleRu, `/admin/products/${r.id}`);
  for (const r of await db.select().from(articles)) check("Article", r, ["title", "excerpt", "body"], r.titleEn || r.titleRu, `/admin/articles/${r.id}`);
  for (const r of await db.select().from(faqs)) check("FAQ", r, ["q", "a"], r.qEn || r.qRu, `/admin/faqs`);
  for (const r of await db.select().from(achievements)) check("Achievement", r, ["text"], r.textEn || r.textRu, `/admin/achievements`);
  for (const r of await db.select().from(legalPages)) check("Legal", r, ["title", "body"], r.titleEn || r.titleRu, `/admin/legal/${r.slug}`);
  return out;
}
