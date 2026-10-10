import { desc } from "drizzle-orm";
import { db, emails } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead } from "@/admin/ui";

export default async function EmailsPage() {
  const { a, lang } = await adminDict();
  const rows = await db.select().from(emails).orderBy(desc(emails.createdAt)).limit(200);
  return (
    <div className="max-w-4xl">
      <PageHead title={a.emails} sub={process.env.SMTP_URL ? "SMTP ✓" : lang === "ru" ? "SMTP не настроен: письма сохраняются здесь, но не отправляются." : "SMTP is not configured: emails are saved here but not sent."} />
      <div className="space-y-2">
        {rows.map((e) => (
          <details key={e.id} className="card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
              <span><b>{e.subject}</b> → {e.to}</span>
              <span className="flex items-center gap-2 text-xs text-muted">{e.createdAt.toLocaleString()} <Badge tone={e.status === "sent" ? "ok" : e.status === "failed" ? "bad" : "muted"}>{e.status}</Badge></span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">{e.body}</pre>
            {e.error && <p className="mt-2 text-xs text-accent">{e.error}</p>}
          </details>
        ))}
        {!rows.length && <p className="text-muted">{a.none}</p>}
      </div>
    </div>
  );
}
