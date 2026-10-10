import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { tr } from "@/lib/l10n";
import { getSettings } from "@/lib/settings";
import { getApprovedAchievements } from "@/lib/catalog";
import { Photo } from "@/components/Photo";
import { Markdown } from "@/components/Markdown";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  return pageMeta(locale, "/about", t.about.title, t.footer.tagline);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  const [s, ach] = await Promise.all([getSettings(), getApprovedAchievements()]);
  return (
    <>
      <section className="container-x grid gap-12 py-16 lg:grid-cols-[5fr_7fr] lg:py-24">
        <Photo id={s.about.photoId} locale={locale} className="aspect-[4/5] rounded-3xl lg:sticky lg:top-28 lg:h-fit" />
        <div>
          <div className="eyebrow mb-3">{t.about.eyebrow}</div>
          <h1 className="display text-6xl sm:text-8xl">{t.about.title}</h1>
          <div className="mt-8 text-lg"><Markdown text={tr(s.about, "bio", locale)} /></div>
          <Link href={`/${locale}/training`} className="btn-primary mt-6">{t.home.heroPrimary}</Link>
        </div>
      </section>
      {ach.length > 0 && (
        <section className="border-y border-line bg-surface">
          <div className="container-x py-10">
            <div className="eyebrow mb-5">{t.about.achievements}</div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ach.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-line bg-bg p-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display">★</span>
                  <span className="font-display text-lg uppercase">{tr(a, "text", locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
