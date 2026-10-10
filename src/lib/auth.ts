import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, users } from "@/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";

export type User = typeof users.$inferSelect;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.uid)).limit(1);
  return u ?? null;
});

export async function startSession(u: Pick<User, "id" | "role">) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession({ uid: u.id, role: u.role }), sessionCookieOptions);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireUser(locale: string, next?: string): Promise<User> {
  const u = await getUser();
  if (!u) redirect(`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await getUser();
  if (!u || u.role !== "admin") redirect(`/en/login?next=/admin`);
  return u;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertAdmin(): Promise<User> {
  const u = await getUser();
  if (!u || u.role !== "admin") throw new Error("Forbidden");
  return u;
}
