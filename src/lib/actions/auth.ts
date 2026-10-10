"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { checkPassword, endSession, hashPassword, startSession } from "@/lib/auth";
import { sendTemplate } from "@/lib/email";
import { signToken, verifyToken } from "@/lib/session";
import { isLocale, type Locale } from "@/i18n/config";

type State = { error?: string; ok?: boolean } | undefined;
const loc = (v: FormDataEntryValue | null): Locale => (isLocale(v) ? v : "en");
const safeNext = (n: FormDataEntryValue | null, locale: Locale) => {
  const s = String(n || "");
  return s.startsWith("/") && !s.startsWith("//") ? s : `/${locale}/account`;
};
const site = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function login(_: State, fd: FormData): Promise<State> {
  const locale = loc(fd.get("locale"));
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !(await checkPassword(password, u.passwordHash))) return { error: "invalid" };
  await startSession(u);
  const next = safeNext(fd.get("next"), locale);
  redirect(u.role === "admin" && next === `/${locale}/account` ? "/admin" : next);
}

export async function register(_: State, fd: FormData): Promise<State> {
  const locale = loc(fd.get("locale"));
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const name = String(fd.get("name") || "").trim().slice(0, 100);
  const timezone = String(fd.get("timezone") || "UTC");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid" };
  if (password.length < 8) return { error: "passwordMin" };
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) return { error: "exists" };
  let tz = "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    tz = timezone;
  } catch {
    /* default UTC */
  }
  const [u] = await db.insert(users).values({ email, name, passwordHash: await hashPassword(password), locale, timezone: tz }).returning();
  await startSession(u);
  await sendTemplate(email, "welcome", locale, { name: name || email });
  redirect(safeNext(fd.get("next"), locale));
}

export async function logout(fd: FormData) {
  await endSession();
  redirect(`/${loc(fd.get("locale"))}`);
}

export async function forgotPassword(_: State, fd: FormData): Promise<State> {
  const locale = loc(fd.get("locale"));
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (u) {
    // The token embeds a fragment of the current hash, so it stops working once the password changes.
    const token = await signToken({ uid: u.id, h: u.passwordHash.slice(-12) }, "1h");
    await sendTemplate(u.email, "resetPassword", locale, { link: `${site()}/${locale}/reset?token=${encodeURIComponent(token)}` });
  }
  return { ok: true };
}

export async function resetPassword(_: State, fd: FormData): Promise<State> {
  const password = String(fd.get("password") || "");
  if (password.length < 8) return { error: "passwordMin" };
  const p = await verifyToken(String(fd.get("token") || ""));
  if (!p || typeof p.uid !== "number") return { error: "resetInvalid" };
  const [u] = await db.select().from(users).where(eq(users.id, p.uid)).limit(1);
  if (!u || u.passwordHash.slice(-12) !== p.h) return { error: "resetInvalid" };
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, u.id));
  return { ok: true };
}
