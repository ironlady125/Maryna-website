import Link from "next/link";
import { asc } from "drizzle-orm";
import { articles, db } from "@/db";
import { adminDict } from "@/admin/i18n";
import { PageHead } from "@/admin/ui";
import { Sortable } from "@/admin/client";

export default async function ArticlesPage() {
  const { a, lang } = await adminDict();
  const rows = await db.select().from(articles).orderBy(asc(articles.sortOrder));
  return (
    <div className="max-w-4xl">
      <PageHead title={a.articles} actions={<Link href="/admin/articles/new" className="btn-primary !py-2">+ {a.new}</Link>} />
      <Sortable table="articles" hint={a.sortHint} items={rows.map((r) => ({ id: r.id, label: lang === "ru" ? r.titleRu : r.titleEn, sub: `/${r.slug}${r.published ? "" : " · draft"}`, href: `/admin/articles/${r.id}` }))} />
    </div>
  );
}
