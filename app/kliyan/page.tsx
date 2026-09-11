import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { CustomerListClient } from "@/components/CustomerListClient";
import { getCustomers, getPipeline, getMyBusiness, getCurrentUserSession, getRolePermissions } from "@/lib/data";

export default async function KliyanPage() {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);

  if (!permissions.allowedNavTabs.includes("kliyan")) {
    redirect("/");
  }

  const [customers, pipelineCards, business] = await Promise.all([
    getCustomers(),
    getPipeline(),
    getMyBusiness(),
  ]);

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-white pb-[96px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white">
          <Rooster />
        </div>
        <span className="text-[21px] font-extrabold tracking-tight text-white">Fichye Kliyan</span>
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {customers.length} kliyan
        </span>
      </header>

      <CustomerListClient customers={customers} pipelineCards={pipelineCards} business={business} />

      <BottomNav active="kliyan" userSession={session} />
    </div>
  );
}

function Rooster() {
  return (
    <svg width="25" height="25" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" /><circle cx="41" cy="11" r="4" fill="#FFD34E" /><circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#075E54" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" /><path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" /><circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
