import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { tr } from "@/lib/l10n";
import { getArticles } from "@/lib/catalog";
import { Photo } from "@/components/Photo";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  return pageMeta(locale, "/knowledge", t.knowledge.title, t.knowledge.sub);
}

export default async function KnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const arts = await getArticles();
  return (
    <div className="container-x py-16 sm:py-24">
      <h1 className="display text-6xl sm:text-8xl">{t.knowledge.title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">{t.knowledge.sub}</p>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {arts.map((a) => (
          <Link key={a.id} href={`/${locale}/knowledge/${a.slug}`} className="reveal card group overflow-hidden transition hover:border-accent/60">
            <Photo id={a.coverId} locale={locale} className="aspect-[16/9]" label={tr(a, "title", locale)} />
            <div className="p-6">
              <h2 className="display text-2xl">{tr(a, "title", locale)}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{tr(a, "excerpt", locale)}</p>
              <span className="mt-4 inline-block text-sm uppercase tracking-widest text-accent">{t.knowledge.read} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
