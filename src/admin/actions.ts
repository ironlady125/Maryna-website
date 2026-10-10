"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import {
  achievements, articles, availability, bookings, categories, db, entitlements, exercises, faqs, legalPages, media, orders,
  productPrograms, products, programs, reviews, timeOff, users, workouts,
} from "@/db";
import { assertAdmin } from "@/lib/auth";
import { slugify } from "@/lib/l10n";
import { cancelOrder, markOrderPaid } from "@/lib/commerce";
import { getSettings, MANUAL_METHODS, saveSetting, type Settings } from "@/lib/settings";
import { removeFile } from "@/lib/storage";
import { sendTemplate } from "@/lib/email";
import { formatInZone, zonedTime } from "@/lib/booking";
import { ADMIN_LANG } from "./i18n";

/* ---------- form helpers ---------- */
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, d = 0) => (Number.isFinite(Number(fd.get(k))) && fd.get(k) !== "" ? Number(fd.get(k)) : d);
const idOrNull = (fd: FormData, k: string) => (Number(fd.get(k)) > 0 ? Number(fd.get(k)) : null);
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const bi = <N extends string>(fd: FormData, ...names: N[]) =>
  Object.fromEntries(names.flatMap((n) => [[`${n}En`, str(fd, `${n}En`)], [`${n}Ru`, str(fd, `${n}Ru`)]])) as Record<`${N}En` | `${N}Ru`, string>;
