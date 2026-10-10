import Link from "next/link";
import { Inter, Oswald } from "next/font/google";
import "../globals.css";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { adminDict } from "@/admin/i18n";
import { BrandStyle } from "@/components/BrandStyle";
import { AdminNav } from "@/admin/AdminNav";
import { setAdminLang } from "@/admin/actions";
import { logout } from "@/lib/actions/auth";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin", "cyrillic"], variable: "--font-oswald", weight: ["500", "600", "700"], display: "swap" });

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const s = await getSettings();
  const { a, lang } = await adminDict();
  const nav: [string, string, string][] = [
    ["/admin", a.dashboard, "◉"], ["/admin/settings", a.settings, "⚙"], ["/admin/media", a.media, "▣"],
    ["/admin/categories", a.categories, "▤"], ["/admin/programs", a.programs, "▶"], ["/admin/products", a.products, "$"],
    ["/admin/orders", a.orders, "≡"], ["/admin/bookings", a.bookings, "◷"], ["/admin/users", a.users, "☺"],
    ["/admin/reviews", a.reviews, "★"], ["/admin/achievements", a.achievements, "♛"], ["/admin/articles", a.articles, "✎"],
    ["/admin/faqs", a.faqs, "?"], ["/admin/legal", a.legal, "§"], ["/admin/emails", a.emails, "✉"], ["/admin/translations", a.translations, "⇄"],
  ];
  return (
    <html lang={lang} className={`${inter.variable} ${oswald.variable}`}>
      <head><BrandStyle colors={s.colors} /></head>
      <body className="min-h-screen bg-bg text-ink">
        <div className="lg:grid lg:grid-cols-[250px_1fr]">
          <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between p-5">
              <Link href="/admin" className="font-display text-lg leading-tight">{s.brand.name}<span className="block text-xs text-accent">ADMIN</span></Link>
            </div>
            <AdminNav items={nav} />
            <div className="space-y-3 border-t border-line p-5 text-sm">
              <form action={setAdminLang} className="flex items-center gap-2">
                <span className="text-muted">{a.language}:</span>
                <button name="lang" value="en" className={lang === "en" ? "text-accent" : "text-muted"}>EN</button>
                <button name="lang" value="ru" className={lang === "ru" ? "text-accent" : "text-muted"}>RU</button>
              </form>
              <Link href="/en" className="block text-muted hover:text-ink">↗ {a.viewSite}</Link>
              <form action={logout}><input type="hidden" name="locale" value="en" /><button className="text-muted hover:text-ink">{a.logout}</button></form>
            </div>
          </aside>
          <main className="min-w-0 p-4 sm:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
