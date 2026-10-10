"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

/** Desktop tabs + mobile bottom navigation for member pages. */
export function AccountNav({ items }: { items: Item[] }) {
  const path = usePathname();
  const active = (h: string) => (h.endsWith("/account") ? path === h : path.startsWith(h));
  return (
    <>
      <nav className="mb-10 hidden gap-2 sm:flex">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest ${active(i.href) ? "bg-accent text-white" : "border border-line text-muted hover:text-ink"}`}>
            {i.label}
          </Link>
        ))}
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] uppercase tracking-wider ${active(i.href) ? "text-accent" : "text-muted"}`}>
            <span className="text-lg leading-none" aria-hidden>{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
