import Link from "next/link";
import { asc } from "drizzle-orm";
import { categories, db } from "@/db";
import { adminDict } from "@/admin/i18n";
import { PageHead } from "@/admin/ui";
import { Sortable } from "@/admin/client";
import { missingLangs } from "@/lib/l10n";

export default async function CategoriesPage() {
  const { a } = await adminDict();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return (
    <div className="max-w-4xl">
      <PageHead title={a.categories} actions={<Link href="/admin/categories/new" className="btn-primary !py-2">+ {a.new}</Link>} />
      <Sortable table="categories" hint={a.sortHint} items={rows.map((c) => ({
        id: c.id, label: `${c.titleEn} / ${c.titleRu}`, sub: `/${c.slug}${c.published ? "" : " · draft"}`, href: `/admin/categories/${c.id}`,
        badge: ["title", "subtitle", "desc"].some((f) => missingLangs(c, f).length === 1) ? a.missing : undefined,
      }))} />
    </div>
  );
}
