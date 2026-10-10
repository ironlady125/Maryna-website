import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { db, products, programs } from "@/db";
import { formatPrice, lines, tr } from "@/lib/l10n";
import { bundlePrograms } from "@/lib/catalog";
import { startCheckout } from "@/lib/actions/shop";

export default async function BuyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: lc, slug } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const [p] = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.active, true))).limit(1);
  if (!p) notFound();
  const ids = (await bundlePrograms(p.id)).map((x) => x.id);
  const progs = ids.length ? await db.select().from(programs).where(inArray(programs.id, ids)) : [];
  return (
    <div className="container-x max-w-3xl py-16">
      <h1 className="display text-5xl sm:text-6xl">{tr(p, "title", locale)}</h1>
      <p className="mt-4 text-lg text-muted">{tr(p, "desc", locale)}</p>
      <ul className="mt-6 space-y-2">
        {lines(tr(p, "features", locale)).map((f) => <li key={f} className="flex gap-2"><span className="text-lime">✓</span>{f}</li>)}
      </ul>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {progs.map((x) => (
          <Link key={x.id} href={`/${locale}/programs/${x.slug}`} className="card p-4 hover:border-accent/60">
            <div className="font-display text-lg uppercase">{tr(x, "title", locale)}</div>
            <div className="text-sm text-muted">{tr(x, "subtitle", locale)}</div>
          </Link>
        ))}
      </div>
      <form action={startCheckout} className="mt-10">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="productId" value={p.id} />
        <input type="hidden" name="back" value={`/${locale}/buy/${p.slug}`} />
        <button className="btn-primary !px-10 !py-4">{t.common.buy} · {formatPrice(p.priceCents, p.currency, locale)}</button>
      </form>
    </div>
  );
}
