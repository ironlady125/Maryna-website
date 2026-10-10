import Link from "next/link";
import type { ReactNode } from "react";
import { SubmitButton } from "./client";

export function PageHead({ title, back, actions, sub }: { title: string; back?: string; actions?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back} className="text-sm text-muted hover:text-ink">← Back / Назад</Link>}
        <h1 className="display mt-1 text-3xl sm:text-4xl">{title}</h1>
        {sub && <div className="mt-2 text-sm text-muted">{sub}</div>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export function SavedBanner({ show, text }: { show: boolean; text: string }) {
  return show ? <div className="mb-6 rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm">{text}</div> : null;
}

export function Section({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card mb-6 p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-5 font-display text-lg uppercase tracking-wide">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, name, defaultValue, type = "text", required, hint, ...rest }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" name={name} type={type} defaultValue={defaultValue ?? ""} required={required} {...rest} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Area({ label, name, defaultValue, rows = 4, hint }: { label: string; name: string; defaultValue?: string | null; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="input font-[inherit]" name={name} rows={rows} defaultValue={defaultValue ?? ""} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** EN + RU inputs side by side, flagging a missing translation. */
export function BiField({ label, name, row, area, rows = 3, missingText = "missing", hint }: {
  label: string; name: string; row?: Record<string, unknown> | null; area?: boolean; rows?: number; missingText?: string; hint?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(["En", "Ru"] as const).map((l) => {
        const key = name + l;
        const val = (row?.[key] as string | undefined) ?? "";
        const otherFilled = !!((row?.[name + (l === "En" ? "Ru" : "En")] as string | undefined) ?? "").trim();
        const missing = !val.trim() && otherFilled;
        return (
          <label key={l} className="block">
            <span className="label flex items-center gap-2">
              {label} <span className="rounded bg-surface-2 px-1.5 text-[10px]">{l.toUpperCase()}</span>
              {missing && <span className="rounded bg-accent/20 px-1.5 text-[10px] normal-case tracking-normal text-accent">⚠ {missingText}</span>}
            </span>
            {area ? (
              <textarea className={`input ${missing ? "border-accent/60" : ""}`} name={key} rows={rows} defaultValue={val} />
            ) : (
              <input className={`input ${missing ? "border-accent/60" : ""}`} name={key} defaultValue={val} />
            )}
          </label>
        );
      })}
      {hint && <p className="text-xs text-muted md:col-span-2">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-[var(--brand-accent)]" />
      {label}
    </label>
  );
}

export function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string | number | null; options: [string | number, string][] }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" name={name} defaultValue={defaultValue ?? ""}>
        {options.map(([v, l]) => <option key={String(v)} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

export function Save({ label }: { label: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
      <SubmitButton label={label} />
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "bad" }) {
  const cls = { muted: "bg-surface-2 text-muted", ok: "bg-lime/20 text-lime", warn: "bg-yellow-400/15 text-yellow-300", bad: "bg-accent/20 text-accent" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
