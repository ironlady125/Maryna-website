import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getCategories } from "@/lib/catalog";
import { CategoryCard } from "@/components/Cards";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  return pageMeta(locale, "/training", t.training.title, t.training.sub);
}

export default async function TrainingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const cats = await getCategories();
  return (
    <div className="container-x py-16 sm:py-24">
      <div className="mb-12 max-w-3xl">
        <div className="eyebrow mb-3">{t.home.categoriesEyebrow}</div>
        <h1 className="display text-6xl sm:text-8xl">{t.training.title}</h1>
        <p className="mt-5 text-lg text-muted">{t.training.sub}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => <CategoryCard key={c.id} c={c} locale={locale} index={i} />)}
      </div>
    </div>
  );
}
