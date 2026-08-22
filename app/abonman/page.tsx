import { Subscription } from "@/components/Subscription";
import { getMyBusiness } from "@/lib/data";

// Abonnement : plans + paiement manuel.
export default async function AbonmanPage() {
  const business = await getMyBusiness();
  return <Subscription business={business} />;
}
