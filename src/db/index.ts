import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "file:./data/app.db";
if (url.startsWith("file:")) {
  fs.mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
}

const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof drizzle<typeof schema>> };

export const db =
  globalForDb.__db ??
  drizzle(createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined }), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export * from "./schema";