const cents = (fd: FormData, k: string) => Math.round(parseFloat(str(fd, k).replace(",", ".") || "0") * 100);
const done = (path: string): never => {
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}saved=1`);
};
async function uniqueSlug(table: typeof programs | typeof categories | typeof products | typeof articles, base: string, selfId?: number) {
  const root = slugify(base) || "item";
  let s = root;
  for (let i = 2; ; i++) {
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, s)).limit(1);
    if (!hit || hit.id === selfId) return s;
    s = `${root}-${i}`;
  }
}

export async function setAdminLang(fd: FormData) {
  (await cookies()).set(ADMIN_LANG, str(fd, "lang") === "ru" ? "ru" : "en", { path: "/", maxAge: 31536000 });
  revalidatePath("/admin", "layout");
}

/* ---------- settings ---------- */
export async function saveSettings(fd: FormData) {
  await assertAdmin();
  const section = str(fd, "section") as keyof Settings;
  const s = await getSettings();
  switch (section) {
    case "brand":
      await saveSetting("brand", { name: str(fd, "name") || s.brand.name, altName: str(fd, "altName"), logoId: idOrNull(fd, "logoId"), sloganEn: str(fd, "sloganEn"), sloganRu: str(fd, "sloganRu") });
      break;
    case "colors": {
      const c = { ...s.colors };
      for (const k of Object.keys(c) as (keyof typeof c)[]) if (/^#[0-9a-fA-F]{6}$/.test(str(fd, k))) c[k] = str(fd, k);
      await saveSetting("colors", c);
      break;
    }
    case "home":
      await saveSetting("home", {
        ...s.home,
        ...bi(fd, "heroTitle", "heroSub", "words", "finalCta"),
        heroImageId: idOrNull(fd, "heroImageId"),
        heroVideoId: idOrNull(fd, "heroVideoId"),
        featuredVideoId: idOrNull(fd, "featuredVideoId"),
        coachImageId: idOrNull(fd, "coachImageId"),
        anywhereImageId: idOrNull(fd, "anywhereImageId"),
        onlineImageId: idOrNull(fd, "onlineImageId"),
      } as Settings["home"]);
      break;
    case "about":
      await saveSetting("about", { photoId: idOrNull(fd, "photoId"), bioEn: str(fd, "bioEn"), bioRu: str(fd, "bioRu") });
      break;
    case "contacts":
      await saveSetting("contacts", Object.fromEntries(Object.keys(s.contacts).map((k) => [k, str(fd, k)])) as Settings["contacts"]);
      break;
    case "coach": {
      let tz = str(fd, "timezone");
      try { new Intl.DateTimeFormat("en", { timeZone: tz }); } catch { tz = s.coach.timezone; }
      await saveSetting("coach", {
        timezone: tz,
        noticeHours: Math.max(0, num(fd, "noticeHours", 24)),
        windowDays: Math.min(180, Math.max(1, num(fd, "windowDays", 30))),
        slotStepMin: Math.max(5, num(fd, "slotStepMin", 30)),
        meetingUrl: str(fd, "meetingUrl"),
        notifyEmail: str(fd, "notifyEmail"),
      });
      break;
    }
    case "payments": {
      const manual = { ...s.payments.manual };
      for (const k of MANUAL_METHODS) {
        manual[k] = {
          enabled: bool(fd, `${k}_enabled`),
          label: str(fd, `${k}_label`) || manual[k].label,
          details: str(fd, `${k}_details`),
          instructionsEn: str(fd, `${k}_instructionsEn`),
          instructionsRu: str(fd, `${k}_instructionsRu`),
        };
      }
      await saveSetting("payments", { stripeEnabled: bool(fd, "stripeEnabled"), manual });
      break;
    }
    case "seo":
      await saveSetting("seo", bi(fd, "title", "desc") as Settings["seo"]);
      break;
  }
  done(`/admin/settings?tab=${section}`);
}

/* ---------- media ---------- */
export async function saveMedia(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const status = str(fd, "licenseStatus");
  await db
    .update(media)
    .set({
      altEn: str(fd, "altEn"),
      altRu: str(fd, "altRu"),
      folder: str(fd, "folder") || "general",
      licenseStatus: (["owned", "licensed", "permission", "unverified"].includes(status) ? status : "unverified") as "owned",
      licenseNote: str(fd, "licenseNote"),
      credit: str(fd, "credit"),
      focalX: Math.min(100, Math.max(0, num(fd, "focalX", 50))),
      focalY: Math.min(100, Math.max(0, num(fd, "focalY", 50))),
      isPublic: bool(fd, "isPublic"),
      posterId: idOrNull(fd, "posterId"),
    })
    .where(eq(media.id, id));
  done(`/admin/media/${id}`);
}

export async function setPoster(videoId: number, posterId: number) {
  await assertAdmin();
  await db.update(media).set({ posterId }).where(eq(media.id, videoId));
  revalidatePath(`/admin/media/${videoId}`);
}

export async function deleteMedia(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (m) {
    // Detach everywhere it is referenced, then remove the file.
    await db.update(categories).set({ coverId: null }).where(eq(categories.coverId, id));
    await db.update(programs).set({ coverId: null }).where(eq(programs.coverId, id));
    await db.update(programs).set({ trailerId: null }).where(eq(programs.trailerId, id));
    await db.update(workouts).set({ videoId: null }).where(eq(workouts.videoId, id));
    await db.update(exercises).set({ videoId: null }).where(eq(exercises.videoId, id));
    await db.update(exercises).set({ thumbId: null }).where(eq(exercises.thumbId, id));
    await db.update(products).set({ coverId: null }).where(eq(products.coverId, id));
    await db.update(articles).set({ coverId: null }).where(eq(articles.coverId, id));
    await db.update(media).set({ posterId: null }).where(eq(media.posterId, id));
    await db.delete(media).where(eq(media.id, id));
    removeFile(m.storageKey);
  }
  done("/admin/media");
}

/* ---------- categories ---------- */
export async function saveCategory(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const data = {
    ...bi(fd, "title", "subtitle", "desc"),
    coverId: idOrNull(fd, "coverId"),
    published: bool(fd, "published"),
    kind: (str(fd, "kind") === "service" ? "service" : "training") as "training",
  };
  const slug = await uniqueSlug(categories, str(fd, "slug") || data.titleEn || data.titleRu, id || undefined);
  if (id) await db.update(categories).set({ ...data, slug }).where(eq(categories.id, id));
  else {
    const [r] = await db.insert(categories).values({ ...data, slug, sortOrder: 999 }).returning();
    done(`/admin/categories/${r.id}`);
  }
  done(`/admin/categories/${id}`);
}

export async function deleteCategory(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const [used] = await db.select({ id: programs.id }).from(programs).where(eq(programs.categoryId, id)).limit(1);
  if (used) done(`/admin/categories/${id}?error=has-programs`);
  await db.delete(categories).where(eq(categories.id, id));
  done("/admin/categories");
}

/* ---------- programs / workouts / exercises ---------- */
export async function saveProgram(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const lvl = str(fd, "level");
  const data = {
    ...bi(fd, "title", "subtitle", "desc", "equipment"),
    categoryId: num(fd, "categoryId"),
    level: (["beginner", "intermediate", "advanced", "all"].includes(lvl) ? lvl : "all") as "all",
    weeks: num(fd, "weeks"),
    coverId: idOrNull(fd, "coverId"),
    trailerId: idOrNull(fd, "trailerId"),
    isFree: bool(fd, "isFree"),
    featured: bool(fd, "featured"),
    published: bool(fd, "published"),
  };
  const slug = await uniqueSlug(programs, str(fd, "slug") || data.titleEn || data.titleRu, id || undefined);
  if (id) await db.update(programs).set({ ...data, slug }).where(eq(programs.id, id));
  else {
    const [r] = await db.insert(programs).values({ ...data, slug, sortOrder: 999 }).returning();
    if (bool(fd, "createProduct") && cents(fd, "price") > 0) {
      const [p] = await db
        .insert(products)
        .values({ slug: await uniqueSlug(products, slug), type: "program", titleEn: data.titleEn, titleRu: data.titleRu, descEn: data.subtitleEn, descRu: data.subtitleRu, priceCents: cents(fd, "price") })
        .returning();
      await db.insert(productPrograms).values({ productId: p.id, programId: r.id });
    }
    done(`/admin/programs/${r.id}`);
  }
  done(`/admin/programs/${id}`);
}

export async function deleteProgram(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const ws = await db.select({ id: workouts.id }).from(workouts).where(eq(workouts.programId, id));
  if (ws.length) await db.delete(exercises).where(inArray(exercises.workoutId, ws.map((w) => w.id)));
  await db.delete(workouts).where(eq(workouts.programId, id));
  await db.delete(productPrograms).where(eq(productPrograms.programId, id));
  await db.delete(programs).where(eq(programs.id, id));
  done("/admin/programs");
}

export async function saveWorkout(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const programId = num(fd, "programId");
  const data = {
    ...bi(fd, "title", "desc"),
    minutes: num(fd, "minutes"),
    rounds: num(fd, "rounds"),
    roundSec: num(fd, "roundSec", 180),
    restSec: num(fd, "restSec", 60),
    videoId: idOrNull(fd, "videoId"),
    isPreview: bool(fd, "isPreview"),
  };
  if (id) await db.update(workouts).set(data).where(eq(workouts.id, id));
  else {
    const [r] = await db.insert(workouts).values({ ...data, programId, sortOrder: 999 }).returning();
    done(`/admin/workouts/${r.id}`);
  }
  done(`/admin/workouts/${id}`);
}

export async function deleteWorkout(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const [w] = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  await db.delete(exercises).where(eq(exercises.workoutId, id));
  await db.delete(workouts).where(eq(workouts.id, id));
  done(w ? `/admin/programs/${w.programId}` : "/admin/programs");
}

export async function saveExercise(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const workoutId = num(fd, "workoutId");
  const data = {
    ...bi(fd, "title", "desc", "cues", "dose"),
    minutes: num(fd, "minutes"),
    videoId: idOrNull(fd, "videoId"),
    thumbId: idOrNull(fd, "thumbId"),
  };
  if (id) await db.update(exercises).set(data).where(eq(exercises.id, id));
  else await db.insert(exercises).values({ ...data, workoutId, sortOrder: 999 });
  done(`/admin/workouts/${workoutId}#ex-${id || "new"}`);
}

