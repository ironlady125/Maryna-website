import { asc, desc, eq, gte, lt } from "drizzle-orm";
import { availability, bookings, db, products, timeOff, users } from "@/db";
import { adminDict } from "@/admin/i18n";
import { Badge, PageHead, SavedBanner, Section, Table } from "@/admin/ui";
import { ConfirmButton } from "@/admin/client";
import { addAvailability, addTimeOff, bookingAction, deleteAvailability, deleteTimeOff } from "@/admin/actions";
import { getSettings } from "@/lib/settings";
import { formatInZone } from "@/lib/booking";

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const { a, lang } = await adminDict();
  const ru = lang === "ru";
  const DAYS = ru ? DAYS_RU : DAYS_EN;
  const s = await getSettings();
  const now = new Date();
  const q = (future: boolean) =>
    db
      .select({ b: bookings, u: users, p: products })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.userId))
      .innerJoin(products, eq(products.id, bookings.productId))
      .where(future ? gte(bookings.endAt, now) : lt(bookings.endAt, now))
      .orderBy(future ? asc(bookings.startAt) : desc(bookings.startAt))
      .limit(100);
  const [upcoming, past, rules, offs] = await Promise.all([
    q(true), q(false),
    db.select().from(availability).orderBy(asc(availability.weekday), asc(availability.startMin)),
    db.select().from(timeOff).where(gte(timeOff.endAt, now)).orderBy(asc(timeOff.startAt)),
  ]);
  const Row = ({ b, u, p }: (typeof upcoming)[number]) => (
    <tr>
      <td className="px-4 py-3">{formatInZone(b.startAt, s.coach.timezone, lang)}</td>
      <td className="px-4 py-3">{u.name}<br /><span className="text-xs text-muted">{u.email}</span></td>
      <td className="px-4 py-3">{ru ? p.titleRu : p.titleEn}{b.notes && <div className="mt-1 max-w-xs text-xs text-muted">“{b.notes}”</div>}</td>
      <td className="px-4 py-3"><Badge tone={b.status === "confirmed" ? "ok" : b.status === "pending_payment" ? "warn" : "muted"}>{b.status}</Badge></td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <form action={bookingAction} className="flex gap-1">
            <input type="hidden" name="id" value={b.id} /><input type="hidden" name="act" value="meeting" />
            <input name="meetingUrl" defaultValue={b.meetingUrl} placeholder="https://zoom.us/…" className="w-44 rounded-lg border border-line bg-bg px-2 py-1 text-xs" />
            <button className="rounded-lg border border-line px-2 text-xs">✓</button>
          </form>
          <div className="flex flex-wrap gap-2 text-xs">
            {b.status === "pending_payment" && <form action={bookingAction}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="act" value="confirm" /><button className="rounded-lg bg-lime px-2 py-1 font-semibold text-black">{ru ? "Подтвердить (оплачено)" : "Confirm (paid)"}</button></form>}
            {b.status === "confirmed" && b.endAt < now && <form action={bookingAction}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="act" value="complete" /><button className="rounded-lg border border-line px-2 py-1">{ru ? "Проведено" : "Completed"}</button></form>}
            {b.status !== "cancelled" && <form action={bookingAction}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="act" value="cancel" /><ConfirmButton label={a.cancel} confirm={ru ? "Отменить занятие и уведомить клиента?" : "Cancel and notify the client?"} className="rounded-lg border border-line px-2 py-1 text-accent" /></form>}
          </div>
        </div>
      </td>
    </tr>
  );
  return (
    <div>
      <PageHead title={a.bookings} sub={`${ru ? "Ваш часовой пояс" : "Your time zone"}: ${s.coach.timezone}`} />
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <h2 className="mb-3 font-display text-lg uppercase">{a.upcoming}</h2>
      <Table head={[ru ? "Время" : "Time", ru ? "Клиент" : "Client", ru ? "Формат" : "Session", a.status, a.actions]}>{upcoming.map((r) => <Row key={r.b.id} {...r} />)}</Table>
      {!upcoming.length && <p className="mt-3 text-muted">{a.none}</p>}

      <div id="schedule" className="mt-10 grid gap-6 lg:grid-cols-2">
        <Section title={ru ? "Рабочие часы (каждую неделю)" : "Weekly working hours"}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span><b className="inline-block w-10">{DAYS[r.weekday]}</b> {hhmm(r.startMin)} – {hhmm(r.endMin)}</span>
                <form action={deleteAvailability}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-accent">{a.delete}</button></form>
              </li>
            ))}
          </ul>
          <form action={addAvailability} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <label key={d} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-sm">
                  <input type="checkbox" name="weekday" value={i} className="accent-[var(--brand-accent)]" />{d}
                </label>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <label><span className="label">{ru ? "С" : "From"}</span><input type="time" name="start" defaultValue="10:00" className="input" /></label>
              <label><span className="label">{ru ? "До" : "To"}</span><input type="time" name="end" defaultValue="18:00" className="input" /></label>
              <button className="btn-primary !py-3">+ {a.add}</button>
            </div>
          </form>
        </Section>
        <Section title={ru ? "Выходные и отпуск" : "Days off & vacation"}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {offs.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <span>{o.startAt.toLocaleDateString()} – {new Date(o.endAt.getTime() - 1).toLocaleDateString()} {o.note && <span className="text-muted">· {o.note}</span>}</span>
                <form action={deleteTimeOff}><input type="hidden" name="id" value={o.id} /><button className="text-xs text-accent">{a.delete}</button></form>
              </li>
            ))}
          </ul>
          <form action={addTimeOff} className="grid gap-2 sm:grid-cols-[1fr_1fr]">
            <label><span className="label">{ru ? "С" : "From"}</span><input type="date" name="from" className="input" required /></label>
            <label><span className="label">{ru ? "По" : "To"}</span><input type="date" name="to" className="input" required /></label>
            <input name="note" placeholder={ru ? "Заметка (например, сборы)" : "Note (e.g. training camp)"} className="input sm:col-span-2" />
            <button className="btn-primary sm:col-span-2">+ {a.add}</button>
          </form>
        </Section>
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-display text-lg uppercase">{ru ? "Прошедшие" : "Past"}</h2>
          <Table head={[ru ? "Время" : "Time", ru ? "Клиент" : "Client", ru ? "Формат" : "Session", a.status, a.actions]}>{past.map((r) => <Row key={r.b.id} {...r} />)}</Table>
        </>
      )}
    </div>
  );
}
