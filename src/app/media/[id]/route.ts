import fs from "node:fs";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { db, media } from "@/db";
import { getUser } from "@/lib/auth";
import { canViewMedia } from "@/lib/access";
import { storagePath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [m] = await db.select().from(media).where(eq(media.id, Number(id))).limit(1);
  if (!m) return new Response("Not found", { status: 404 });
  const user = await getUser();
  if (!(await canViewMedia(user, m))) return new Response("Forbidden", { status: 403 });

  let file: string;
  let size: number;
  try {
    file = storagePath(m.storageKey);
    size = fs.statSync(file).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const protectedFile = m.kind === "video" && !m.isPublic;
  const headers: Record<string, string> = {
    "Content-Type": m.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": protectedFile ? "private, no-store" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  };

  const range = req.headers.get("range");
  const match = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (match) {
    let start = match[1] ? Number(match[1]) : NaN;
    let end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start)) { start = size - end; end = size - 1; }
    end = Math.min(end, size - 1, start + 8 * 1024 * 1024 - 1);
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
