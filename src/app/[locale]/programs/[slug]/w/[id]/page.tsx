import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { db, progress } from "@/db";
import { formatPrice, lines, tr } from "@/lib/l10n";
import { getProgram, getProgramContent, productsForProgram } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { hasProgramAccess } from "@/lib/access";
import { startCheckout } from "@/lib/actions/shop";
import { Video } from "@/components/Video";
import { Photo } from "@/components/Photo";
import { RoundTimer } from "@/components/RoundTimer";
import { CompleteButton } from "@/components/CompleteButton";

type P = { params: Promise<{ locale: Locale; slug: string; id: string }> };

export async function generateMetadata({ params }: P) {
  const { locale, slug, id } = await params;
  const p = await getProgram(slug);
  if (!p) return {};
  const w = (await getProgramContent(p.id)).find((x) => x.id === Number(id));
  return { title: w ? `${tr(w, "title", locale)} — ${tr(p, "title", locale)}` : tr(p, "title", locale), robots: { index: false } };
}

export default async function WorkoutPage({ params }: P) {
  const { locale, slug, id } = await params;
  const t = getDict(locale);
  const p = await getProgram(slug);
  if (!p) notFound();
  const content = await getProgramContent(p.id);
  const idx = content.findIndex((w) => w.id === Number(id));
  if (idx < 0) notFound();
  const w = content[idx];
  const user = await getUser();
  const open = w.isPreview || (await hasProgramAccess(user, p));
  const L = (x: string) => `/${locale}${x}`;
  const here = L(`/programs/${p.slug}/w/${w.id}`);
  const [{ times }] = user
    ? await db.select({ times: count() }).from(progress).where(and(eq(progress.userId, user.id), eq(progress.workoutId, w.id)))
    : [{ times: 0 }];
  const prev = content[idx - 1];
  const next = content[idx + 1];

  return (
    <div className="container-x py-10 pb-28 sm:py-14">
      <Link href={L(`/programs/${p.slug}`)} className="text-sm uppercase tracking-widest text-muted hover:text-ink">← {tr(p, "title", locale)}</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">{String(idx + 1).padStart(2, "0")} / {String(content.length).padStart(2, "0")}</div>
          <h1 className="display text-4xl sm:text-6xl">{tr(w, "title", locale)}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{tr(w, "desc", locale)}</p>
        </div>
        {w.minutes > 0 && <span className="chip">{fmt(t.common.minutes, { n: w.minutes })}</span>}
      </div>

      {!open ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ol className="space-y-3">
            {w.exercises.map((e, i) => (
              <li key={e.id} className="card flex items-center gap-4 p-5 opacity-70">
                <span className="font-display text-2xl text-white/25">{i + 1}</span>
                <span className="font-display text-lg uppercase">{tr(e, "title", locale)}</span>
                <span className="ml-auto" aria-hidden>🔒</span>
              </li>
            ))}
          </ol>
          <aside className="glass h-fit p-6">
            <div className="display text-2xl">{t.workout.lockedTitle}</div>
            <p className="mt-2 text-sm text-muted">{t.workout.lockedText}</p>
            <div className="mt-5 space-y-3">
              {(await productsForProgram(p.id)).map((pr) => (
                <form key={pr.id} action={startCheckout}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="productId" value={pr.id} />
                  <input type="hidden" name="back" value={here} />
                  <button className={pr.type === "program" ? "btn-primary w-full" : "btn-ghost w-full"}>
                    {tr(pr, "title", locale)} · {formatPrice(pr.priceCents, pr.currency, locale)}
                  </button>
                </form>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>{w.videoId ? <Video id={w.videoId} locale={locale} /> : w.exercises[0] && <Video id={w.exercises[0].videoId} locale={locale} />}</div>
            {w.rounds > 0 && <RoundTimer t={t.workout} rounds={w.rounds} roundSec={w.roundSec} restSec={w.restSec} />}
          </div>

          <ol className="mt-12 space-y-6">
            {w.exercises.map((e, i) => (
              <li key={e.id} className="card grid gap-6 p-5 sm:p-7 lg:grid-cols-[320px_1fr]">
                {e.videoId && (i > 0 || w.videoId) ? (
                  <Video id={e.videoId} locale={locale} />
                ) : e.thumbId ? (
                  <Photo id={e.thumbId} locale={locale} className="aspect-video rounded-2xl" />
                ) : (
                  <div className="hidden lg:block">
                    <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-line font-display text-6xl text-white/10">{String(i + 1).padStart(2, "0")}</div>
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="display text-2xl sm:text-3xl"><span className="mr-3 text-accent">{i + 1}.</span>{tr(e, "title", locale)}</h2>
                    {tr(e, "dose", locale) && <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold">{tr(e, "dose", locale)}</span>}
                  </div>
                  <p className="mt-3 text-muted">{tr(e, "desc", locale)}</p>
                  {lines(tr(e, "cues", locale)).length > 0 && (
                    <>
                      <div className="eyebrow mt-5 mb-2">{t.workout.cues}</div>
                      <ul className="space-y-1.5">
                        {lines(tr(e, "cues", locale)).map((c) => (
                          <li key={c} className="flex gap-2 text-sm"><span className="text-lime">▸</span>{c}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
            <CompleteButton
              workoutId={w.id}
              label={t.workout.markComplete}
              doneLabel={t.workout.completed}
              loginLabel={t.workout.loginToSave}
              loginHref={L(`/login?next=${encodeURIComponent(here)}`)}
              loggedIn={!!user}
              times={times}
            />
            <div className="flex gap-3">
              {prev && <Link className="btn-ghost" href={L(`/programs/${p.slug}/w/${prev.id}`)}>← {t.workout.prev}</Link>}
              {next && <Link className="btn-ghost" href={L(`/programs/${p.slug}/w/${next.id}`)}>{t.workout.next} →</Link>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