export async function deleteExercise(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const [e] = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  await db.delete(exercises).where(eq(exercises.id, id));
  done(e ? `/admin/workouts/${e.workoutId}` : "/admin/programs");
}

/* ---------- products ---------- */
export async function saveProduct(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const type = str(fd, "type");
  const data = {
    ...bi(fd, "title", "desc", "features"),
    type: (["program", "bundle", "session", "consultation"].includes(type) ? type : "program") as "program",
    priceCents: cents(fd, "price"),
    currency: (str(fd, "currency") || "usd").toLowerCase(),
    durationMin: num(fd, "durationMin"),
    coverId: idOrNull(fd, "coverId"),
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
  };
  const slug = await uniqueSlug(products, str(fd, "slug") || data.titleEn || data.titleRu, id || undefined);
  let pid = id;
  if (id) await db.update(products).set({ ...data, slug }).where(eq(products.id, id));
  else pid = (await db.insert(products).values({ ...data, slug, sortOrder: 999 }).returning())[0].id;
  await db.delete(productPrograms).where(eq(productPrograms.productId, pid));
  for (const v of fd.getAll("programIds")) await db.insert(productPrograms).values({ productId: pid, programId: Number(v) });
  done(`/admin/products/${pid}`);
}

export async function deleteProduct(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const [used] = await db.select({ id: orders.id }).from(orders).where(eq(orders.productId, id)).limit(1);
  if (used) {
    await db.update(products).set({ active: false }).where(eq(products.id, id));
    done(`/admin/products/${id}?error=has-orders`);
  }
  await db.delete(productPrograms).where(eq(productPrograms.productId, id));
  await db.delete(products).where(eq(products.id, id));
  done("/admin/products");
}

