import Link from "next/link";

type Tab = "tablo" | "chat" | "komand" | "katalog" | "kliyan";

const items: { key: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "tablo", label: "Tablo", href: "/", icon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { key: "chat", label: "Chat", href: "/chat", icon: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" /> },
  { key: "komand", label: "Kòmand", href: "/komand", icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
  { key: "katalog", label: "Katalòg", href: "/katalog", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
  { key: "kliyan", label: "Kliyan", href: "/kliyan", icon: <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /></> },
];

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[76px] max-w-[480px] items-start border-t border-line bg-white pt-2.5">
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link key={it.key} href={it.href} className="flex flex-1 flex-col items-center gap-1">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={on ? "#008069" : "#8696A0"} strokeWidth={on ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round">
              {it.icon}
            </svg>
            <span className={`text-[10.5px] ${on ? "font-bold text-brand" : "font-medium text-ink-faint"}`}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
