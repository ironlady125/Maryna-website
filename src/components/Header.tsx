import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getMedia, isPublishable, mediaUrl } from "@/lib/media";
import { LangSwitch } from "./LangSwitch";
import { MobileMenu } from "./MobileMenu";

export async function Header({ locale }: { locale: Locale }) {
  const [t, user, s] = [getDict(locale), await getUser(), await getSettings()];
  const logo = await getMedia(s.brand.logoId);
  const L = (p: string) => `/${locale}${p}`;
  const items = [
    { href: L("/training"), label: t.nav.training },
    { href: L("/online-training"), label: t.nav.online },
    { href: L("/knowledge"), label: t.nav.knowledge },
    { href: L("/about"), label: t.nav.about },
  ];
  const words = s.brand.name.split(" ");
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href={L("")} className="flex items-center gap-3" aria-label={s.brand.name}>
          {isPublishable(logo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(logo.id)} alt={s.brand.name} className="h-9 w-auto" />
          ) : (
            <span className="font-display text-lg leading-none tracking-wide sm:text-xl">
              {words.slice(0, 2).join(" ")}{" "}
              <span className="text-accent">{words.slice(2).join(" ")}</span>
            </span>
          )}
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="text-sm uppercase tracking-widest text-muted transition hover:text-ink">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Suspense>
            <LangSwitch current={locale} className="hidden sm:inline-flex" />
          </Suspense>
          {user ? (
            <Link href={L("/account")} className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
              {t.nav.account}
            </Link>
          ) : (
            <>
              <Link href={L("/login")} className="hidden text-sm uppercase tracking-widest text-muted hover:text-ink sm:inline">
                {t.nav.login}
              </Link>
              <Link href={L("/register")} className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
                {t.nav.register}
              </Link>
            </>
          )}
          <MobileMenu
            label={t.nav.menu}
            items={[
              { href: L(""), label: t.nav.home },
              ...items,
              user ? { href: L("/account"), label: t.nav.account } : { href: L("/login"), label: t.nav.login },
              ...(user ? [] : [{ href: L("/register"), label: t.nav.register }]),
              ...(user?.role === "admin" ? [{ href: "/admin", label: t.nav.admin }] : []),
            ]}
            footer={
              <Suspense>
                <LangSwitch current={locale} />
              </Suspense>
            }
          />
        </div>
      </div>
    </header>
  );
}
