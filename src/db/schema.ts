import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, primaryKey, index } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

/* Bilingual text columns are stored as <name>En / <name>Ru pairs. */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  locale: text("locale", { enum: ["en", "ru"] }).notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: createdAt(),
});

/** Key/value store for everything the owner edits in Admin → Settings (brand, colors, home texts…). */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["image", "video"] }).notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  altEn: text("alt_en").notNull().default(""),
  altRu: text("alt_ru").notNull().default(""),
  folder: text("folder").notNull().default("general"),
  /** owned | licensed | permission | unverified — unverified media is never shown publicly */
  licenseStatus: text("license_status", { enum: ["owned", "licensed", "permission", "unverified"] })
    .notNull()
    .default("owned"),
  licenseNote: text("license_note").notNull().default(""),
  credit: text("credit").notNull().default(""),
  /** Focal point in % used for responsive cropping without altering the image */
  focalX: integer("focal_x").notNull().default(50),
  focalY: integer("focal_y").notNull().default(50),
  posterId: integer("poster_id"),
  /** Videos are protected by default; public videos (e.g. intro) can be watched by anyone */
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleRu: text("title_ru").notNull().default(""),
  subtitleEn: text("subtitle_en").notNull().default(""),
  subtitleRu: text("subtitle_ru").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  descRu: text("desc_ru").notNull().default(""),
  coverId: integer("cover_id"),
  /** "training" categories hold programs; "service" links to online training booking */
  kind: text("kind", { enum: ["training", "service"] }).notNull().default("training"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const programs = sqliteTable(
  "programs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    categoryId: integer("category_id").notNull(),
    titleEn: text("title_en").notNull().default(""),
    titleRu: text("title_ru").notNull().default(""),
    subtitleEn: text("subtitle_en").notNull().default(""),
    subtitleRu: text("subtitle_ru").notNull().default(""),
    descEn: text("desc_en").notNull().default(""),
    descRu: text("desc_ru").notNull().default(""),
    level: text("level", { enum: ["beginner", "intermediate", "advanced", "all"] }).notNull().default("all"),
    equipmentEn: text("equipment_en").notNull().default(""),
    equipmentRu: text("equipment_ru").notNull().default(""),
    weeks: integer("weeks").notNull().default(0),
    coverId: integer("cover_id"),
    trailerId: integer("trailer_id"),
    /** free programs are open to every registered user */
    isFree: integer("is_free", { mode: "boolean" }).notNull().default(false),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("programs_category_idx").on(t.categoryId)],
);

