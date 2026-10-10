import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Oswald } from "next/font/google";
import "../globals.css";
import { isLocale, locales } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { BrandStyle } from "@/components/BrandStyle";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { pageMeta } from "@/lib/seo";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin", "cyrillic"], variable: "--font-oswald", weight: ["500", "600", "700"], display: "swap" });

export const dynamic = "force-dynamic";
export const generateStaticParams = () => locales.map((locale) => ({ locale }));
export const viewport: Viewport = { themeColor: "#09090B", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const s = await getSettings();
  const m = pageMeta(locale, "", locale === "ru" ? s.seo.titleRu : s.seo.titleEn, locale === "ru" ? s.seo.descRu : s.seo.descEn);
  return { ...m, title: { default: m.title as string, template: `%s — ${s.brand.name}` } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const s = await getSettings();
  return (
    <html lang={locale} className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <BrandStyle colors={s.colors} />
      </head>
      <body className="min-h-screen bg-bg text-ink">
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
        <Reveal />
      </body>
    </html>
  );
}
