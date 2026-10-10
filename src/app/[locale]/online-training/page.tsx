import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { formatPrice, lines, tr } from "@/lib/l10n";
import { getFaqs, getSessionProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Photo } from "@/components/Photo";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  return pageMeta(locale, "/online-training", t.online.title, t.online.sub);
}

export default async function OnlinePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  const [sessions, faqs, s] = await Promise.all([getSessionProducts(), getFaqs(), getSettings()]);
  return (
    <>
      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <div className="eyebrow mb-3">1-on-1</div>
          <h1 className="display text-6xl sm:text-8xl">{t.online.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{t.online.sub}</p>
        </div>
        <Photo id={s.home.onlineImageId} locale={locale} className="aspect-[4/3] rounded-3xl" />
      </section>

      <section className="container-x grid gap-5 md:grid-cols-3">
        {sessions.map((p) => (
          <article key={p.id} className="reveal card flex flex-col p-7">
            <div className="eyebrow mb-3">{p.durationMin} min</div>
            <h2 className="display text-3xl">{tr(p, "title", locale)}</h2>
            <p className="mt-3 text-muted">{tr(p, "desc", locale)}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {lines(tr(p, "features", locale)).map((f) => <li key={f} className="flex gap-2"><span className="text-lime">✓</span>{f}</li>)}
            </ul>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="font-display text-4xl">{formatPrice(p.priceCents, p.currency, locale)}</div>
                <div className="text-xs uppercase tracking-wider text-muted">{t.common.perSession}</div>
              </div>
              <Link href={`/${locale}/book/${p.slug}`} className="btn-primary">{t.online.book}</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="container-x py-20">
        <h2 className="display mb-8 text-4xl">{t.online.how}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[t.online.step1, t.online.step2, t.online.step3, t.online.step4].map((x, i) => (
            <li key={x} className="reveal card p-6">
              <div className="font-display text-4xl text-accent">0{i + 1}</div>
              <p className="mt-3 font-semibold">{x}</p>
            </li>
          ))}
        </ol>
      </section>

      {faqs.length > 0 && (
        <section className="container-x pb-10">
          <h2 className="display mb-6 text-4xl">FAQ</h2>
          <div className="divide-y divide-line rounded-2xl border border-line">
            {faqs.map((f) => (
              <details key={f.id} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {tr(f, "q", locale)}
                  <span className="text-2xl text-accent transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{tr(f, "a", locale)}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
