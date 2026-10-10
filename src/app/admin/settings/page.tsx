import Link from "next/link";
import { adminDict } from "@/admin/i18n";
import { Area, BiField, Check, Field, PageHead, Save, SavedBanner, Section } from "@/admin/ui";
import { MediaPicker } from "@/admin/client";
import { saveSettings } from "@/admin/actions";
import { getSettings, MANUAL_METHODS } from "@/lib/settings";

const TABS = ["brand", "colors", "home", "about", "contacts", "coach", "payments", "seo"] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string }> }) {
  const sp = await searchParams;
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as (typeof TABS)[number]) : "brand";
  const { a, lang } = await adminDict();
  const s = await getSettings();
  const ru = lang === "ru";
  const pick = { chooseText: a.choose, removeText: a.remove, uploadText: a.dropHere, uploadingText: a.uploading };
  const tabLabel: Record<(typeof TABS)[number], string> = {
    brand: ru ? "Бренд" : "Brand", colors: ru ? "Цвета" : "Colors", home: ru ? "Главная" : "Homepage", about: ru ? "Биография" : "About",
    contacts: ru ? "Контакты" : "Contacts", coach: ru ? "Расписание" : "Scheduling", payments: ru ? "Оплата" : "Payments", seo: "SEO",
  };
  return (
    <div className="max-w-5xl">
      <PageHead title={a.settings} />
      <nav className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/settings?tab=${t}`} className={`shrink-0 rounded-full px-4 py-2 text-sm ${t === tab ? "bg-accent text-white" : "border border-line text-muted"}`}>{tabLabel[t]}</Link>
        ))}
      </nav>
      <SavedBanner show={!!sp.saved} text={a.saved} />
      <form action={saveSettings}>
        <input type="hidden" name="section" value={tab} />

        {tab === "brand" && (
          <Section>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={ru ? "Название бренда" : "Brand name"} name="name" defaultValue={s.brand.name} required />
              <Field label={ru ? "Альтернативное название" : "Alternative name"} name="altName" defaultValue={s.brand.altName} />
            </div>
            <div className="mt-4"><BiField label={ru ? "Слоган" : "Slogan"} name="slogan" row={s.brand} missingText={a.missing} /></div>
            <div className="mt-4"><MediaPicker name="logoId" value={s.brand.logoId} label={ru ? "Логотип (необязательно)" : "Logo (optional)"} {...pick} /></div>
          </Section>
        )}

        {tab === "colors" && (
          <Section>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(s.colors) as [string, string][]).map(([k, v]) => (
                <label key={k} className="block">
                  <span className="label">{k}</span>
                  <span className="flex items-center gap-2">
                    <input type="color" name={k} defaultValue={v.length === 7 ? v : "#000000"} className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-bg" />
                    <code className="text-xs text-muted">{v}</code>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">{ru ? "accent — основной цвет кнопок; lime — акцент для отдельных элементов." : "accent is the main button color; lime is used sparingly for highlights."}</p>
          </Section>
        )}

        {tab === "home" && (
          <>
            <Section title={ru ? "Первый экран" : "Hero"}>
              <div className="space-y-4">
                <BiField label={ru ? "Заголовок" : "Headline"} name="heroTitle" row={s.home} missingText={a.missing} />
                <BiField label={ru ? "Подзаголовок" : "Subtitle"} name="heroSub" row={s.home} area rows={2} missingText={a.missing} />
                <div className="grid gap-4 md:grid-cols-2">
                  <MediaPicker name="heroImageId" value={s.home.heroImageId} label={ru ? "Фото первого экрана" : "Hero photo"} {...pick} />
                  <MediaPicker name="heroVideoId" value={s.home.heroVideoId} kind="video" label={ru ? "Фоновое видео (публичное, без звука)" : "Background video (public, muted)"} {...pick} />
                </div>
              </div>
            </Section>
            <Section title={ru ? "Тексты и фото разделов" : "Section texts & photos"}>
              <div className="space-y-4">
                <BiField label={ru ? "Мотивирующие слова (через точку)" : "Motivational words (separated by periods)"} name="words" row={s.home} missingText={a.missing} />
                <BiField label={ru ? "Финальный призыв" : "Final call to action"} name="finalCta" row={s.home} missingText={a.missing} />
                <div className="grid gap-4 md:grid-cols-2">
                  <MediaPicker name="coachImageId" value={s.home.coachImageId} label={ru ? "Фото «Ваш тренер»" : "“Meet your coach” photo"} {...pick} />
                  <MediaPicker name="anywhereImageId" value={s.home.anywhereImageId} label={ru ? "Фото «Тренируйтесь где угодно»" : "“Train anywhere” photo"} {...pick} />
                  <MediaPicker name="onlineImageId" value={s.home.onlineImageId} label={ru ? "Фото «Онлайн-тренировки»" : "“Online training” photo"} {...pick} />
                  <MediaPicker name="featuredVideoId" value={s.home.featuredVideoId} kind="video" label={ru ? "Видео на главной (публичное)" : "Featured video (public)"} {...pick} />
                </div>
              </div>
            </Section>
          </>
        )}

        {tab === "about" && (
          <Section>
            <div className="space-y-4">
              <MediaPicker name="photoId" value={s.about.photoId} label={ru ? "Фото" : "Photo"} {...pick} />
              <BiField label={ru ? "Биография (Markdown)" : "Biography (Markdown)"} name="bio" row={s.about} area rows={14} missingText={a.missing}
                hint={ru ? "**жирный**, пустая строка — новый абзац. Первый абзац показывается на главной." : "**bold**, blank line = new paragraph. The first paragraph is shown on the homepage."} />
            </div>
          </Section>
        )}

        {tab === "contacts" && (
          <Section>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(s.contacts).map(([k, v]) => <Field key={k} label={k} name={k} defaultValue={v} />)}
            </div>
          </Section>
        )}

        {tab === "coach" && (
          <Section>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={ru ? "Ваш часовой пояс" : "Your time zone"} name="timezone" defaultValue={s.coach.timezone} hint="e.g. America/New_York, Europe/Kyiv" />
              <Field label={ru ? "Email для уведомлений" : "Notification email"} name="notifyEmail" defaultValue={s.coach.notifyEmail} type="email" />
              <Field label={ru ? "Минимум часов до записи" : "Minimum notice (hours)"} name="noticeHours" defaultValue={s.coach.noticeHours} type="number" />
              <Field label={ru ? "На сколько дней вперёд открыта запись" : "Booking window (days)"} name="windowDays" defaultValue={s.coach.windowDays} type="number" />
              <Field label={ru ? "Шаг времени (мин)" : "Time step (min)"} name="slotStepMin" defaultValue={s.coach.slotStepMin} type="number" />
              <Field label={ru ? "Ссылка на видеозвонок по умолчанию" : "Default video call link"} name="meetingUrl" defaultValue={s.coach.meetingUrl} hint="Zoom / Google Meet" />
            </div>
            <p className="mt-4 text-sm text-muted">{ru ? "Рабочие часы по дням недели — в разделе «Записи и расписание»." : "Weekly working hours are set in “Bookings & Schedule”."}</p>
          </Section>
        )}

        {tab === "payments" && (
          <>
            <Section title="Stripe">
              <Check label={ru ? "Принимать карты, Apple Pay и Google Pay через Stripe" : "Accept cards, Apple Pay and Google Pay via Stripe"} name="stripeEnabled" defaultChecked={s.payments.stripeEnabled} />
              <p className="mt-3 text-sm text-muted">
                {process.env.STRIPE_SECRET_KEY ? "✓ STRIPE_SECRET_KEY" : ru ? "⚠ Ключи Stripe не заданы (STRIPE_SECRET_KEY и STRIPE_WEBHOOK_SECRET в настройках хостинга)." : "⚠ Stripe keys are not set (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your hosting environment)."}
              </p>
            </Section>
            {MANUAL_METHODS.map((k) => {
              const m = s.payments.manual[k];
              return (
                <Section key={k} title={m.label}>
                  <div className="space-y-4">
                    <Check label={ru ? "Показывать этот способ" : "Show this method"} name={`${k}_enabled`} defaultChecked={m.enabled} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={ru ? "Название" : "Label"} name={`${k}_label`} defaultValue={m.label} />
                      <Area label={ru ? "Реквизиты (email, телефон, кошелёк…)" : "Payment details (email, phone, wallet…)"} name={`${k}_details`} defaultValue={m.details} rows={2} />
                    </div>
                    <BiField label={ru ? "Инструкция" : "Instructions"} name={`${k}_instructions`} row={{ [`${k}_instructionsEn`]: m.instructionsEn, [`${k}_instructionsRu`]: m.instructionsRu }} area rows={2} missingText={a.missing} />
                  </div>
                </Section>
              );
            })}
          </>
        )}

        {tab === "seo" && (
          <Section>
            <div className="space-y-4">
              <BiField label={ru ? "Заголовок сайта" : "Site title"} name="title" row={s.seo} missingText={a.missing} />
              <BiField label={ru ? "Описание для поисковиков" : "Search description"} name="desc" row={s.seo} area rows={3} missingText={a.missing} />
            </div>
          </Section>
        )}

        <Save label={a.save} />
      </form>
    </div>
  );
}
