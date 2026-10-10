import "server-only";
import { and, eq } from "drizzle-orm";
import { db, entitlements, exercises, media, programs, workouts } from "@/db";
import type { User } from "./auth";

type Program = typeof programs.$inferSelect;

export async function hasProgramAccess(user: User | null, program: Pick<Program, "id" | "isFree">) {
  if (program.isFree) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const [e] = await db
    .select()
    .from(entitlements)
    .where(and(eq(entitlements.userId, user.id), eq(entitlements.programId, program.id)))
    .limit(1);
  return !!e;
}

export async function ownedProgramIds(user: User | null): Promise<Set<number>> {
  if (!user) return new Set();
  const rows = await db.select({ id: entitlements.programId }).from(entitlements).where(eq(entitlements.userId, user.id));
  return new Set(rows.map((r) => r.id));
}

/** Can this visitor stream/view the given media file? */
export async function canViewMedia(user: User | null, m: typeof media.$inferSelect): Promise<boolean> {
  if (user?.role === "admin") return true;
  if (m.licenseStatus === "unverified") return false;
  if (m.kind === "image" || m.isPublic) return true;

  // Protected video: allowed when used by a preview workout or a program the user can access.
  const ws = await db
    .select({ programId: workouts.programId, isPreview: workouts.isPreview })
    .from(workouts)
    .where(eq(workouts.videoId, m.id));
  const ex = await db
    .select({ programId: workouts.programId, isPreview: workouts.isPreview })
    .from(exercises)
    .innerJoin(workouts, eq(exercises.workoutId, workouts.id))
    .where(eq(exercises.videoId, m.id));
  const tr = await db.select({ id: programs.id, isFree: programs.isFree }).from(programs).where(eq(programs.trailerId, m.id));
  if (tr.length) return true; // program trailers are promotional
  for (const r of [...ws, ...ex]) {
    if (r.isPreview) return true;
    const [p] = await db.select({ id: programs.id, isFree: programs.isFree }).from(programs).where(eq(programs.id, r.programId));
    if (p && (await hasProgramAccess(user, p))) return true;
  }
  return false;
}

