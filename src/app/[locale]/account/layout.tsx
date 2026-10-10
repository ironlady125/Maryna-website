import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { AccountNav } from "@/components/AccountNav";
import Link from "next/link";

export const metadata = { robots: { index: false } };

export default async function AccountLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale = lc as Locale;
  const user = await requireUser(locale, `/${locale}/account`);
  const t = getDict(locale);
  const L = (p: string) => `/${locale}/account${p}`;
  return (
    <div className="container-x py-10 pb-28 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">{t.account.title}</div>
          <h1 className="display text-4xl sm:text-6xl">{t.account.hello.replace("{name}", user.name || user.email.split("@")[0])}</h1>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && <Link href="/admin" className="btn-ghost !py-2">{t.nav.admin}</Link>}
          <form action={logout}>
            <input type="hidden" name="locale" value={locale} />
            <button className="text-sm uppercase tracking-widest text-muted hover:text-ink">{t.nav.logout}</button>
          </form>
        </div>
      </div>
      <AccountNav
        items={[
          { href: L(""), label: t.account.tabs.home, icon: "◉" },
          { href: L("/programs"), label: t.account.tabs.programs, icon: "▶" },
          { href: L("/sessions"), label: t.account.tabs.sessions, icon: "◷" },
          { href: L("/profile"), label: t.account.tabs.profile, icon: "☺" },
        ]}
      />
      {children}
    </div>
  );
}
