import Link from "next/link";
import { desc, like, or } from "drizzle-orm";
import { db, users } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead, Table } from "@/admin/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { a, lang } = await adminDict();
  const rows = await db
    .select()
    .from(users)
    .where(q ? or(like(users.email, `%${q}%`), like(users.name, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(300);
  return (
    <div>
      <PageHead title={a.users} />
      <form className="mb-4 max-w-md"><input name="q" defaultValue={q} placeholder={a.search} className="input" /></form>
      <Table head={["Email", lang === "ru" ? "Имя" : "Name", lang === "ru" ? "Язык" : "Lang", "Role", ""]}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3 uppercase text-muted">{u.locale}</td>
            <td className="px-4 py-3"><Badge tone={u.role === "admin" ? "bad" : "muted"}>{u.role}</Badge></td>
            <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="text-accent">{a.open} →</Link></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
