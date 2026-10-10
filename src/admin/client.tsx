"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ label, className = "btn-primary" }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? "…" : label}</button>;
}

export function ConfirmButton({ label, confirm, className = "text-sm text-accent hover:underline" }: { label: string; confirm: string; className?: string }) {
  return <button className={className} onClick={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>{label}</button>;
}

type Item = { id: number; label: string; sub?: string; href?: string; badge?: string };

/** Drag-and-drop ordering; saves the new order to /api/admin/reorder. */
export function Sortable({ table, items, hint }: { table: string; items: Item[]; hint: string }) {
  const [list, setList] = useState(items);
  const [saving, setSaving] = useState(false);
  const drag = useRef<number | null>(null);
  useEffect(() => setList(items), [items]);
  const save = async (next: Item[]) => {
    setSaving(true);
    await fetch("/api/admin/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, ids: next.map((x) => x.id) }) });
    setSaving(false);
  };
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setList(next);
    save(next);
  };
  return (
    <div>
      <p className="mb-2 text-xs text-muted">↕ {hint} {saving && "…"}</p>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {list.map((it, i) => (
          <li
            key={it.id}
            draggable
            onDragStart={() => (drag.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drag.current !== null && move(drag.current, i)}
            className="flex items-center gap-3 bg-surface px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
          >
            <span className="cursor-grab select-none text-muted" aria-hidden>⠿</span>
            <div className="min-w-0 flex-1">
              {it.href ? <a href={it.href} className="font-medium hover:text-accent">{it.label}</a> : <span className="font-medium">{it.label}</span>}
              {it.sub && <div className="truncate text-xs text-muted">{it.sub}</div>}
            </div>
            {it.badge && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">{it.badge}</span>}
            <span className="flex gap-1">
              <button type="button" aria-label="Up" className="px-1 text-muted hover:text-ink" onClick={() => move(i, Math.max(0, i - 1))}>↑</button>
              <button type="button" aria-label="Down" className="px-1 text-muted hover:text-ink" onClick={() => move(i, Math.min(list.length - 1, i + 1))}>↓</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Streams files straight to disk through /api/admin/media/upload (works for large videos). */
export function Uploader({ label, uploading, replaceId, onDone, accept = "image/*,video/*", folder }: {
  label: string; uploading: string; replaceId?: number; onDone?: (ids: number[]) => void; accept?: string; folder?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const dims = (f: File) =>
    new Promise<{ w: number; h: number }>((res) => {
      const url = URL.createObjectURL(f);
      if (f.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => { res({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
        img.onerror = () => res({ w: 0, h: 0 });
        img.src = url;
      } else if (f.type.startsWith("video/")) {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { res({ w: v.videoWidth, h: v.videoHeight }); URL.revokeObjectURL(url); };
        v.onerror = () => res({ w: 0, h: 0 });
        v.src = url;
      } else res({ w: 0, h: 0 });
    });

  const send = (f: File, d: { w: number; h: number }) =>
    new Promise<number>((resolve, reject) => {
      const q = new URLSearchParams({ name: f.name, type: f.type || "application/octet-stream", w: String(d.w), h: String(d.h) });
      if (replaceId) q.set("replace", String(replaceId));
      if (folder) q.set("folder", folder);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/admin/media/upload?${q}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText).id) : reject(new Error(xhr.responseText || `HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(f);
    });

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    const ids: number[] = [];
    for (const f of Array.from(files)) {
      setBusy(f.name);
      setPct(0);
      try {
        ids.push(await send(f, await dims(f)));
      } catch (e) {
        setErr(`${f.name}: ${e instanceof Error ? e.message : e}`);
      }
    }
    setBusy(null);
    onDone?.(ids);
    router.refresh();
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
      onClick={() => input.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${over ? "border-accent bg-accent/10" : "border-line hover:border-white/40"}`}
    >
      <input ref={input} type="file" multiple={!replaceId} accept={accept} hidden onChange={(e) => handle(e.target.files)} />
      {busy ? (
        <div>
          <div className="text-sm">{uploading} {busy}</div>
          <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
        </div>
      ) : (
        <div className="text-sm text-muted">⬆ {label}</div>
      )}
      {err && <p className="mt-3 text-sm text-accent">{err}</p>}
    </div>
  );
}

type MediaLite = { id: number; kind: "image" | "video"; filename: string; licenseStatus: string; posterId: number | null };

/** Select a media item for a form field (stores the id in a hidden input). */
export function MediaPicker({ name, value, kind = "image", label, chooseText, removeText, uploadText, uploadingText }: {
  name: string; value: number | null; kind?: "image" | "video"; label: string; chooseText: string; removeText: string; uploadText: string; uploadingText: string;
}) {
  const [id, setId] = useState<number | null>(value);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaLite[]>([]);
  const load = async () => setItems(await (await fetch(`/api/admin/media?kind=${kind}`)).json());
  useEffect(() => { if (open) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = items.find((x) => x.id === id);
  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={id ?? ""} />
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-2 text-xs text-muted">
          {id ? (
            kind === "image" ? <img src={`/media/${id}`} alt="" className="h-full w-full object-cover" /> : <span>🎬 #{id}{cur ? ` ${cur.filename}` : ""}</span>
          ) : "—"}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <button type="button" className="text-left text-accent hover:underline" onClick={() => setOpen(true)}>{chooseText}</button>
          {id && <button type="button" className="text-left text-muted hover:text-ink" onClick={() => setId(null)}>{removeText}</button>}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-xl uppercase">{label}</div>
              <button type="button" className="text-2xl text-muted" onClick={() => setOpen(false)}>×</button>
            </div>
            <Uploader label={uploadText} uploading={uploadingText} accept={kind === "image" ? "image/*" : "video/*"} onDone={(ids) => { load(); if (ids[0]) { setId(ids[0]); setOpen(false); } }} />
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {items.map((m) => (
                <button type="button" key={m.id} onClick={() => { setId(m.id); setOpen(false); }}
                  className={`relative aspect-square overflow-hidden rounded-xl border ${m.id === id ? "border-accent" : "border-line"} bg-surface-2 text-xs`}>
                  {m.kind === "image" ? <img src={`/media/${m.id}`} alt="" className="h-full w-full object-cover" /> : m.posterId ? <img src={`/media/${m.posterId}`} alt="" className="h-full w-full object-cover" /> : <span className="p-2">🎬 {m.filename}</span>}
                  {m.licenseStatus === "unverified" && <span className="absolute left-1 top-1 rounded bg-accent px-1 text-[9px]">!</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
