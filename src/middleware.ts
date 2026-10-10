import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/i18n/config";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

function preferredLocale(req: NextRequest) {
  const c = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const al = req.headers.get("accept-language") || "";
  if (/^(ru|uk|be|kk)\b/i.test(al.split(",")[0] || "")) return "ru";
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!s || s.role !== "admin") {
      return NextResponse.redirect(new URL(`/${preferredLocale(req)}/login?next=${encodeURIComponent(pathname)}`, req.url));
    }
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1];
  if (!isLocale(seg)) {
    return NextResponse.redirect(new URL(`/${preferredLocale(req)}${pathname === "/" ? "" : pathname}${search}`, req.url));
  }

  if (pathname.startsWith(`/${seg}/account`)) {
    const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!s) return NextResponse.redirect(new URL(`/${seg}/login?next=${encodeURIComponent(pathname)}`, req.url));
  }

  const res = NextResponse.next();
  if (req.cookies.get(LOCALE_COOKIE)?.value !== seg) {
    res.cookies.set(LOCALE_COOKIE, seg, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|media|_next|favicon|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
