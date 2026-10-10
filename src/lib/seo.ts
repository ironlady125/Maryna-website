import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Language-specific metadata with hreflang alternates. `path` is the route without the locale prefix. */
export function pageMeta(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    metadataBase: new URL(base()),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, ru: `/ru${path}`, "x-default": `/en${path}` },
    },
    openGraph: { title, description, locale: locale === "ru" ? "ru_RU" : "en_US", type: "website", url: `/${locale}${path}` },
  };
}
