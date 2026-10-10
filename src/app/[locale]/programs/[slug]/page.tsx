import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { db, progress } from "@/db";
import { formatPrice, tr } from "@/lib/l10n";
import { getCategories, getProgram, getProgramContent, productsForProgram } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { hasProgramAccess } from "@/lib/access";
import { startCheckout } from "@/lib/actions/shop";
import { Photo } from "@/components/Photo";
import { Video } from "@/components/Video";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const p = await getProgram(slug);
  return p ? pageMeta(locale, `/programs/${slug}`, tr(p, "title", locale), tr(p, "subtitle", locale)) : {};
}

export default async function ProgramPage({ params }: P) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const p = await getProgram(slug);
  if (!p) notFound();
  const [content, user, prods, cats] = await Promise.all([getProgramContent(p.id), getUser(), productsForProgram(p.id), getCategories()]);
  const access = await hasProgramAccess(user, p);
  const cat = cats.find((c) => c.id === p.categoryId);
  const done = user
    ? new Set((await db.select({ w: progress.workoutId }).from(progress).where(and(eq(progress.userId, user.id), eq(progress.programId, p.id)))).map((r) => r.w))
    : new Set<number>();
  const first = content.find((w) => !done.has(w.id)) ?? content[0];
  const L = (x: string) => `/${locale}${x}`;
  const preview = content.find((w) => w.isPreview);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Photo id={p.coverId} locale={locale} className="absolute inset-0 -z-10 h-full w-full opacity-50" label="" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/85 to-bg/30" />
        <div className="container-x grid gap-10 py-16 lg:grid-cols-[1fr_380px] lg:py-24">
          <div>
            {cat && <Link href={L(`/training/${cat.slug}`)} className="text-sm uppercase tracking-widest text-muted hover:text-ink">← {tr(cat, "title", locale)}</Link>}
            <h1 className="display mt-6 text-5xl sm:text-7xl">{tr(p, "title", locale)}</h1>
            <p className="mt-4 text-xl text-muted">{tr(p, "subtitle", locale)}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip">{t.common.levels[p.level]}</span>
              <span className="chip">{fmt(t.common.workouts, { n: content.length })}</span>
              {p.weeks > 0 && <span className="chip">{fmt(t.common.weeks, { n: p.weeks })}</span>}
              {p.isFree && <span className="chip !border-lime !text-lime">{t.common.free}</span>}
            </div>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">{tr(p, "desc", locale)}</p>
            {tr(p, "equipment", locale) && (
              <p className="mt-4 text-sm text-muted"><span className="text-ink">{t.program.equipmentNeeded}:</span> {tr(p, "equipment", locale)}</p>
            )}
            {cat?.slug === "acl" && <p className="mt-6 max-w-2xl rounded-2xl border border-lime/30 bg-lime/5 p-4 text-sm text-muted">{t.training.aclNote}</p>}
          </div>

          <aside className="glass h-fit p-6">
            {access ? (
              <>
                <div className="eyebrow mb-2">{p.isFree ? t.common.free : t.common.owned}</div>
                <p className="text-muted">{fmt(t.program.progress, { done: done.size, total: content.length })}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-lime" style={{ width: `${content.length ? (done.size / content.length) * 100 : 0}%` }} />
                </div>
                {first && <Link href={L(`/programs/${p.slug}/w/${first.id}`)} className="btn-primary mt-6 w-full">{done.size ? t.common.continue : t.common.startTraining}</Link>}
                {!user && <p className="mt-3 text-xs text-muted">{t.program.loginToTrack}</p>}
              </>
            ) : (
              <>
                <div className="display text-3xl">{t.program.unlock}</div>
                <p className="mt-2 text-sm text-muted">{t.program.unlockText}</p>
                <div className="mt-6 space-y-3">
                  {prods.map((pr) => (
                    <form key={pr.id} action={startCheckout}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="productId" value={pr.id} />
                      <input type="hidden" name="back" value={L(`/programs/${p.slug}`)} />
                      <button className={pr.type === "program" ? "btn-primary w-full" : "btn-ghost w-full"}>
                        {pr.type === "program" ? fmt(t.common.buyFor, { price: formatPrice(pr.priceCents, pr.currency, locale) }) : `${tr(pr, "title", locale)} · ${formatPrice(pr.priceCents, pr.currency, locale)}`}
                      </button>
                    </form>
                  ))}
                </div>
                {preview && <Link href={L(`/programs/${p.slug}/w/${preview.id}`)} className="mt-4 block text-center text-sm uppercase tracking-widest text-lime">{t.program.previewBadge}: {tr(preview, "title", locale)} →</Link>}
              </>
            )}
          </aside>
        </div>
      </section>

      {p.trailerId && (
        <section className="container-x pt-14"><Video id={p.trailerId} locale={locale} /></section>
      )}

      <section className="container-x py-14">
        <h2 className="display mb-8 text-4xl">{t.program.inside}</h2>
        <ol className="space-y-3">
          {content.map((w, i) => {
            const open = access || w.isPreview;
            return (
              <li key={w.id} className="reveal">
                <Link href={L(`/programs/${p.slug}/w/${w.id}`)} className="card group flex items-center gap-5 p-5 transition hover:border-accent/60">
                  <span className="font-display text-3xl text-white/25 group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl uppercase">{tr(w, "title", locale)}</h3>
                      {w.isPreview && !access && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase text-black">{t.program.previewBadge}</span>}
                      {done.has(w.id) && <span className="text-lime">✓</span>}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted">{tr(w, "desc", locale)}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted/70">
                      {w.minutes ? fmt(t.common.minutes, { n: w.minutes }) : ""} · {fmt(t.common.exercises, { n: w.exercises.length })}
                      {w.rounds ? ` · ${w.rounds} × ${Math.round(w.roundSec / 60 * 10) / 10}′` : ""}
                    </p>
                  </div>
                  <span className="text-xl text-muted" aria-hidden>{open ? "→" : "🔒"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
