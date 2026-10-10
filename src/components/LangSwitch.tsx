"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export function LangSwitch({ current, className = "" }: { current: Locale; className?: string }) {
  const path = usePathname() || "/";
  const qs = useSearchParams()?.toString();
  const swap = (l: Locale) => {
    const parts = path.split("/");
    parts[1] = l;
    return parts.join("/") + (qs ? `?${qs}` : "");
  };
  return (
    <div className={`inline-flex overflow-hidden rounded-full border border-line text-xs ${className}`} role="group" aria-label="Language">
      {locales.map((l) => (
        <Link
          key={l}
          href={swap(l)}
          hrefLang={l}
          aria-current={l === current ? "true" : undefined}
          className={`px-3 py-1.5 font-semibold tracking-wider transition ${l === current ? "bg-accent text-white" : "text-muted hover:text-ink"}`}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
