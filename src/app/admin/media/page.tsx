import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, media } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead } from "@/admin/ui";
import { Sortable, Uploader } from "@/admin/client";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ kind?: string; view?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const kind = sp.kind === "image" || sp.kind === "video" ? sp.kind : undefined;
  const rows = await db.select().from(media).where(kind ? eq(media.kind, kind) : undefined).orderBy(asc(media.sortOrder), desc(media.id));
  const tabs: [string | undefined, string][] = [[undefined, ru ? "Все" : "All"], ["image", ru ? "Фото" : "Photos"], ["video", ru ? "Видео" : "Videos"]];
  const status = { owned: ru ? "свои" : "owned", licensed: ru ? "лицензия" : "licensed", permission: ru ? "разрешение" : "permission", unverified: ru ? "права не подтверждены" : "rights unverified" };
  return (
    <div>
      <PageHead title={a.media} sub={ru ? "Загружайте только свои фото и видео или материалы, на которые у вас есть права." : "Upload only your own photos and videos, or media you hold usage rights for."} />
      <Uploader label={a.dropHere} uploading={a.uploading} />
      <div className="my-6 flex flex-wrap items-center gap-2">
        {tabs.map(([k, l]) => (
          <Link key={l} href={`/admin/media${k ? `?kind=${k}` : ""}`} className={`rounded-full px-4 py-2 text-sm ${k === kind ? "bg-accent text-white" : "border border-line text-muted"}`}>{l}</Link>
        ))}
        <Link href={`/admin/media?${kind ? `kind=${kind}&` : ""}view=${sp.view === "order" ? "grid" : "order"}`} className="ml-auto text-sm text-accent">
          {sp.view === "order" ? (ru ? "Сетка" : "Grid") : (ru ? "Изменить порядок" : "Reorder")}
        </Link>
      </div>
      {sp.view === "order" ? (
        <Sortable table="media" hint={a.sortHint} items={rows.map((m) => ({ id: m.id, label: m.filename, sub: `${m.kind} · ${m.folder}`, href: `/admin/media/${m.id}` }))} />
      ) : rows.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {rows.map((m) => (
            <Link key={m.id} href={`/admin/media/${m.id}`} className="group overflow-hidden rounded-xl border border-line bg-surface hover:border-accent">
              <div className="relative aspect-square bg-surface-2">
                {m.kind === "image" ? (
                  <img src={`/media/${m.id}`} alt={m.altEn} className="h-full w-full object-cover" style={{ objectPosition: `${m.focalX}% ${m.focalY}%` }} loading="lazy" />
                ) : m.posterId ? (
                  <img src={`/media/${m.posterId}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-full place-items-center text-3xl">🎬</div>
                )}
                {m.kind === "video" && <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 text-[10px]">VIDEO{m.isPublic ? " · PUBLIC" : ""}</span>}
              </div>
              <div className="space-y-1 p-2">
                <div className="truncate text-xs">{m.filename}</div>
                <Badge tone={m.licenseStatus === "unverified" ? "bad" : "ok"}>{status[m.licenseStatus]}</Badge>
                {(!m.altEn || !m.altRu) && m.kind === "image" && <Badge tone="warn">alt</Badge>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted">{a.none}</p>
      )}
    </div>
  );
}
