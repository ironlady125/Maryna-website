import { getMedia, isPublishable, mediaUrl } from "@/lib/media";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";

type Props = {
  id: number | null | undefined;
  locale: Locale;
  className?: string;
  imgClassName?: string;
  /** Text shown on the placeholder when no approved photo has been uploaded yet */
  label?: string;
  alt?: string;
  priority?: boolean;
};

/** Shows an approved uploaded photo, or a clearly labelled branded placeholder. */
export async function Photo({ id, locale, className = "", imgClassName = "", label, alt, priority }: Props) {
  const m = await getMedia(id);
  if (isPublishable(m) && m.kind === "image") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(m.id)}
          alt={alt ?? (locale === "ru" ? m.altRu || m.altEn : m.altEn || m.altRu)}
          className={`h-full w-full object-cover ${imgClassName}`}
          style={{ objectPosition: `${m.focalX}% ${m.focalY}%` }}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }
  return <Placeholder className={className} label={label ?? getDict(locale).common.photoPlaceholder} />;
}

export function Placeholder({ className = "", label }: { className?: string; label: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface-2 ${className}`}
      role="img"
      aria-label={label}
      data-placeholder="true"
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 10%, color-mix(in srgb, var(--brand-accent) 45%, transparent), transparent 60%), radial-gradient(90% 70% at 0% 100%, color-mix(in srgb, var(--brand-lime) 14%, transparent), transparent 60%), repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,.035) 14px 28px)",
        }}
      />
      {label && <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-[11px] uppercase tracking-[0.2em] text-white/60">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-8 7" /></svg>
        {label}
      </div>}
    </div>
  );
}
