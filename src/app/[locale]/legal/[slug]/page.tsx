import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db, legalPages } from "@/db";
import { tr } from "@/lib/l10n";
import { Markdown } from "@/components/Markdown";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string; slug: string }> };
const load = async (slug: string) => (await db.select().from(legalPages).where(eq(legalPages.slug, slug)).limit(1))[0];

export async function generateMetadata({ params }: P) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const l = await load(slug);
  return l ? pageMeta(locale, `/legal/${slug}`, tr(l, "title", locale), tr(l, "title", locale)) : {};
}

export default async function LegalPage({ params }: P) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const l = await load(slug);
  if (!l) notFound();
  return (
    <div className="container-x max-w-3xl py-16">
      <h1 className="display text-5xl">{tr(l, "title", locale)}</h1>
      <div className="mt-10"><Markdown text={tr(l, "body", locale)} /></div>
    </div>
  );
}
