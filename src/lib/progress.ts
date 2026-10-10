import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db, entitlements, programs, progress, workouts } from "@/db";
import type { User } from "./auth";

/** Programs available to a member (purchased + free) with completion stats. */
export async function memberPrograms(user: User) {
  const ent = await db.select({ id: entitlements.programId }).from(entitlements).where(eq(entitlements.userId, user.id));
  const done = await db.select().from(progress).where(eq(progress.userId, user.id));
  const startedIds = new Set(done.map((d) => d.programId));
  const ids = [...new Set([...ent.map((e) => e.id), ...startedIds])];
  const rows = ids.length ? await db.select().from(programs).where(inArray(programs.id, ids)) : [];
  const ws = ids.length ? await db.select({ id: workouts.id, programId: workouts.programId }).from(workouts).where(inArray(workouts.programId, ids)) : [];
  return rows
    .filter((p) => p.isFree || ent.some((e) => e.id === p.id) || (user.role === "admin" && startedIds.has(p.id)))
    .map((p) => {
      const total = ws.filter((w) => w.programId === p.id);
      const completed = new Set(done.filter((d) => d.programId === p.id).map((d) => d.workoutId));
      const next = total.find((w) => !completed.has(w.id)) ?? total[0];
      return { program: p, total: total.length, completed: completed.size, nextWorkoutId: next?.id ?? null, owned: ent.some((e) => e.id === p.id) };
    })
    .sort((a, b) => b.completed - a.completed);
}

export async function memberStats(user: User) {
  const rows = await db.select().from(progress).where(eq(progress.userId, user.id)).orderBy(desc(progress.completedAt));
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: user.timezone || "UTC" }).format(d);
  const days = new Set(rows.map((r) => dayKey(r.completedAt)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const weekAgo = Date.now() - 7 * 86400_000;
  return {
    total: rows.length,
    minutes: Math.round(rows.reduce((s, r) => s + r.seconds, 0) / 60),
    streak,
    week: rows.filter((r) => r.completedAt.getTime() > weekAgo).length,
    recent: rows.slice(0, 8),
  };
}
