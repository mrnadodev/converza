import Link from "next/link";

type Tab = "tablo" | "chat" | "komand" | "katalog" | "kliyan";

const items: { key: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "tablo", label: "Tablo", href: "/", icon: <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { key: "chat", label: "Chat", href: "/chat", icon: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" /> },
  { key: "komand", label: "Kòmand", href: "/komand", icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
  { key: "katalog", label: "Katalòg", href: "/katalog", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
  { key: "kliyan", label: "Kliyan", href: "/kliyan", icon: <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /></> },
];

function Icon({ node, on }: { node: React.ReactNode; on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? "#008069" : "#8696A0"} strokeWidth={on ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round">
      {node}
    </svg>
  );
}

export function BottomNav({ active }: { active: Tab }) {
  return (
    <>
      {/* Desktop / tablette : barre de nav en haut */}
      <nav className="fixed left-1/2 top-0 z-30 hidden h-[60px] w-full max-w-[1040px] -translate-x-1/2 border-b border-line bg-white md:block">
        <div className="mx-auto flex h-full max-w-[1040px] items-center gap-1 px-6">
          <Link href="/" className="mr-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-green to-brand">
              <svg width="18" height="18" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="56" r="34" fill="#fff" /><path d="M40 80 L32 96 L54 84 Z" fill="#fff" /><path d="M73 42 A 20 20 0 1 0 73 70" fill="none" stroke="#008069" strokeWidth="11" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-ink">CONVERZA</span>
          </Link>
          <div className="flex items-center gap-1">
            {items.map((it) => {
              const on = it.key === active;
              return (
                <Link key={it.key} href={it.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${on ? "bg-[#E7F7F1] text-brand" : "text-ink-muted hover:bg-[#F3F6F4]"}`}>
                  <Icon node={it.icon} on={on} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile : barre de nav en bas */}
      <nav className="nav-safe fixed inset-x-0 bottom-0 z-20 flex min-h-[76px] items-start border-t border-line bg-white pt-2.5 md:hidden">
        {items.map((it) => {
          const on = it.key === active;
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
