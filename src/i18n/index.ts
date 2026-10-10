import en, { type Dict } from "./en";
import ru from "./ru";
import type { Locale } from "./config";

const dicts: Record<Locale, Dict> = { en, ru };
export const getDict = (l: Locale): Dict => dicts[l] ?? en;
export type { Dict };

/** Replaces {placeholders} in a dictionary string. */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
