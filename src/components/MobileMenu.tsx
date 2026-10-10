"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ items, label, footer }: { items: { href: string; label: string }[]; label: string; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full border border-line">
        <span className="relative block h-3 w-5">
          <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-bg/98 px-6 py-6 backdrop-blur">
          <nav className="flex flex-col">
            {items.map((i) => (
              <Link key={i.href} href={i.href} className="border-b border-line py-4 font-display text-2xl uppercase tracking-wide">
                {i.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6">{footer}</div>
        </div>
      )}
    </div>
  );
}
