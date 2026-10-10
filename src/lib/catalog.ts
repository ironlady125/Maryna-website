import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import {
  achievements, articles, categories, db, exercises, faqs, productPrograms, products, programs, reviews, workouts,
} from "@/db";

export type Category = typeof categories.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Product = typeof products.$inferSelect;

export const getCategories = cache(() =>
  db.select().from(categories).where(eq(categories.published, true)).orderBy(asc(categories.sortOrder)),
);

export const getCategory = cache(async (slug: string) => {
  const [c] = await db.select().from(categories).where(and(eq(categories.slug, slug), eq(categories.published, true))).limit(1);
  return c ?? null;
});

export const getPrograms = cache((categoryId?: number) =>
  db
    .select()
    .from(programs)
    .where(categoryId ? and(eq(programs.published, true), eq(programs.categoryId, categoryId)) : eq(programs.published, true))
    .orderBy(asc(programs.sortOrder)),
);

export const getFeaturedPrograms = cache(() =>
  db.select().from(programs).where(and(eq(programs.published, true), eq(programs.featured, true))).orderBy(asc(programs.sortOrder)),
);

export const getProgram = cache(async (slug: string) => {
  const [p] = await db.select().from(programs).where(and(eq(programs.slug, slug), eq(programs.published, true))).limit(1);
  return p ?? null;
});

export async function getProgramContent(programId: number) {
  const ws = await db.select().from(workouts).where(eq(workouts.programId, programId)).orderBy(asc(workouts.sortOrder));
  const ex = ws.length
    ? await db.select().from(exercises).where(inArray(exercises.workoutId, ws.map((w) => w.id))).orderBy(asc(exercises.sortOrder))
    : [];
  return ws.map((w) => ({ ...w, exercises: ex.filter((e) => e.workoutId === w.id) }));
}

export async function workoutCounts(programIds: number[]) {
  if (!programIds.length) return new Map<number, number>();
  const rows = await db.select({ p: workouts.programId }).from(workouts).where(inArray(workouts.programId, programIds));
  const m = new Map<number, number>();
  rows.forEach((r) => m.set(r.p, (m.get(r.p) ?? 0) + 1));
  return m;
}

/** Active products that unlock a program, cheapest single-program product first. */
export async function productsForProgram(programId: number) {
  const rows = await db
    .select({ p: products })
    .from(productPrograms)
    .innerJoin(products, eq(products.id, productPrograms.productId))
    .where(and(eq(productPrograms.programId, programId), eq(products.active, true)));
  return rows.map((r) => r.p).sort((a, b) => (a.type === "program" ? -1 : 1) - (b.type === "program" ? -1 : 1) || a.priceCents - b.priceCents);
}

/** Lowest single-program price per program, for cards. */
export async function programPrices(programIds: number[]) {
  if (!programIds.length) return new Map<number, Product>();
  const rows = await db
    .select({ pid: productPrograms.programId, p: products })
    .from(productPrograms)
    .innerJoin(products, eq(products.id, productPrograms.productId))
    .where(and(inArray(productPrograms.programId, programIds), eq(products.active, true), eq(products.type, "program")));
  const m = new Map<number, Product>();
  rows.forEach((r) => {
    const cur = m.get(r.pid);
    if (!cur || r.p.priceCents < cur.priceCents) m.set(r.pid, r.p);
  });
  return m;
}

export const getSessionProducts = cache(() =>
  db
    .select()
    .from(products)
    .where(and(eq(products.active, true), inArray(products.type, ["session", "consultation"])))
    .orderBy(asc(products.sortOrder)),
);

export const getBundles = cache(() =>
  db.select().from(products).where(and(eq(products.active, true), eq(products.type, "bundle"))).orderBy(asc(products.sortOrder)),
);

export async function bundlePrograms(productId: number) {
  return db.select({ id: productPrograms.programId }).from(productPrograms).where(eq(productPrograms.productId, productId));
}

export const getApprovedReviews = cache(() =>
  db.select().from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)).limit(12),
);

export const getApprovedAchievements = cache(() =>
  db.select().from(achievements).where(eq(achievements.status, "approved")).orderBy(asc(achievements.sortOrder)),
);

export const getFaqs = cache(() => db.select().from(faqs).orderBy(asc(faqs.sortOrder)));

export const getArticles = cache((categoryId?: number) =>
  db
    .select()
    .from(articles)
    .where(categoryId ? and(eq(articles.published, true), eq(articles.categoryId, categoryId)) : eq(articles.published, true))
    .orderBy(asc(articles.sortOrder)),
);
