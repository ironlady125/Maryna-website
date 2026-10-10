import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { articles, db } from "@/db";
import { tr } from "@/lib/l10n";
import { Markdown } from "@/components/Markdown";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: Locale; slug: string }> };
const load = async (slug: string) =>
  (await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.published, true))).limit(1))[0];

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params;
  const a = await load(slug);
  return a ? pageMeta(locale, `/knowledge/${slug}`, tr(a, "title", locale), tr(a, "excerpt", locale)) : {};
}

export default async function ArticlePage({ params }: P) {
  const { locale, slug } = await params;
  const t = getDict(locale);
  const a = await load(slug);
  if (!a) notFound();
  return (
    <article className="container-x max-w-3xl py-16">
      <Link href={`/${locale}/knowledge`} className="text-sm uppercase tracking-widest text-muted hover:text-ink">← {t.knowledge.title}</Link>
      <h1 className="display mt-6 text-5xl sm:text-6xl">{tr(a, "title", locale)}</h1>
      <p className="mt-5 text-xl text-muted">{tr(a, "excerpt", locale)}</p>
      <div className="mt-10"><Markdown text={tr(a, "body", locale)} /></div>
    </article>
  );
}
