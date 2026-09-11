import { redirect } from "next/navigation";
import { CatalogManager } from "@/components/CatalogManager";
import { getCatalog, getMyBusiness, getCurrentUserSession, getRolePermissions } from "@/lib/data";

// Écran Katalòg (marchand) — gérer les produits : ajouter, modifier, supprimer.
export default async function KatalogPage() {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);

  if (!permissions.allowedNavTabs.includes("katalog")) {
    redirect("/");
  }

  const [business, products] = await Promise.all([getMyBusiness(), getCatalog()]);
  return <CatalogManager business={business} initial={products} userSession={session} />;
}
