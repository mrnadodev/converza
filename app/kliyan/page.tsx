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
      <CustomerListClient
        customers={customers}
        pipelineCards={pipelineCards}
        business={business}
        canEdit={permissions.canEditCustomers}
      />

      <BottomNav active="kliyan" userSession={session} />
    </div>
  );
}
