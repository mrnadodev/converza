"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/components/LanguageContext";
import { getRolePermissions, type NavTab, type UserSession } from "@/lib/rbac";

type Tab = NavTab;

function Icon({ node, on, disabled }: { node: React.ReactNode; on: boolean; disabled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={disabled ? "#CBD5E1" : on ? "#008069" : "#8696A0"} strokeWidth={on ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round">
      {node}
    </svg>
  );
}

export function BottomNav({ active, userSession, unreadAuditCount = 3 }: { active: Tab; userSession?: UserSession; unreadAuditCount?: number }) {
  const { t } = useTranslation();
  const permissions = userSession ? getRolePermissions(userSession) : null;
  const allowedTabs = permissions ? permissions.allowedNavTabs : ["tablo", "chat", "komand", "stok", "katalog", "kliyan", "audit"];

  const items: { key: Tab; label: string; href: string; icon: React.ReactNode; badge?: string }[] = [
    { key: "tablo", label: t("nav", "dashboard"), href: "/", icon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
    { key: "chat", label: t("nav", "chat"), href: "/chat", icon: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" /> },
    { key: "komand", label: t("nav", "orders"), href: "/komand", icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
    { key: "stok", label: t("nav", "stock"), href: "/stok", icon: <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /> },
    { key: "katalog", label: t("nav", "catalog"), href: "/katalog", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
    { key: "kliyan", label: t("nav", "customers"), href: "/kliyan", icon: <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /></> },
    { key: "audit", label: t("nav", "audit"), href: "/audit", badge: "3", icon: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></> },
  ];

  return (
    <>
      {/* Desktop / tablette : barre de nav en haut */}
      <nav className="fixed left-1/2 top-0 z-30 hidden h-[60px] w-full max-w-[1080px] -translate-x-1/2 border-b border-line bg-white md:block">
        <div className="mx-auto flex h-full max-w-[1080px] items-center justify-between px-3.5">
          <Link href="/" className="mr-2 flex items-center gap-1.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-green to-brand shadow-2xs">
              <svg width="18" height="18" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="56" r="34" fill="#fff" /><path d="M40 80 L32 96 L54 84 Z" fill="#fff" /><path d="M73 42 A 20 20 0 1 0 73 70" fill="none" stroke="#008069" strokeWidth="11" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[16px] font-black tracking-tight text-ink">CONVERZA</span>
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {items.map((it) => {
              const on = it.key === active;
              const allowed = allowedTabs.includes(it.key);
              const badgeText = it.key === "audit" ? (unreadAuditCount > 0 ? String(unreadAuditCount) : undefined) : it.badge;

              if (!allowed) {
                return (
                  <div
                    key={it.key}
                    title={`🔒 Meni ${it.label} desaktive pa dwa aksè ròl (${userSession?.specialty || "Ajan"})`}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-300 bg-gray-50/60 cursor-not-allowed select-none opacity-60"
                  >
                    <Icon node={it.icon} on={false} disabled={true} />
                    <span className="line-through">{it.label}</span>
                    <span className="text-[10px]">🔒</span>
                  </div>
                );
              }

              return (
                <Link key={it.key} href={it.href} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-extrabold whitespace-nowrap transition-colors ${on ? "bg-[#E7F7F1] text-brand" : "text-ink-muted hover:bg-[#F3F6F4]"}`}>
                  <Icon node={it.icon} on={on} />
                  <span>{it.label}</span>
                  {badgeText && (
                    <span className="rounded-full bg-red-600 text-white px-1.5 py-0.2 text-[10px] font-black animate-pulse shadow-xs">
                      {badgeText}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="ml-1 flex items-center gap-1 border-l border-line pl-1.5 shrink-0">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile : barre de nav en bas */}
      <nav className="nav-safe fixed inset-x-0 bottom-0 z-20 flex min-h-[76px] items-start border-t border-line bg-white pt-2.5 md:hidden">
        {items.map((it) => {
          const on = it.key === active;
          const allowed = allowedTabs.includes(it.key);

          if (!allowed) {
            return (
              <div
                key={it.key}
                title={`🔒 Meni ${it.label} desaktive pa dwa aksè ròl (${userSession?.specialty || "Ajan"})`}
                className="flex flex-1 flex-col items-center gap-1 opacity-40 cursor-not-allowed select-none"
              >
                <Icon node={it.icon} on={false} disabled={true} />
                <span className="text-[9.5px] font-medium text-gray-400 line-through flex items-center gap-0.5">
                  {it.label} 🔒
                </span>
              </div>
            );
          }

          return (
            <Link key={it.key} href={it.href} className="flex flex-1 flex-col items-center gap-1">
              <Icon node={it.icon} on={on} />
              <span className={`text-[10.5px] ${on ? "font-bold text-brand" : "font-medium text-ink-faint"}`}>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
