import "server-only";
import nodemailer from "nodemailer";
import { db, emails } from "@/db";
import type { Locale } from "@/i18n/config";
import { getSettings } from "./settings";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransport() {
  if (!process.env.SMTP_URL) return null;
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  return transport;
}

/** Sends an email via SMTP when configured; always records it in Admin → Emails. */
export async function sendEmail(to: string, subject: string, body: string) {
  if (!to) return;
  const t = getTransport();
  let status: "sent" | "logged" | "failed" = "logged";
  let error = "";
  if (t) {
    try {
      const s = await getSettings();
      await t.sendMail({ from: process.env.EMAIL_FROM || s.brand.name, to, subject, text: body });
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  }
  await db.insert(emails).values({ to, subject, body, status, error });
}

const site = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

type Tpl = { subject: string; body: string };
const T: Record<string, Record<Locale, (v: Record<string, string>) => Tpl>> = {
  welcome: {
    en: (v) => ({
      subject: `Welcome to ${v.brand}`,
      body: `Hi ${v.name},\n\nYour account is ready. Start training: ${site()}/en/account\n\nTrain like a fighter,\nMaryna`,
    }),
    ru: (v) => ({
      subject: `Добро пожаловать в ${v.brand}`,
      body: `Привет, ${v.name}!\n\nТвой аккаунт готов. Начать тренироваться: ${site()}/ru/account\n\nТренируйся как боец,\nМарина`,
    }),
  },
  orderPaid: {
    en: (v) => ({
      subject: `Payment received — ${v.product}`,
      body: `Hi ${v.name},\n\nThank you! Your payment for "${v.product}" (${v.amount}) was received.\nOpen your training: ${site()}/en/account\n\nMaryna`,
    }),
    ru: (v) => ({
      subject: `Оплата получена — ${v.product}`,
      body: `Привет, ${v.name}!\n\nСпасибо! Оплата за «${v.product}» (${v.amount}) получена.\nОткрыть тренировки: ${site()}/ru/account\n\nМарина`,
    }),
  },
  manualPending: {
    en: (v) => ({
      subject: `Order #${v.order}: payment instructions`,
      body: `Hi ${v.name},\n\nYou chose ${v.method} for "${v.product}" (${v.amount}).\n\n${v.details}\n\nReference: ${v.ref}\nYour access opens as soon as the payment is confirmed.\n\nMaryna`,
    }),
    ru: (v) => ({
      subject: `Заказ №${v.order}: как оплатить`,
      body: `Привет, ${v.name}!\n\nВы выбрали ${v.method} для «${v.product}» (${v.amount}).\n\n${v.details}\n\nНазначение платежа: ${v.ref}\nДоступ откроется сразу после подтверждения оплаты.\n\nМарина`,
    }),
  },
  bookingConfirmed: {
    en: (v) => ({
      subject: `Session confirmed — ${v.when}`,
      body: `Hi ${v.name},\n\nYour "${v.product}" session is confirmed for ${v.when}.\n${v.meeting ? `Join link: ${v.meeting}\n` : "I'll send you the video call link before the session.\n"}\nSee you soon,\nMaryna`,
    }),
    ru: (v) => ({
      subject: `Занятие подтверждено — ${v.when}`,
      body: `Привет, ${v.name}!\n\nТвоё занятие «${v.product}» подтверждено на ${v.when}.\n${v.meeting ? `Ссылка на звонок: ${v.meeting}\n` : "Ссылку на видеозвонок я пришлю перед занятием.\n"}\nДо встречи,\nМарина`,
    }),
  },
  bookingCancelled: {
    en: (v) => ({ subject: `Session cancelled — ${v.when}`, body: `Hi ${v.name},\n\nYour "${v.product}" session on ${v.when} was cancelled. Reply to this email to reschedule.\n\nMaryna` }),
    ru: (v) => ({ subject: `Занятие отменено — ${v.when}`, body: `Привет, ${v.name}!\n\nЗанятие «${v.product}» на ${v.when} отменено. Ответь на это письмо, чтобы выбрать новое время.\n\nМарина` }),
  },
  resetPassword: {
    en: (v) => ({ subject: "Reset your password", body: `Hi,\n\nReset your password with this link (valid for 1 hour):\n${v.link}\n\nIf you didn't ask for it, ignore this email.` }),
    ru: (v) => ({ subject: "Сброс пароля", body: `Привет!\n\nСбросить пароль можно по ссылке (действует 1 час):\n${v.link}\n\nЕсли вы не запрашивали сброс, просто проигнорируйте письмо.` }),
  },
};

export async function sendTemplate(to: string, tpl: keyof typeof T, locale: Locale, vars: Record<string, string>) {
  const s = await getSettings();
  const { subject, body } = T[tpl][locale]({ brand: s.brand.name, ...vars });
  await sendEmail(to, subject, body);
}

export async function notifyOwner(subject: string, body: string) {
  const s = await getSettings();
  const to = s.coach.notifyEmail || s.contacts.email || process.env.ADMIN_EMAIL || "";
  if (to) await sendEmail(to, subject, body);
}
