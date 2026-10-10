"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, programs, progress, reviews, users, workouts } from "@/db";
import { getUser, hashPassword } from "@/lib/auth";
import { hasProgramAccess } from "@/lib/access";
import { isLocale } from "@/i18n/config";

export async function completeWorkout(workoutId: number, seconds: number) {
  const u = await getUser();
  if (!u) return { ok: false as const, error: "login" };
  const [w] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
  if (!w) return { ok: false as const, error: "not-found" };
  const [p] = await db.select().from(programs).where(eq(programs.id, w.programId)).limit(1);
  if (!p || !(w.isPreview || (await hasProgramAccess(u, p)))) return { ok: false as const, error: "forbidden" };
  await db.insert(progress).values({
    userId: u.id,
    workoutId: w.id,
    programId: w.programId,
    seconds: Math.max(0, Math.min(Math.round(seconds) || w.minutes * 60, 4 * 3600)),
  });
  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

export async function submitReview(_: unknown, fd: FormData) {
  const u = await getUser();
  if (!u) return { ok: false };
  const text = String(fd.get("text") || "").trim().slice(0, 2000);
  const rating = Math.min(5, Math.max(1, Number(fd.get("rating")) || 5));
  const locale = isLocale(fd.get("locale")) ? (fd.get("locale") as "en" | "ru") : "en";
  if (text.length < 10) return { ok: false };
  await db.insert(reviews).values({ userId: u.id, name: u.name || u.email.split("@")[0], text, rating, locale, status: "pending" });
  return { ok: true };
}

export async function updateProfile(_: unknown, fd: FormData) {
  const u = await getUser();
  if (!u) return { ok: false, error: "login" };
  const name = String(fd.get("name") || "").trim().slice(0, 100);
  const locale = isLocale(fd.get("locale")) ? (fd.get("locale") as "en" | "ru") : u.locale;
  const tz = String(fd.get("timezone") || u.timezone);
  let timezone = u.timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    timezone = tz;
  } catch {
    /* keep previous */
  }
  const pw = String(fd.get("password") || "");
  if (pw && pw.length < 8) return { ok: false, error: "password" };
  await db
    .update(users)
    .set({ name, locale, timezone, ...(pw ? { passwordHash: await hashPassword(pw) } : {}) })
    .where(and(eq(users.id, u.id)));
  return { ok: true };
}
