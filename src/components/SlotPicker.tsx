"use client";
import { useEffect, useMemo, useState } from "react";
import type { Slot } from "@/lib/booking";
import type { Dict } from "@/i18n";

const r = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export function SlotPicker({ slots, t, locale, action, productId }: {
  slots: Slot[]; t: Dict["booking"]; locale: "en" | "ru"; action: (fd: FormData) => void; productId: number;
}) {
  const [tz, setTz] = useState("UTC");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), []);
  const lc = locale === "ru" ? "ru-RU" : "en-US";
  const days = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(s.start));
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    }
    return [...m.entries()];
  }, [slots, tz]);
  const [day, setDay] = useState<string | null>(null);
  const [sel, setSel] = useState<Slot | null>(null);
  const activeDay = day ?? days[0]?.[0] ?? null;
  const times = days.find(([k]) => k === activeDay)?.[1] ?? [];
  const fmtDay = (k: string) => new Intl.DateTimeFormat(lc, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(k + "T12:00:00Z"));
  const fmtTime = (iso: string) => new Intl.DateTimeFormat(lc, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));
  const fmtFull = (iso: string) => new Intl.DateTimeFormat(lc, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));

  if (!slots.length) return <p className="card p-6 text-muted">{t.noSlots}</p>;
  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="start" value={sel?.start ?? ""} />
      <p className="text-sm text-muted">{r(t.yourTz, { tz })}</p>
      <div>
        <div className="eyebrow mb-3">{t.pickDay}</div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {days.map(([k]) => (
            <button type="button" key={k} onClick={() => { setDay(k); setSel(null); }}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm ${k === activeDay ? "border-accent bg-accent/15" : "border-line hover:border-white/40"}`}>
              {fmtDay(k)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="eyebrow mb-3">{t.pickTime}</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {times.map((s) => (
            <button type="button" key={s.start} onClick={() => setSel(s)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${sel?.start === s.start ? "border-lime bg-lime text-black" : "border-line hover:border-white/40"}`}>
              {fmtTime(s.start)}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="label">{t.notes}</span>
        <textarea name="notes" rows={3} className="input" maxLength={1000} />
      </label>
      {sel && <p className="font-semibold">{r(t.selected, { when: fmtFull(sel.start) })}</p>}
      <button className="btn-primary" disabled={!sel}>{t.confirm}</button>
    </form>
  );
}
