import { LandingPage } from "@/components/LandingPage";
import { getPublicPricing } from "@/lib/pricing";
import { loadLandingOverrides } from "@/lib/platform-store";
import { getShowcaseMerchants } from "@/lib/data";

// La page de vente lit désormais les tarifs en base. On la régénère toutes les
// cinq minutes plutôt qu'à chaque visite : c'est la page la plus consultée et
// un tarif n'a pas besoin d'être à la seconde.
export const revalidate = 300;

export default async function AccueilPage() {
  return <LandingPage pricing={await getPublicPricing()} overrides={await loadLandingOverrides()} showcase={await getShowcaseMerchants()} />;
}
