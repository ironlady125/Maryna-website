import Link from "next/link";
import { count } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { db, exercises, workouts } from "@/db";
import { formatPrice, tr } from "@/lib/l10n";
import { getSettings } from "@/lib/settings";
import {
  getApprovedAchievements, getApprovedReviews, getCategories, getFeaturedPrograms, getSessionProducts, programPrices, workoutCounts,
} from "@/lib/catalog";
import { getMedia, isPublishable, mediaUrl } from "@/lib/media";
import { getUser } from "@/lib/auth";
import { ownedProgramIds } from "@/lib/access";
import { CategoryCard, ProgramCard, SectionHead } from "@/components/Cards";
import { Photo } from "@/components/Photo";
import { Video } from "@/components/Video";
import { Markdown } from "@/components/Markdown";
import { CountUp } from "@/components/CountUp";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  const s = await getSettings();
  const h = s.home;
  const [cats, featured, sessions, reviews, achievements, user] = await Promise.all([
    getCategories(), getFeaturedPrograms(), getSessionProducts(), getApprovedReviews(), getApprovedAchievements(), getUser(),
  ]);
  const [prices, counts, owned] = await Promise.all([
    programPrices(featured.map((p) => p.id)), workoutCounts(featured.map((p) => p.id)), ownedProgramIds(user),
  ]);
  const [[{ w }], [{ e }]] = await Promise.all([
    db.select({ w: count() }).from(workouts),
    db.select({ e: count() }).from(exercises),
  ]);
  const heroVideo = await getMedia(h.heroVideoId);
  const featuredVideo = await getMedia(h.featuredVideoId);
  const L = (p: string) => `/${locale}${p}`;
  const words = tr(h, "words", locale).split(/\.\s*/).filter(Boolean);
  const bio = tr(s.about, "bio", locale).split(/\n\n/)[0] ?? "";
  const free = featured.find((p) => p.isFree);

  return (
    <>
      {/* A — Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-72px)] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {isPublishable(heroVideo) && heroVideo.kind === "video" && heroVideo.isPublic ? (
            <video className="h-full w-full object-cover" src={mediaUrl(heroVideo.id)} autoPlay muted loop playsInline poster={heroVideo.posterId ? mediaUrl(heroVideo.posterId) : undefined} />
          ) : (
            <Photo id={h.heroImageId} locale={locale} className="h-full w-full" imgClassName="object-[center_20%]" priority label={t.common.photoPlaceholder} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-bg/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        </div>
        <div className="container-x pb-16 pt-28 sm:pb-24">
          <div className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-3 w-5 rounded-sm" style={{ background: "linear-gradient(180deg,#0057b7 50%,#ffd700 50%)" }} />
            UFC · {s.brand.altName}
          </div>
          <h1 className="display max-w-5xl text-[clamp(3.2rem,11vw,9.5rem)]">{tr(h, "heroTitle", locale)}</h1>
          <div className="animate-sweep mt-6 h-1.5 w-40 rounded-full bg-gradient-to-r from-accent via-accent-2 to-lime" />
          <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{tr(h, "heroSub", locale)}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={L("/training")} className="btn-primary">{t.home.heroPrimary}</Link>
            <Link href={L("/online-training")} className="btn-ghost">{t.home.heroSecondary}</Link>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[
              [cats.filter((c) => c.kind === "training").length, locale === "ru" ? "направлений" : "disciplines"],
              [w, locale === "ru" ? "тренировок" : "workouts"],
              [e, locale === "ru" ? "упражнений" : "exercises"],
            ].map(([n, label]) => (
              <div key={String(label)} className="bg-bg/80 px-4 py-4 backdrop-blur">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl sm:text-4xl"><CountUp to={Number(n)} /></dd>
                <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Motivational words */}
      <div className="no-scrollbar overflow-x-auto border-y border-line bg-surface py-5">
        <div className="container-x flex min-w-max gap-10">
          {words.map((wd, i) => (
            <span key={wd} className={`display text-4xl sm:text-6xl ${i % 2 ? "text-transparent [-webkit-text-stroke:1.5px_var(--brand-text)]" : ""} ${i === 2 ? "!text-accent" : ""}`}>
              {wd}.
            </span>
          ))}
        </div>
      </div>

      {/* B — Categories */}
      <section className="container-x py-24" id="categories">
        <SectionHead eyebrow={t.home.categoriesEyebrow} title={t.home.categoriesTitle} sub={t.home.categoriesSub} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cats.map((c, i) => <CategoryCard key={c.id} c={c} locale={locale} index={i} />)}
        </div>
      </section>

      {/* C — Featured programs carousel */}
      <section className="py-12" id="programs">
        <div className="container-x flex items-end justify-between gap-6">
          <SectionHead eyebrow={t.home.featuredEyebrow} title={t.home.featuredTitle} />
          <Link href={L("/training")} className="mb-10 hidden text-sm uppercase tracking-widest text-accent sm:block">{t.common.viewAll} →</Link>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {featured.map((p) => (
            <ProgramCard key={p.id} p={p} locale={locale} price={prices.get(p.id)} workouts={counts.get(p.id)} owned={owned.has(p.id)} className="w-[82vw] shrink-0 snap-start sm:w-[380px]" />
          ))}
        </div>
      </section>

      {/* D — Meet your coach */}
      <section className="container-x grid items-center gap-12 py-24 lg:grid-cols-2">
        <Photo id={s.about.photoId || h.coachImageId} locale={locale} className="reveal aspect-[4/5] w-full rounded-3xl" />
        <div className="reveal">
          <div className="eyebrow mb-3">{t.home.coachEyebrow}</div>
          <h2 className="display text-5xl sm:text-7xl">{t.home.coachTitle}</h2>
          <div className="mt-6 text-lg"><Markdown text={bio} /></div>
          {achievements.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {achievements.map((a) => (
                <li key={a.id} className="rounded-full border border-line bg-surface px-4 py-2 text-sm">{tr(a, "text", locale)}</li>
              ))}
            </ul>
          )}
          <Link href={L("/about")} className="btn-ghost mt-8">{t.home.coachCta}</Link>
        </div>
      </section>

      {/* E — Train anywhere */}
      <section className="border-y border-line bg-surface">
        <div className="container-x grid items-center gap-12 py-24 lg:grid-cols-2">
          <div className="reveal">
            <div className="eyebrow mb-3">{t.home.anywhereEyebrow}</div>
            <h2 className="display text-5xl sm:text-6xl">{t.home.anywhereTitle}</h2>
            <p className="mt-5 text-lg text-muted">{t.home.anywhereText}</p>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {[t.home.anywhere1, t.home.anywhere2, t.home.anywhere3, t.home.anywhere4].map((x) => (
                <li key={x} className="glass flex items-center gap-3 p-4 text-sm">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-black">✓</span>{x}
                </li>
              ))}
            </ul>
          </div>
          <Photo id={h.anywhereImageId} locale={locale} className="reveal aspect-[4/3] w-full rounded-3xl" />
        </div>
      </section>

      {/* Free starter */}
      {free && (
        <section className="container-x py-24">
          <div className="reveal relative overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-br from-surface-2 to-bg p-8 sm:p-14">
            <div className="eyebrow !text-lime mb-3">{t.home.freeEyebrow}</div>
            <h2 className="display max-w-3xl text-4xl sm:text-6xl">{t.home.freeTitle}</h2>
            <p className="mt-4 max-w-2xl text-muted">{tr(free, "desc", locale)}</p>
            <Link href={L(`/programs/${free.slug}`)} className="btn-lime mt-8">{t.program.startFree}</Link>
          </div>
        </section>
      )}

      {/* F — Online training */}
      <section className="container-x grid items-center gap-12 py-24 lg:grid-cols-2">
        <Photo id={h.onlineImageId} locale={locale} className="reveal order-last aspect-[4/3] w-full rounded-3xl lg:order-first" />
        <div className="reveal">
          <div className="eyebrow mb-3">{t.home.onlineEyebrow}</div>
          <h2 className="display text-5xl sm:text-6xl">{t.home.onlineTitle}</h2>
          <p className="mt-5 text-lg text-muted">{t.home.onlineText}</p>
          <ul className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
            {sessions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-semibold">{tr(p, "title", locale)}</div>
                  <div className="text-sm text-muted">{tr(p, "desc", locale)}</div>
                </div>
                <div className="shrink-0 font-display text-2xl">{formatPrice(p.priceCents, p.currency, locale)}</div>
              </li>
            ))}
          </ul>
          <Link href={L("/online-training")} className="btn-primary mt-8">{t.home.onlineCta}</Link>
        </div>
      </section>

      {/* G — Featured video (only when an approved public video exists) */}
      {isPublishable(featuredVideo) && featuredVideo.kind === "video" && featuredVideo.isPublic && (
        <section className="container-x py-16">
          <SectionHead eyebrow={t.home.videoEyebrow} title={t.home.videoTitle} />
          <div className="reveal"><Video id={featuredVideo.id} locale={locale} /></div>
        </section>
      )}

      {/* H — Reviews (real, approved reviews only) */}
      {reviews.length > 0 && (
        <section className="container-x py-24">
          <SectionHead eyebrow={t.home.reviewsEyebrow} title={t.home.reviewsTitle} />
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <figure key={r.id} className="reveal card p-6">
                <div className="text-lime" aria-label={`${r.rating}/5`}>{"★".repeat(r.rating)}<span className="text-white/20">{"★".repeat(5 - r.rating)}</span></div>
                <blockquote className="mt-4 text-muted">“{r.text}”</blockquote>
                <figcaption className="mt-4 font-semibold">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* I — Final CTA */}
      <section className="container-x py-24">
        <div className="reveal relative overflow-hidden rounded-3xl bg-accent px-6 py-16 text-center sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-2 blur-3xl" />
          <h2 className="display relative mx-auto max-w-4xl text-5xl text-white sm:text-7xl">{tr(h, "finalCta", locale)}</h2>
          <Link href={L("/training")} className="btn relative mt-10 bg-black text-white hover:bg-black/80">{t.home.finalButton}</Link>
        </div>
      </section>
    </>
  );
}

