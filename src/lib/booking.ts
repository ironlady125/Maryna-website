import { and, eq, gte, inArray, lt, or } from "drizzle-orm";
import { availability, bookings, db, orders, timeOff } from "@/db";
import type { Locale } from "@/i18n/config";

/** Offset (ms) of a time zone at a given instant: local = utc + offset. */
function tzOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - date.getTime();
}

/** UTC instant for a wall-clock time in a zone. */
export function zonedTime(y: number, m: number, d: number, minutes: number, timeZone: string) {
  const guess = Date.UTC(y, m, d, 0, minutes);
  const off1 = tzOffset(new Date(guess), timeZone);
  const off2 = tzOffset(new Date(guess - off1), timeZone);
  return new Date(guess - off2);
}

export function formatInZone(d: Date, timeZone: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

export const HOLD_MS = { online: 60 * 60 * 1000, manual: 48 * 60 * 60 * 1000 };

/** Bookings that currently block a time slot (confirmed, or unpaid holds that haven't expired). */
export async function blockingBookings(from: Date, to: Date) {
  const rows = await db
    .select({ b: bookings, provider: orders.provider, orderStatus: orders.status })
    .from(bookings)
    .leftJoin(orders, eq(orders.bookingId, bookings.id))
    .where(
      and(
        lt(bookings.startAt, to),
        gte(bookings.endAt, from),
        inArray(bookings.status, ["confirmed", "pending_payment", "completed"]),
      ),
    );
  const now = Date.now();
  return rows
    .filter(({ b, provider }) => {
      if (b.status !== "pending_payment") return true;
      const hold = provider === "manual" ? HOLD_MS.manual : HOLD_MS.online;
      return now - b.createdAt.getTime() < hold;
    })
    .map((r) => r.b);
}

export type Slot = { start: string; end: string };

/** Available start times for a session of `durationMin`, as UTC ISO strings. */
export async function availableSlots(opts: {
  durationMin: number;
  timezone: string;
  noticeHours: number;
  windowDays: number;
  stepMin: number;
}): Promise<Slot[]> {
  const rules = await db.select().from(availability);
  if (!rules.length) return [];
  const now = Date.now();
  const earliest = now + opts.noticeHours * 3600_000;
  const horizon = now + opts.windowDays * 86400_000;
  const off = await db
    .select()
    .from(timeOff)
    .where(or(gte(timeOff.endAt, new Date(now))));
  const busy = await blockingBookings(new Date(now), new Date(horizon));
  const dur = opts.durationMin * 60_000;
  const out: Slot[] = [];

  for (let i = 0; i <= opts.windowDays; i++) {
    const probe = new Date(now + i * 86400_000);
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: opts.timezone, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(probe);
    const y = Number(parts.find((p) => p.type === "year")!.value);
    const m = Number(parts.find((p) => p.type === "month")!.value) - 1;
    const d = Number(parts.find((p) => p.type === "day")!.value);
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")!.value);
    for (const r of rules.filter((x) => x.weekday === wd)) {
      for (let t = r.startMin; t + opts.durationMin <= r.endMin; t += opts.stepMin) {
        const s = zonedTime(y, m, d, t, opts.timezone).getTime();
        const e = s + dur;
        if (s < earliest || s > horizon) continue;
        if (off.some((o) => s < o.endAt.getTime() && e > o.startAt.getTime())) continue;
        if (busy.some((b) => s < b.endAt.getTime() && e > b.startAt.getTime())) continue;
        out.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
      }
    }
  }
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.start) ? false : (seen.add(x.start), true))).sort((a, b) => a.start.localeCompare(b.start));
}
