import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, media } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { newStorageKey, removeFile, saveStream } from "@/lib/storage";

const MAX = 4 * 1024 * 1024 * 1024; // 4 GB
const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime))$/;

export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const q = new URL(req.url).searchParams;
  const name = (q.get("name") || "file").slice(0, 200);
  const type = q.get("type") || "";
  if (!ALLOWED.test(type)) return new NextResponse("Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM or MOV.", { status: 415 });
  if (!req.body) return new NextResponse("Empty body", { status: 400 });
  const key = newStorageKey(name);
  let size: number;
  try {
    size = await saveStream(key, req.body, MAX);
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Upload failed", { status: 413 });
  }
  const kind = type.startsWith("video/") ? "video" : "image";
  const w = Number(q.get("w")) || null;
  const h = Number(q.get("h")) || null;
  const replace = Number(q.get("replace")) || 0;
  if (replace) {
    const [old] = await db.select().from(media).where(eq(media.id, replace)).limit(1);
    if (!old) return new NextResponse("Not found", { status: 404 });
    await db.update(media).set({ kind, filename: name, storageKey: key, mime: type, size, width: w, height: h }).where(eq(media.id, replace));
    removeFile(old.storageKey);
    return NextResponse.json({ id: replace });
  }
  const [row] = await db
    .insert(media)
    .values({ kind, filename: name, storageKey: key, mime: type, size, width: w, height: h, folder: q.get("folder") || "general" })
    .returning();
  return NextResponse.json({ id: row.id });
}
