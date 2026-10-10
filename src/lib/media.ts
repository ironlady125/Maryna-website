import "server-only";
import { eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db, media } from "@/db";

export type Media = typeof media.$inferSelect;

export const getMedia = cache(async (id: number | null | undefined): Promise<Media | null> => {
  if (!id) return null;
  const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return m ?? null;
});

export async function getMediaMap(ids: (number | null | undefined)[]) {
  const clean = [...new Set(ids.filter((x): x is number => !!x))];
  if (!clean.length) return new Map<number, Media>();
  const rows = await db.select().from(media).where(inArray(media.id, clean));
  return new Map(rows.map((r) => [r.id, r]));
}

/** Public pages must never show media whose usage rights are unverified. */
export const isPublishable = (m: Media | null | undefined): m is Media => !!m && m.licenseStatus !== "unverified";

export const mediaUrl = (id: number) => `/media/${id}`;
