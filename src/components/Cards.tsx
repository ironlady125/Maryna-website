import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { formatPrice, tr } from "@/lib/l10n";
import type { Category, Product, Program } from "@/lib/catalog";
import { Photo } from "./Photo";

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`reveal mb-10 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </div>
  );
}

export function CategoryCard({ c, locale, index }: { c: Category; locale: Locale; index: number }) {
  const t = getDict(locale);
  const href = c.kind === "service" ? `/${locale}/online-training` : `/${locale}/training/${c.slug}`;
  return (
    <Link href={href} className="reveal group relative block overflow-hidden rounded-2xl border border-line bg-surface">
      <Photo id={c.coverId} locale={locale} className="aspect-[4/5] w-full" imgClassName="transition duration-700 group-hover:scale-105" label={tr(c, "title", locale)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="font-display text-sm text-lime">{String(index + 1).padStart(2, "0")}</div>
        <h3 className="display mt-1 text-2xl sm:text-3xl">{tr(c, "title", locale)}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/75">{tr(c, "subtitle", locale)}</p>
        <span className="mt-4 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-accent transition group-hover:gap-3">
          {t.common.explore} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export function ProgramCard({
  p, locale, price, workouts, owned, className = "",
}: { p: Program; locale: Locale; price?: Product; workouts?: number; owned?: boolean; className?: string }) {
  const t = getDict(locale);
  return (
    <Link href={`/${locale}/programs/${p.slug}`} className={`reveal group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent/60 ${className}`}>
      <div className="relative">
        <Photo id={p.coverId} locale={locale} className="aspect-[16/10] w-full" imgClassName="transition duration-700 group-hover:scale-105" label={tr(p, "title", locale)} />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] uppercase tracking-wider backdrop-blur">{t.common.levels[p.level]}</span>
          {p.isFree && <span className="rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">{t.common.free}</span>}
          {owned && <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{t.common.owned}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-2xl">{tr(p, "title", locale)}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{tr(p, "subtitle", locale)}</p>
        <div className="mt-auto flex items-end justify-between pt-5 text-sm">
          <span className="text-muted">
            {workouts ? fmt(t.common.workouts, { n: workouts }) : ""}
            {p.weeks ? ` · ${fmt(t.common.weeks, { n: p.weeks })}` : ""}
          </span>
          {!p.isFree && price && !owned && <span className="font-display text-xl">{formatPrice(price.priceCents, price.currency, locale)}</span>}
        </div>
      </div>
    </Link>
  );
}
