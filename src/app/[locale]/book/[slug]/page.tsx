import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { fmt, getDict } from "@/i18n";
import { db, products } from "@/db";
import { formatPrice, tr } from "@/lib/l10n";
import { getSettings } from "@/lib/settings";
import { availableSlots } from "@/lib/booking";
import { getUser } from "@/lib/auth";
import { bookSession } from "@/lib/actions/shop";
import { SlotPicker } from "@/components/SlotPicker";

type P = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ taken?: string }> };

export const metadata = { robots: { index: false } };

export default async function BookPage({ params, searchParams }: P) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const { taken } = await searchParams;
  const t = getDict(locale);
  const [p] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true), inArray(products.type, ["session", "consultation"])))
    .limit(1);
  if (!p) notFound();
  const [s, user] = await Promise.all([getSettings(), getUser()]);
  const slots = await availableSlots({
    durationMin: p.durationMin || 60,
    timezone: s.coach.timezone,
    noticeHours: s.coach.noticeHours,
    windowDays: s.coach.windowDays,
    stepMin: s.coach.slotStepMin,
  });
  return (
    <div className="container-x max-w-4xl py-14">
      <Link href={`/${locale}/online-training`} className="text-sm uppercase tracking-widest text-muted hover:text-ink">← {t.online.title}</Link>
      <h1 className="display mt-6 text-4xl sm:text-6xl">{fmt(t.booking.title, { name: tr(p, "title", locale) })}</h1>
      <p className="mt-3 text-muted">{tr(p, "desc", locale)} · <span className="font-semibold text-ink">{formatPrice(p.priceCents, p.currency, locale)}</span></p>
      {taken && <p role="alert" className="mt-6 rounded-xl border border-accent/50 bg-accent/10 p-4">{t.booking.taken}</p>}
      <div className="mt-10">
        {user ? (
          <SlotPicker slots={slots} t={t.booking} locale={locale} action={bookSession} productId={p.id} />
        ) : (
          <div className="card p-6">
            <p className="text-muted">{t.booking.loginFirst}</p>
            <div className="mt-4 flex gap-3">
              <Link className="btn-primary" href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/book/${p.slug}`)}`}>{t.nav.register}</Link>
              <Link className="btn-ghost" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/book/${p.slug}`)}`}>{t.nav.login}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
