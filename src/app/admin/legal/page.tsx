import Link from "next/link";
import { db, legalPages } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead } from "@/admin/ui";

export default async function LegalList() {
  const { a, lang } = await adminDict();
  const rows = await db.select().from(legalPages);
  return (
    <div className="max-w-3xl">
      <PageHead title={a.legal} sub={lang === "ru" ? "Это шаблоны. Перед запуском их должен проверить юрист." : "These are templates. Have a lawyer review them before launch."} />
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {rows.map((r) => (
          <li key={r.slug} className="flex items-center justify-between p-4">
            <Link href={`/admin/legal/${r.slug}`} className="hover:text-accent">{lang === "ru" ? r.titleRu : r.titleEn}</Link>
            <Badge tone={r.reviewed ? "ok" : "warn"}>{r.reviewed ? "reviewed" : "draft"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
