import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth";
import { ProfileForm, ReviewForm } from "@/components/ProfileForms";

export default async function Profile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const t = getDict(locale);
  const user = await requireUser(locale);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileForm t={t.account} common={t.common} user={{ name: user.name, locale: user.locale, timezone: user.timezone }} />
      <ReviewForm t={t.account} common={t.common} locale={locale} />
    </div>
  );
}
