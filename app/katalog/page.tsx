import { CatalogManager } from "@/components/CatalogManager";
import { getCatalog, getMyBusiness } from "@/lib/data";

// Écran Katalòg (marchand) — gérer les produits : ajouter, modifier, supprimer.
export default async function KatalogPage() {
  const [business, products] = await Promise.all([getMyBusiness(), getCatalog()]);
  return <CatalogManager business={business} initial={products} />;
}
