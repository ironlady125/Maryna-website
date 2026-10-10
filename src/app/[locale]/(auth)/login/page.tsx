import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; token?: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const sp = await searchParams;
  const t = getDict(locale);
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <h1 className="display mb-8 text-4xl">{t.auth.loginTitle}</h1>
        <LoginForm locale={locale} t={t.auth} next={sp.next} />
      </div>
    </div>
  );
}
