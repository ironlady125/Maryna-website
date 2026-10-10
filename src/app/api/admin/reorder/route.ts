import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { achievements, articles, categories, db, exercises, faqs, media, products, programs, workouts } from "@/db";
import { assertAdmin } from "@/lib/auth";

const TABLES = { categories, programs, workouts, exercises, products, achievements, articles, faqs, media } as const;

export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { table, ids } = (await req.json()) as { table: keyof typeof TABLES; ids: number[] };
  const t = TABLES[table];
  if (!t || !Array.isArray(ids)) return new NextResponse("Bad request", { status: 400 });
  for (const [i, id] of ids.entries()) await db.update(t).set({ sortOrder: i }).where(eq(t.id, Number(id)));
  return NextResponse.json({ ok: true });
}
