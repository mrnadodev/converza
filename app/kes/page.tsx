import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { KesView } from "@/components/KesView";
import { getCurrentUserSession, getMyBusiness, getRolePermissions } from "@/lib/data";
import { getKes, KES_PERIODS, type KesPeriod } from "@/lib/kes";
import { getMemberContext } from "@/lib/auth";

// Kès — caisse, dépenses, bénéfice et argent dehors (propriétaire).
export default async function KesPage({ searchParams }: { searchParams: { p?: string } }) {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);
  if (!permissions.allowedNavTabs.includes("kes")) redirect("/");

  const period: KesPeriod = KES_PERIODS.includes(searchParams.p as KesPeriod) ? (searchParams.p as KesPeriod) : "day";
  const [business, me] = await Promise.all([getMyBusiness(), getMemberContext()]);
  const data = await getKes(me?.businessId ?? business.id, business.default_currency ?? "HTG", period);

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-[#F0F2F3] pb-[110px]">
      <KesView data={data} businessName={business.name} />
      <BottomNav active="kes" userSession={session} />
    </div>
  );
}