/** A workout (module / lesson / session) inside a program. */
export const workouts = sqliteTable(
  "workouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    programId: integer("program_id").notNull(),
    titleEn: text("title_en").notNull().default(""),
    titleRu: text("title_ru").notNull().default(""),
    descEn: text("desc_en").notNull().default(""),
    descRu: text("desc_ru").notNull().default(""),
    minutes: integer("minutes").notNull().default(0),
    /** Round timer defaults (seconds). rounds = 0 hides the timer. */
    rounds: integer("rounds").notNull().default(0),
    roundSec: integer("round_sec").notNull().default(180),
    restSec: integer("rest_sec").notNull().default(60),
    videoId: integer("video_id"),
    /** Preview workouts can be opened without purchase */
    isPreview: integer("is_preview", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("workouts_program_idx").on(t.programId)],
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workoutId: integer("workout_id").notNull(),
    titleEn: text("title_en").notNull().default(""),
    titleRu: text("title_ru").notNull().default(""),
    descEn: text("desc_en").notNull().default(""),
    descRu: text("desc_ru").notNull().default(""),
    /** One technique cue per line */
    cuesEn: text("cues_en").notNull().default(""),
    cuesRu: text("cues_ru").notNull().default(""),
    doseEn: text("dose_en").notNull().default(""),
    doseRu: text("dose_ru").notNull().default(""),
    minutes: integer("minutes").notNull().default(0),
    videoId: integer("video_id"),
    thumbId: integer("thumb_id"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("exercises_workout_idx").on(t.workoutId)],
);

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  /** program: one-time purchase unlocking programs; session/consultation: bookable 1-on-1 time */
  type: text("type", { enum: ["program", "bundle", "session", "consultation"] }).notNull(),
  titleEn: text("title_en").notNull().default(""),
  titleRu: text("title_ru").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  descRu: text("desc_ru").notNull().default(""),
  featuresEn: text("features_en").notNull().default(""),
  featuresRu: text("features_ru").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  durationMin: integer("duration_min").notNull().default(0),
  coverId: integer("cover_id"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productPrograms = sqliteTable(
  "product_programs",
  {
    productId: integer("product_id").notNull(),
    programId: integer("program_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.programId] })],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    productId: integer("product_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status", { enum: ["pending", "paid", "cancelled", "refunded"] }).notNull().default("pending"),
    provider: text("provider", { enum: ["stripe", "manual", "dev", "free"] }).notNull(),
    /** For manual payments: zelle, paypal, venmo, cashapp, wise, monobank, crypto, bank */
    method: text("method").notNull().default(""),
    providerRef: text("provider_ref").notNull().default(""),
    bookingId: integer("booking_id"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("orders_user_idx").on(t.userId)],
);

export const entitlements = sqliteTable(
  "entitlements",
  {
    userId: integer("user_id").notNull(),
    programId: integer("program_id").notNull(),
    orderId: integer("order_id"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.programId] })],
);

/** Weekly availability windows in the coach's time zone (minutes from midnight). */
export const availability = sqliteTable("availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekday: integer("weekday").notNull(), // 0 = Sunday
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
});

export const timeOff = sqliteTable("time_off", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startAt: integer("start_at", { mode: "timestamp_ms" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp_ms" }).notNull(),
  note: text("note").notNull().default(""),
});

export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    productId: integer("product_id").notNull(),
    startAt: integer("start_at", { mode: "timestamp_ms" }).notNull(),
    endAt: integer("end_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: ["pending_payment", "confirmed", "cancelled", "completed"] })
      .notNull()
      .default("pending_payment"),
    notes: text("notes").notNull().default(""),
    meetingUrl: text("meeting_url").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("bookings_start_idx").on(t.startAt)],
);

export const progress = sqliteTable(
  "progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    workoutId: integer("workout_id").notNull(),
    programId: integer("program_id").notNull(),
    seconds: integer("seconds").notNull().default(0),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("progress_user_idx").on(t.userId)],
);

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  text: text("text").notNull(),
  locale: text("locale", { enum: ["en", "ru"] }).notNull().default("en"),
  rating: integer("rating").notNull().default(5),
  programId: integer("program_id"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: createdAt(),
});

/** Achievements are only shown publicly once approved by the owner. */
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  textEn: text("text_en").notNull().default(""),
  textRu: text("text_ru").notNull().default(""),
  status: text("status", { enum: ["approved", "pending"] }).notNull().default("pending"),
  note: text("note").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleRu: text("title_ru").notNull().default(""),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptRu: text("excerpt_ru").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyRu: text("body_ru").notNull().default(""),
  coverId: integer("cover_id"),
  categoryId: integer("category_id"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const faqs = sqliteTable("faqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  qEn: text("q_en").notNull().default(""),
  qRu: text("q_ru").notNull().default(""),
  aEn: text("a_en").notNull().default(""),
  aRu: text("a_ru").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const legalPages = sqliteTable("legal_pages", {
  slug: text("slug").primaryKey(),
  titleEn: text("title_en").notNull().default(""),
  titleRu: text("title_ru").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyRu: text("body_ru").notNull().default(""),
  /** false = draft template that still needs legal review */
  reviewed: integer("reviewed", { mode: "boolean" }).notNull().default(false),
});

export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["sent", "logged", "failed"] }).notNull(),
  error: text("error").notNull().default(""),
  createdAt: createdAt(),
});

