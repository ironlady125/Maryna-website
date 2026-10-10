import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || "./storage");

export function newStorageKey(filename: string) {
  const ext = (path.extname(filename) || "").toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}${ext}`;
}

export function storagePath(key: string) {
  const p = path.resolve(STORAGE_DIR, key);
  if (!p.startsWith(STORAGE_DIR + path.sep)) throw new Error("Invalid storage key");
  return p;
}

/** Streams a web ReadableStream to disk and returns the byte size. */
export async function saveStream(key: string, body: ReadableStream<Uint8Array>, maxBytes: number) {
  const p = storagePath(key);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  let size = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctl) {
      size += chunk.byteLength;
      if (size > maxBytes) ctl.error(new Error("File is too large"));
      else ctl.enqueue(chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body.pipeThrough(counter) as never), fs.createWriteStream(p));
  } catch (e) {
    fs.rmSync(p, { force: true });
    throw e;
  }
  return size;
}

export function removeFile(key: string) {
  try {
    fs.rmSync(storagePath(key), { force: true });
  } catch {
    /* already gone */
  }
}
