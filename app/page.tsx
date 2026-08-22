import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ShareStorefront } from "@/components/ShareStorefront";
import { getDashboard, hasSupabase } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { signOut } from "./login/actions";

// Écran #1 — Tablo debò (dashboard).
export default async function TabloPage() {
  // Un super-admin de la plateforme n'a pas de business : on l'envoie sur /admin.
  if (hasSupabase()) {
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (isAdminEmail(user?.email)) redirect("/admin");
  }

  const { business: demoBusiness, stats: demoStats, topCustomers: demoTopCustomers, funnel } =
    await getDashboard();
  const maxBar = Math.max(...demoStats.weekBars) || 1;
  const funnelMax = funnel.leads || 1;
  const funnelRows = [
    { label: "Kliyan (leads)", value: funnel.leads, color: "#66D2A6" },
    { label: "Kòmand", value: funnel.orders, color: "#16B67C" },
    { label: "Peye", value: funnel.paid, color: "#0E9E6B" },
    { label: "Livre", value: funnel.delivered, color: "#0A7D55" },
  ];
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="relative min-h-[100dvh] bg-chat-bg pb-[96px]">
      {/* App bar */}
      <header className="flex flex-col gap-4 bg-brand px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white">
              <RoosterLogo />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#B9F5E4]">Bonjou, Nadège</span>
              <span className="text-xl font-extrabold tracking-tight text-white">{demoBusiness.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/ekip" title="Ekip" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/15 active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </a>
            <a href="/reglaj" title="Reglaj" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/15 active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </a>
            <form action={signOut}>
              <button
                type="submit"
                title="Dekonekte"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-white/35 bg-brand-teal text-base font-bold text-white active:scale-95"
              >
                NP
              </button>
            </form>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5 text-[#D6F5EC]">
          <SearchIcon />
          <span className="text-sm">Chèche yon kliyan, yon kòmand…</span>
        </div>
      </header>

      <main className="flex flex-col gap-[18px] px-4 pt-[18px]">
        {/* Partager la vitrine publique */}
        <ShareStorefront slug={demoBusiness.slug} />

        {/* KPI hero */}
        <section className="flex flex-col gap-3.5 rounded-xl2 bg-white p-[18px] shadow-[0_2px_10px_rgba(17,27,33,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-muted">Vant semèn nan</span>
            <span className="rounded-full bg-[#E7F7F1] px-2.5 py-1 text-[11px] font-bold text-brand">
              +{demoStats.weekTrendPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-extrabold -tracking-[1px]">
              {(demoStats.weekSalesCents / 100).toLocaleString("fr-HT")}
            </span>
            <span className="text-[15px] font-bold text-ink-muted">HTG</span>
          </div>
          <div className="flex h-14 items-end gap-[7px] pt-1">
            {demoStats.weekBars.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-[5px] ${v === maxBar ? "bg-brand-teal" : "bg-[#D9EFE8]"}`}
                  style={{ height: `${Math.round((v / maxBar) * 46) + 6}px` }}
                />
                <span className="text-[10px] text-ink-faint">{days[i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Deux petits KPI */}
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-[15px] shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E7F7F1]">
              <BagIcon />
            </div>
            <span className="text-2xl font-extrabold">{demoStats.ordersToday}</span>
            <span className="text-xs font-medium text-ink-muted">Kòmand jodi a</span>
          </div>
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-[15px] shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-owed-bg">
              <ClockIcon />
            </div>
            <span className="text-2xl font-extrabold text-owed-text">
              {(demoStats.owedCents / 100).toLocaleString("fr-HT")}
            </span>
            <span className="text-xs font-medium text-ink-muted">Lajan pou resevwa (HTG)</span>
          </div>
        </section>

        {/* Sales Funnel */}
        <section className="flex flex-col gap-3">
          <span className="px-0.5 text-[15px] font-bold">Sales Funnel</span>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            {funnelRows.map((r) => (
              <div key={r.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink-soft">{r.label}</span>
                  <span className="font-extrabold">{r.value.toLocaleString("fr-HT")}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF2F3]">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((r.value / funnelMax) * 100)}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top clients */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[15px] font-bold">Pi bon kliyan yo</span>
            <span className="text-xs font-semibold text-brand">Wè tout</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
            {demoTopCustomers.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-[15px] py-[13px] ${i < demoTopCustomers.length - 1 ? "border-b border-[#F0F2F3]" : ""}`}
              >
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#DCF8C6] text-sm font-bold text-[#2A7D3F]">
                  {c.initials}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{c.full_name}</span>
                  <span className="text-xs text-ink-faint">{c.orders} kòmand</span>
                </div>
                <span className="text-sm font-bold">{formatMoney(c.totalCents).replace(" HTG", "")}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav active="tablo" />
    </div>
  );
}

/* --- Icônes --- */
function RoosterLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" />
      <circle cx="41" cy="11" r="4" fill="#FFD34E" />
      <circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" />
      <path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" />
      <circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
      <path d="M18 30c-6-3-11-2-14 3 4 0 5 3 4 7 4-3 8-3 12-1z" fill="#FFD34E" />
      <path d="M16 36c-6-1-10 1-12 6 4-1 6 2 6 6 3-4 7-5 11-4z" fill="#12B886" />
      <path d="M34 55l-2 6M42 55l2 6" stroke="#FF8C42" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D6F5EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B25E09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
