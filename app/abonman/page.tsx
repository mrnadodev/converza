import { Subscription } from "@/components/Subscription";
import { getCurrentUserSession, getMyBusiness } from "@/lib/data";
import { loadPlans, loadPaymentInfo } from "@/lib/platform-store";

// Abonnement : plans + paiement manuel.
// Les tarifs et les coordonnées de paiement CONVERZA sont lus côté serveur pour
// que la page reflète ce que le super-admin a réellement enregistré.
export default async function AbonmanPage() {
  const [business, plans, paymentInfo] = await Promise.all([
    getMyBusiness(),
    loadPlans(),
    loadPaymentInfo(),
  ]);
  return <Subscription business={business} plans={plans} paymentInfo={paymentInfo} userSession={getCurrentUserSession()} />;
}