/* ---------- orders ---------- */
export async function orderAction(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const act = str(fd, "act");
  if (act === "paid") await markOrderPaid(id, undefined, "confirmed-by-admin");
  if (act === "cancel") await cancelOrder(id);
  if (act === "refunded") await db.update(orders).set({ status: "refunded" }).where(eq(orders.id, id));
  if (act === "note") await db.update(orders).set({ note: str(fd, "note") }).where(eq(orders.id, id));
  done(str(fd, "back") || "/admin/orders");
}

/* ---------- bookings & schedule ---------- */
export async function bookingAction(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const act = str(fd, "act");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) done("/admin/bookings");
  if (act === "meeting") await db.update(bookings).set({ meetingUrl: str(fd, "meetingUrl") }).where(eq(bookings.id, id));
  if (act === "complete") await db.update(bookings).set({ status: "completed" }).where(eq(bookings.id, id));
  if (act === "confirm") {
    const [o] = await db.select().from(orders).where(eq(orders.bookingId, id)).limit(1);
    if (o) await markOrderPaid(o.id, undefined, "confirmed-by-admin");
    else await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, id));
  }
  if (act === "cancel") {
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
    const [u] = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
    const [p] = await db.select().from(products).where(eq(products.id, b.productId)).limit(1);
    if (u) {
      const l = u.locale;
      await sendTemplate(u.email, "bookingCancelled", l, {
        name: u.name || u.email,
        product: (l === "ru" ? p?.titleRu : p?.titleEn) || "",
        when: formatInZone(b.startAt, u.timezone, l),
      });
    }
  }
  done("/admin/bookings");
}

const hm = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export async function addAvailability(fd: FormData) {
  await assertAdmin();
  const start = hm(str(fd, "start"));
  const end = hm(str(fd, "end"));
  if (end > start) for (const d of fd.getAll("weekday")) await db.insert(availability).values({ weekday: Number(d), startMin: start, endMin: end });
  done("/admin/bookings#schedule");
}

export async function deleteAvailability(fd: FormData) {
  await assertAdmin();
  await db.delete(availability).where(eq(availability.id, num(fd, "id")));
  done("/admin/bookings#schedule");
}

export async function addTimeOff(fd: FormData) {
  await assertAdmin();
  const s = await getSettings();
  const [y1, m1, d1] = str(fd, "from").split("-").map(Number);
  const [y2, m2, d2] = str(fd, "to").split("-").map(Number);
  if (y1 && y2) {
    const startAt = zonedTime(y1, m1 - 1, d1, 0, s.coach.timezone);
    const endAt = zonedTime(y2, m2 - 1, d2, 24 * 60, s.coach.timezone);
    if (endAt > startAt) await db.insert(timeOff).values({ startAt, endAt, note: str(fd, "note") });
  }
  done("/admin/bookings#schedule");
}

