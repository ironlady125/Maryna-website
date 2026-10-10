import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, products } from "@/db";
import { adminDict } from "@/admin/i18n";
import { PageHead } from "@/admin/ui";
import { Sortable } from "@/admin/client";
import { formatPrice } from "@/lib/l10n";

export default async function ProductsPage() {
  const { a, lang } = await adminDict();
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder));
  return (
    <div className="max-w-4xl">
      <PageHead title={a.products} actions={<Link href="/admin/products/new" className="btn-primary !py-2">+ {a.new}</Link>} />
      <Sortable table="products" hint={a.sortHint} items={rows.map((p) => ({
        id: p.id, label: `${lang === "ru" ? p.titleRu || p.titleEn : p.titleEn} — ${formatPrice(p.priceCents, p.currency, lang)}`,
        sub: `${p.type}${p.durationMin ? ` · ${p.durationMin} min` : ""}${p.active ? "" : " · inactive"}`, href: `/admin/products/${p.id}`,
      }))} />
    </div>
  );
}
