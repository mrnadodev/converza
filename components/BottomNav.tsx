"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { getRolePermissions, type NavTab, type UserSession } from "@/lib/rbac";

const ALL_TABS: NavTab[] = ["tablo", "komand", "katalog", "stok", "kliyan", "kes"];

function Icon({ node, on }: { node: React.ReactNode; on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? "#008069" : "#8696A0"} strokeWidth={on ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {node}
    </svg>
  );
}

// Les onglets qu'un rôle ne peut pas ouvrir ne sont pas affichés : un menu barré
// n'apprend rien à l'agent et encombre une barre déjà étroite sur mobile.
export function BottomNav({ active, userSession }: { active: NavTab | null; userSession?: UserSession }) {
  const c = useDict(COMMON_COPY);
  const allowedTabs = userSession ? getRolePermissions(userSession).allowedNavTabs : ALL_TABS;

  const items: { key: NavTab; label: string; href: string; icon: React.ReactNode }[] = [
    { key: "tablo", label: c.nav.home, href: "/", icon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
    { key: "komand", label: c.nav.orders, href: "/komand", icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
    { key: "katalog", label: c.nav.catalog, href: "/katalog", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
    { key: "stok", label: c.nav.stock, href: "/stok", icon: <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /> },
    { key: "kliyan", label: c.nav.customers, href: "/kliyan", icon: <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /></> },
    { key: "kes", label: c.nav.cash, href: "/kes", icon: <><rect x="2" y="6" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><circle cx="16.5" cy="15" r="1.4" /></> },
  ];
  const visible = items.filter((it) => allowedTabs.includes(it.key));

  return (
    <>
      {/* Desktop / tablette : barre de nav en haut */}
      {/* Même largeur que la page (.app-page, 1040 px) : la barre ne dépasse
          plus du cadre. */}
      <nav className="fixed left-1/2 top-0 z-30 hidden h-[60px] w-full max-w-[1040px] -translate-x-1/2 border-b border-line bg-white shadow-[0_0_0_1px_#E2E9E5] md:block">
        <div className="flex h-full min-w-0 items-center justify-between gap-2 px-3.5">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-green to-brand shadow-2xs">
              <svg width="18" height="18" viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="56" r="34" fill="#fff" /><path d="M40 80 L32 96 L54 84 Z" fill="#fff" /><path d="M73 42 A 20 20 0 1 0 73 70" fill="none" stroke="#008069" strokeWidth="11" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[16px] font-black tracking-tight text-ink">CONVERZA</span>
          </Link>
          <div className="flex min-w-0 items-center gap-0.5 lg:gap-1">
            {visible.map((it) => {
              const on = it.key === active;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  aria-label={it.label}
                  title={it.label}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-extrabold transition-colors lg:px-3 ${on ? "bg-[#E7F7F1] text-brand" : "text-ink-muted hover:bg-[#F3F6F4]"}`}
                >
                  <Icon node={it.icon} on={on} />
                  {/* Tablette : icônes seules, sinon six onglets débordent. */}
                  <span className="hidden lg:inline">{it.label}</span>
                </Link>
              );
            })}
            <div className="ml-1 flex shrink-0 items-center gap-1 border-l border-line pl-1.5">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile : barre de nav en bas */}
      <nav className="nav-safe fixed inset-x-0 bottom-0 z-20 flex min-h-[76px] items-start border-t border-line bg-white pt-2.5 md:hidden">
        {visible.map((it) => {
          const on = it.key === active;
          return (
            <Link key={it.key} href={it.href} aria-current={on ? "page" : undefined} className="flex flex-1 flex-col items-center gap-1">
              <Icon node={it.icon} on={on} />
              <span className={`text-[11px] ${on ? "font-bold text-brand" : "font-medium text-ink-faint"}`}>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
