import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSettings } from "@/lib/settings";
import { LangSwitch } from "./LangSwitch";

export async function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const s = await getSettings();
  const L = (p: string) => `/${locale}${p}`;
  const c = s.contacts;
  const socials = [
    c.instagram && { label: "Instagram", href: `https://instagram.com/${c.instagram.replace(/^@/, "")}` },
    c.youtube && { label: "YouTube", href: c.youtube.startsWith("http") ? c.youtube : `https://youtube.com/@${c.youtube.replace(/^@/, "")}` },
    c.tiktok && { label: "TikTok", href: `https://tiktok.com/@${c.tiktok.replace(/^@/, "")}` },
    c.facebook && { label: "Facebook", href: c.facebook.startsWith("http") ? c.facebook : `https://facebook.com/${c.facebook}` },
    c.telegram && { label: "Telegram", href: `https://t.me/${c.telegram.replace(/^@/, "")}` },
    c.whatsapp && { label: "WhatsApp", href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="font-display text-xl tracking-wide">{s.brand.name}</div>
          <p className="mt-2 text-sm text-muted">{t.footer.tagline}</p>
          <div className="mt-5">
            <Suspense>
              <LangSwitch current={locale} />
            </Suspense>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-4">{t.footer.explore}</div>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href={L("/training")}>{t.nav.training}</Link></li>
            <li><Link className="hover:text-ink" href={L("/online-training")}>{t.nav.online}</Link></li>
            <li><Link className="hover:text-ink" href={L("/knowledge")}>{t.nav.knowledge}</Link></li>
            <li><Link className="hover:text-ink" href={L("/about")}>{t.nav.about}</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">{t.footer.policies}</div>
          <ul className="space-y-2 text-sm text-muted">
            {(["privacy", "terms", "refunds", "medical-disclaimer"] as const).map((p) => (
              <li key={p}>
                <Link className="hover:text-ink" href={L(`/legal/${p}`)}>
                  {{ privacy: locale === "ru" ? "Конфиденциальность" : "Privacy", terms: locale === "ru" ? "Условия" : "Terms", refunds: locale === "ru" ? "Возвраты" : "Refunds", "medical-disclaimer": locale === "ru" ? "Медицинский дисклеймер" : "Medical disclaimer" }[p]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">{t.footer.contact}</div>
          <ul className="space-y-2 text-sm text-muted">
            {c.email && <li><a className="hover:text-ink" href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.phone && <li><a className="hover:text-ink" href={`tel:${c.phone}`}>{c.phone}</a></li>}
            {socials.map((x) => (
              <li key={x.label}><a className="hover:text-ink" href={x.href} target="_blank" rel="noopener noreferrer">{x.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x py-6 text-xs text-muted/70">
          <p>© {new Date().getFullYear()} {s.brand.name}. {t.footer.rights}</p>
          <p className="mt-2 max-w-4xl">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
