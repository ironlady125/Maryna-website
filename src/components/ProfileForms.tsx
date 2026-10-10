"use client";
import { useActionState, useEffect, useState } from "react";
import { submitReview, updateProfile } from "@/lib/actions/member";
import type { Dict } from "@/i18n";

export function ProfileForm({ t, common, user }: { t: Dict["account"]; common: Dict["common"]; user: { name: string; locale: string; timezone: string } }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [zones, setZones] = useState<string[]>([user.timezone]);
  useEffect(() => {
    const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    setZones(all.length ? all : [user.timezone]);
  }, [user.timezone]);
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="display text-2xl">{t.profile}</h2>
      {state?.ok && <p className="rounded-xl bg-lime/15 px-4 py-2 text-sm">{common.saved}</p>}
      {state && !state.ok && <p className="rounded-xl bg-accent/15 px-4 py-2 text-sm">{common.error}</p>}
      <label className="block"><span className="label">Name / Имя</span><input className="input" name="name" defaultValue={user.name} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">{t.language}</span>
          <select className="input" name="locale" defaultValue={user.locale}><option value="en">English</option><option value="ru">Русский</option></select>
        </label>
        <label className="block"><span className="label">{t.timezone}</span>
          <select className="input" name="timezone" defaultValue={user.timezone}>{zones.map((z) => <option key={z}>{z}</option>)}</select>
        </label>
      </div>
      <label className="block"><span className="label">{t.changePassword}</span><input className="input" type="password" name="password" minLength={8} autoComplete="new-password" /></label>
      <button className="btn-primary" disabled={pending}>{common.save}</button>
    </form>
  );
}

export function ReviewForm({ t, common, locale }: { t: Dict["account"]; common: Dict["common"]; locale: string }) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  if (state?.ok) return <p className="card p-6">{t.reviewThanks}</p>;
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="display text-2xl">{t.review}</h2>
      <input type="hidden" name="locale" value={locale} />
      <label className="block"><span className="label">{t.rating}</span>
        <select className="input" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      </label>
      <label className="block"><span className="label">{t.reviewText}</span><textarea className="input" name="text" rows={4} minLength={10} maxLength={2000} required /></label>
      {state && !state.ok && <p className="text-sm text-accent">{common.error}</p>}
      <button className="btn-ghost" disabled={pending}>{common.send}</button>
    </form>
  );
}
