import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { StockManager } from "@/components/StockManager";
import { getCatalog, getMyBusiness, getPipeline, getCurrentUserSession, getRolePermissions } from "@/lib/data";

// Écran Stòk — quantités en stock et rapports de ventes.
export default async function StockPage() {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);

  if (!permissions.allowedNavTabs.includes("stok")) {
    redirect("/");
  }

  const [products, business, cards] = await Promise.all([getCatalog(), getMyBusiness(), getPipeline()]);

  return (
    <div className="app-page with-topnav relative flex min-h-[100dvh] flex-col bg-[#F0F2F3]">
      <StockManager business={business} initialProducts={products} cards={cards} canEdit={permissions.canEditStock} />

      <BottomNav active="stok" userSession={session} />
    </div>
  );
}