export async function deleteTimeOff(fd: FormData) {
  await assertAdmin();
  await db.delete(timeOff).where(eq(timeOff.id, num(fd, "id")));
  done("/admin/bookings#schedule");
}

/* ---------- users ---------- */
export async function userAction(fd: FormData) {
  const me = await assertAdmin();
  const id = num(fd, "id");
  const act = str(fd, "act");
  if (act === "role" && id !== me.id) await db.update(users).set({ role: str(fd, "role") === "admin" ? "admin" : "user" }).where(eq(users.id, id));
  if (act === "grant" && num(fd, "programId")) await db.insert(entitlements).values({ userId: id, programId: num(fd, "programId") }).onConflictDoNothing();
  if (act === "revoke") await db.delete(entitlements).where(and(eq(entitlements.userId, id), eq(entitlements.programId, num(fd, "programId"))));
  done(`/admin/users/${id}`);
}

/* ---------- reviews ---------- */
export async function reviewAction(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const act = str(fd, "act");
  if (act === "approve") await db.update(reviews).set({ status: "approved" }).where(eq(reviews.id, id));
  if (act === "reject") await db.update(reviews).set({ status: "rejected" }).where(eq(reviews.id, id));
  if (act === "delete") await db.delete(reviews).where(eq(reviews.id, id));
  if (act === "add") {
    const l = str(fd, "locale") === "ru" ? "ru" : "en";
    await db.insert(reviews).values({ name: str(fd, "name"), text: str(fd, "text"), rating: Math.min(5, Math.max(1, num(fd, "rating", 5))), locale: l, status: "approved" });
  }
  done("/admin/reviews");
}

/* ---------- achievements / faq / articles / legal ---------- */
export async function saveAchievement(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const data = { ...bi(fd, "text"), status: (str(fd, "status") === "approved" ? "approved" : "pending") as "approved", note: str(fd, "note") };
  if (str(fd, "act") === "delete") await db.delete(achievements).where(eq(achievements.id, id));
  else if (id) await db.update(achievements).set(data).where(eq(achievements.id, id));
  else await db.insert(achievements).values({ ...data, sortOrder: 999 });
  done("/admin/achievements");
}

export async function saveFaq(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  const data = bi(fd, "q", "a");
  if (str(fd, "act") === "delete") await db.delete(faqs).where(eq(faqs.id, id));
  else if (id) await db.update(faqs).set(data).where(eq(faqs.id, id));
  else await db.insert(faqs).values({ ...data, sortOrder: 999 });
  done("/admin/faqs");
}

export async function saveArticle(fd: FormData) {
  await assertAdmin();
  const id = num(fd, "id");
  if (str(fd, "act") === "delete") {
    await db.delete(articles).where(eq(articles.id, id));
    done("/admin/articles");
  }
  const data = { ...bi(fd, "title", "excerpt", "body"), coverId: idOrNull(fd, "coverId"), categoryId: idOrNull(fd, "categoryId"), published: bool(fd, "published") };
  const slug = await uniqueSlug(articles, str(fd, "slug") || data.titleEn || data.titleRu, id || undefined);
  if (id) await db.update(articles).set({ ...data, slug }).where(eq(articles.id, id));
  else {
    const [r] = await db.insert(articles).values({ ...data, slug, sortOrder: 999 }).returning();
    done(`/admin/articles/${r.id}`);
  }
  done(`/admin/articles/${id}`);
}

export async function saveLegal(fd: FormData) {
  await assertAdmin();
  const slug = str(fd, "slug");
  await db.update(legalPages).set({ ...bi(fd, "title", "body"), reviewed: bool(fd, "reviewed") }).where(eq(legalPages.slug, slug));
  done(`/admin/legal/${slug}`);
}
