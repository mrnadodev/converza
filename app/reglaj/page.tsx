import { SettingsForm } from "@/components/SettingsForm";
import { getMyBusiness } from "@/lib/data";

// Réglages du business : logo, bannière, infos, réseaux sociaux.
export default async function ReglajPage() {
  const business = await getMyBusiness();
  return <SettingsForm business={business} />;
}
