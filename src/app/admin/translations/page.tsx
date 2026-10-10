import Link from "next/link";
import { adminDict } from "@/admin/i18n";
import { PageHead, Table } from "@/admin/ui";
import { translationReport } from "@/admin/translations";

export default async function TranslationsPage() {
  const { a } = await adminDict();
  const rows = await translationReport();
  return (
    <div>
      <PageHead title={a.translations} sub={`${a.translationMissing}: ${rows.length}`} />
      {rows.length ? (
        <Table head={["", a.title, "", ""]}>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="px-4 py-3 text-muted">{r.type}</td>
              <td className="px-4 py-3">{r.label}</td>
              <td className="px-4 py-3"><span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">{r.field} · {r.langs.join(", ").toUpperCase()} {a.missing}</span></td>
              <td className="px-4 py-3"><Link href={r.href} className="text-accent">{a.edit} →</Link></td>
            </tr>
          ))}
        </Table>
      ) : (
        <p className="text-muted">✓ {a.none}</p>
      )}
    </div>
  );
}
