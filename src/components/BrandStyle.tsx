import type { Settings } from "@/lib/settings";

const hex = (v: string, fallback: string) => (/^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback);

/** Injects the owner's brand colors (Admin → Settings) as CSS variables. */
export function BrandStyle({ colors }: { colors: Settings["colors"] }) {
  const css = `:root{--brand-bg:${hex(colors.bg, "#09090B")};--brand-surface:${hex(colors.surface, "#141418")};--brand-surface2:${hex(colors.surface2, "#202027")};--brand-text:${hex(colors.text, "#FFFFFF")};--brand-muted:${hex(colors.muted, "#D1D1D6")};--brand-accent:${hex(colors.accent, "#F43F46")};--brand-accent2:${hex(colors.accent2, "#FF5C48")};--brand-lime:${hex(colors.lime, "#D9FF43")};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
