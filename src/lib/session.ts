import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mm_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (16+ characters)");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { uid: number; role: "user" | "admin" };

export async function signSession(p: SessionPayload) {
  return new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.uid !== "number") return null;
    return { uid: payload.uid, role: payload.role === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}

/** Short-lived signed token for password reset links. */
export async function signToken(data: Record<string, unknown>, ttl: string) {
  return new SignJWT(data).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl).sign(key());
}
export async function verifyToken(token: string) {
  try {
    return (await jwtVerify(token, key())).payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
  path: "/",
  maxAge: MAX_AGE,
};
