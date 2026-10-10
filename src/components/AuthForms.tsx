"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { forgotPassword, login, register, resetPassword } from "@/lib/actions/auth";
import type { Dict } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = { locale: Locale; t: Dict["auth"]; next?: string };

function ErrorMsg({ code, t }: { code?: string; t: Dict["auth"] }) {
  if (!code) return null;
  const msg = (t as Record<string, string>)[code] ?? t.invalid;
  return <p role="alert" className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm">{msg}</p>;
}

export function LoginForm({ locale, t, next }: Props) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />
      <ErrorMsg code={state?.error} t={t} />
      <label className="block"><span className="label">{t.email}</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="block"><span className="label">{t.password}</span><input className="input" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : locale === "ru" ? "Войти" : "Log in"}</button>
      <div className="flex justify-between text-sm text-muted">
        <Link href={`/${locale}/forgot`} className="hover:text-ink">{t.forgot}</Link>
        <Link href={`/${locale}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="hover:text-ink">{t.noAccount}</Link>
      </div>
    </form>
  );
}

export function RegisterForm({ locale, t, next }: Props) {
  const [state, action, pending] = useActionState(register, undefined);
  const [tz, setTz] = useState("UTC");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), []);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="timezone" value={tz} />
      <ErrorMsg code={state?.error} t={t} />
      <label className="block"><span className="label">{t.name}</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="block"><span className="label">{t.email}</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="block"><span className="label">{t.password}</span><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : locale === "ru" ? "Создать аккаунт" : "Create account"}</button>
      <p className="text-xs text-muted">{t.agree}</p>
      <p className="text-sm text-muted">
        {t.haveAccount} <Link className="text-accent" href={`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{locale === "ru" ? "Войти" : "Log in"}</Link>
      </p>
    </form>
  );
}

export function ForgotForm({ locale, t }: Props) {
  const [state, action, pending] = useActionState(forgotPassword, undefined);
  if (state?.ok) return <p className="rounded-xl border border-lime/40 bg-lime/10 p-4">{t.resetSent}</p>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <p className="text-muted">{t.forgotText}</p>
      <label className="block"><span className="label">{t.email}</span><input className="input" name="email" type="email" required /></label>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : locale === "ru" ? "Отправить ссылку" : "Send link"}</button>
    </form>
  );
}

export function ResetForm({ locale, t, token }: Props & { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  if (state?.ok)
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-lime/40 bg-lime/10 p-4">{t.resetDone}</p>
        <Link className="btn-primary" href={`/${locale}/login`}>{locale === "ru" ? "Войти" : "Log in"}</Link>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <ErrorMsg code={state?.error} t={t} />
      <label className="block"><span className="label">{t.newPassword}</span><input className="input" name="password" type="password" minLength={8} required /></label>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : locale === "ru" ? "Сохранить" : "Save"}</button>
    </form>
  );
}
