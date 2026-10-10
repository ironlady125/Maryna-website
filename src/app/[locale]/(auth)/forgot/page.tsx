import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { ForgotForm } from "@/components/AuthForms";

export const metadata = { robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ next?: string; token?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = getDict(locale);
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <h1 className="display mb-8 text-4xl">{t.auth.forgotTitle}</h1>
        <ForgotForm locale={locale} t={t.auth} next={sp.next} />
      </div>
    </div>
  );
}
