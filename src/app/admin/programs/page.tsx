import Link from "next/link";
import { asc } from "drizzle-orm";
import { categories, db, programs } from "@/db";
import { adminDict } from "@/admin/i18n";
import { PageHead } from "@/admin/ui";
import { Sortable } from "@/admin/client";
import { missingLangs } from "@/lib/l10n";

export default async function ProgramsPage() {
  const { a, lang } = await adminDict();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const progs = await db.select().from(programs).orderBy(asc(programs.sortOrder));
  return (
    <div className="max-w-4xl">
      <PageHead title={a.programs} actions={<Link href="/admin/programs/new" className="btn-primary !py-2">+ {a.new}</Link>} />
      <div className="space-y-8">
        {cats.map((c) => {
          const list = progs.filter((p) => p.categoryId === c.id);
          if (!list.length) return null;
          return (
            <section key={c.id}>
              <h2 className="mb-3 font-display text-lg uppercase">{lang === "ru" ? c.titleRu : c.titleEn}</h2>
              <Sortable table="programs" hint={a.sortHint} items={list.map((p) => ({
                id: p.id, label: lang === "ru" ? p.titleRu || p.titleEn : p.titleEn || p.titleRu,
                sub: `/${p.slug}${p.isFree ? " · free" : ""}${p.featured ? " · ★" : ""}${p.published ? "" : " · draft"}`,
                href: `/admin/programs/${p.id}`,
                badge: ["title", "subtitle", "desc", "equipment"].some((f) => missingLangs(p, f).length === 1) ? a.missing : undefined,
              }))} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
