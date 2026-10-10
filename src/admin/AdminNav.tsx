"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AdminNav({ items }: { items: [string, string, string][] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  const cur = items.find(([h]) => active(h));
  return (
    <>
      <button className="mx-5 mb-4 flex w-[calc(100%-2.5rem)] items-center justify-between rounded-xl border border-line px-4 py-3 text-sm lg:hidden" onClick={() => setOpen(!open)}>
        {cur?.[1] ?? "Menu"} <span>{open ? "▲" : "▼"}</span>
      </button>
      <nav className={`${open ? "block" : "hidden"} px-3 pb-4 lg:block`}>
        {items.map(([h, label, icon]) => (
          <Link key={h} href={h} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active(h) ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
            <span className="w-5 text-center" aria-hidden>{icon}</span>{label}
          </Link>
        ))}
      </nav>
    </>
  );
}
