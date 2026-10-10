import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db, media } from "@/db";
import { assertAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const kind = new URL(req.url).searchParams.get("kind");
  const rows = await db
    .select({ id: media.id, kind: media.kind, filename: media.filename, licenseStatus: media.licenseStatus, posterId: media.posterId })
    .from(media)
    .where(kind === "image" || kind === "video" ? eq(media.kind, kind) : undefined)
    .orderBy(asc(media.sortOrder), desc(media.id));
  return NextResponse.json(rows);
}
