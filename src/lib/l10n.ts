import type { Locale } from "@/i18n/config";

type Row = Record<string, unknown>;
const cap = (l: Locale) => (l === "en" ? "En" : "Ru");

/** Localized field with fallback to the other language (public site). */
export function tr(row: Row | null | undefined, field: string, locale: Locale): string {
  if (!row) return "";
  const own = row[field + cap(locale)];
  if (typeof own === "string" && own.trim()) return own;
  const other = row[field + cap(locale === "en" ? "ru" : "en")];
  return typeof other === "string" ? other : "";
}

/** Languages where a bilingual field is empty — used for admin "missing translation" flags. */
export function missingLangs(row: Row, field: string): Locale[] {
  const out: Locale[] = [];
  for (const l of ["en", "ru"] as Locale[]) {
    const v = row[field + cap(l)];
    if (typeof v !== "string" || !v.trim()) out.push(l);
  }
  return out;
}

export function lines(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function formatPrice(cents: number, currency = "usd", locale: Locale = "en") {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function slugify(s: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g",
  };
  return s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
