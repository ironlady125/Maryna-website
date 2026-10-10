import Link from "next/link";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { bookings, db, products, programs, workouts } from "@/db";
import { tr } from "@/lib/l10n";
import { requireUser } from "@/lib/auth";
import { memberPrograms, memberStats } from "@/lib/progress";
import { formatInZone } from "@/lib/booking";

export default async function AccountHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const user = await requireUser(locale);
  const [progs, stats] = await Promise.all([memberPrograms(user), memberStats(user)]);
  const [next] = await db
    .select({ b: bookings, p: products })
    .from(bookings)
    .innerJoin(products, eq(products.id, bookings.productId))
    .where(and(eq(bookings.userId, user.id), eq(bookings.status, "confirmed"), gte(bookings.endAt, new Date())))
    .orderBy(asc(bookings.startAt))
    .limit(1);
  const wIds = [...new Set(stats.recent.map((r) => r.workoutId))];
  const ws = wIds.length
    ? await db.select({ w: workouts, p: programs }).from(workouts).innerJoin(programs, eq(programs.id, workouts.programId)).where(inArray(workouts.id, wIds))
    : [];
  const L = (p: string) => `/${locale}${p}`;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [stats.total, t.account.totalWorkouts],
          [stats.minutes, t.account.totalMinutes],
          [stats.streak, t.account.streak],
          [stats.week, t.account.thisWeek],
        ].map(([n, label]) => (
          <div key={String(label)} className="card p-5">
            <div className="font-display text-4xl sm:text-5xl">{n}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted">{label}</div>
          </div>
        ))}
      </section>

      {next && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-lime/40 bg-lime/10 p-6">
          <div>
            <div className="eyebrow !text-lime mb-1">{t.account.upcoming}</div>
            <div className="font-display text-2xl uppercase">{tr(next.p, "title", locale)}</div>
            <div className="text-muted">{formatInZone(next.b.startAt, user.timezone, locale)}</div>
          </div>
          {next.b.meetingUrl && <a href={next.b.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-lime">{t.account.joinLink}</a>}
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="display text-3xl">{t.account.myPrograms}</h2>
          <Link href={L("/training")} className="text-sm uppercase tracking-widest text-accent">{t.account.browse} →</Link>
        </div>
        {progs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {progs.slice(0, 4).map(({ program: p, total, completed, nextWorkoutId }) => (
              <Link key={p.id} href={nextWorkoutId ? L(`/programs/${p.slug}/w/${nextWorkoutId}`) : L(`/programs/${p.slug}`)} className="card block p-5 transition hover:border-accent/60">
                <div className="font-display text-xl uppercase">{tr(p, "title", locale)}</div>
                <div className="mt-1 text-sm text-muted">{fmt(t.program.progress, { done: completed, total })}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-lime" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} /></div>
                <div className="mt-4 text-sm uppercase tracking-widest text-accent">{completed ? t.common.continue : t.common.start} →</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-6">
            <p className="text-muted">{t.account.noPrograms}</p>
            <Link href={L("/training")} className="btn-primary mt-4">{t.account.browse}</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="display mb-5 text-3xl">{t.account.recent}</h2>
        {stats.recent.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {stats.recent.map((r) => {
              const x = ws.find((y) => y.w.id === r.workoutId);
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                  <span><span className="text-lime">✓</span> {x ? `${tr(x.w, "title", locale)} · ${tr(x.p, "title", locale)}` : "—"}</span>
                  <span className="shrink-0 text-muted">{new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", timeZone: user.timezone }).format(r.completedAt)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">{t.account.noActivity}</p>
        )}
      </section>
    </div>
  );
}
