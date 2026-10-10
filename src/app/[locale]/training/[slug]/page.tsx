import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { tr } from "@/lib/l10n";
import { getArticles, getBundles, bundlePrograms, getCategory, getPrograms, programPrices, workoutCounts } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { ownedProgramIds } from "@/lib/access";
import { ProgramCard } from "@/components/Cards";
import { Photo } from "@/components/Photo";
import { pageMeta } from "@/lib/seo";
import { formatPrice } from "@/lib/l10n";

type P = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params;
  const c = await getCategory(slug);
  return c ? pageMeta(locale, `/training/${slug}`, tr(c, "title", locale), tr(c, "subtitle", locale)) : {};
}

export default async function CategoryPage({ params }: P) {
  const { locale, slug } = await params;
  const t = getDict(locale);
  const c = await getCategory(slug);
  if (!c) notFound();
  if (c.kind === "service") redirect(`/${locale}/online-training`);
  const [progs, user, arts, bundles] = await Promise.all([getPrograms(c.id), getUser(), getArticles(c.id), getBundles()]);
  const [prices, counts, owned] = await Promise.all([
    programPrices(progs.map((p) => p.id)), workoutCounts(progs.map((p) => p.id)), ownedProgramIds(user),
  ]);
  const ids = new Set(progs.map((p) => p.id));
  const relevantBundles = [];
  for (const b of bundles) {
    const bp = await bundlePrograms(b.id);
    if (bp.some((x) => ids.has(x.id))) relevantBundles.push(b);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Photo id={c.coverId} locale={locale} className="absolute inset-0 -z-10 h-full w-full opacity-60" label={tr(c, "title", locale)} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
        <div className="container-x py-20 sm:py-28">
          <Link href={`/${locale}/training`} className="text-sm uppercase tracking-widest text-muted hover:text-ink">← {t.training.title}</Link>
          <h1 className="display mt-6 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">{tr(c, "title", locale)}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">{tr(c, "subtitle", locale)}</p>
          {tr(c, "desc", locale) && <p className="mt-3 max-w-2xl text-muted/80">{tr(c, "desc", locale)}</p>}
          {c.slug === "acl" && (
            <p className="mt-6 max-w-2xl rounded-2xl border border-lime/30 bg-lime/5 p-4 text-sm text-muted">{t.training.aclNote}</p>
          )}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="eyebrow mb-6">{t.training.programsIn}</div>
        {progs.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {progs.map((p) => (
              <ProgramCard key={p.id} p={p} locale={locale} price={prices.get(p.id)} workouts={counts.get(p.id)} owned={owned.has(p.id)} />
            ))}
          </div>
        ) : (
          <p className="text-muted">{t.training.noPrograms}</p>
        )}

        {relevantBundles.map((b) => (
          <div key={b.id} className="reveal mt-10 flex flex-col items-start justify-between gap-6 rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/15 to-transparent p-8 sm:flex-row sm:items-center">
            <div>
              <div className="eyebrow mb-2">{t.program.alsoIn}</div>
              <div className="display text-3xl">{tr(b, "title", locale)}</div>
              <p className="mt-2 text-muted">{tr(b, "desc", locale)}</p>
            </div>
            <Link href={`/${locale}/buy/${b.slug}`} className="btn-primary shrink-0">
              {t.common.buy} · {formatPrice(b.priceCents, b.currency, locale)}
            </Link>
          </div>
        ))}

        {arts.length > 0 && (
          <div className="mt-16">
            <div className="eyebrow mb-6">{t.training.articles}</div>
            <div className="grid gap-4 md:grid-cols-2">
              {arts.map((a) => (
                <Link key={a.id} href={`/${locale}/knowledge/${a.slug}`} className="card block p-6 transition hover:border-accent/60">
                  <div className="display text-2xl">{tr(a, "title", locale)}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{tr(a, "excerpt", locale)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
