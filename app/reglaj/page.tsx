import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { getMyBusiness, getCurrentUserSession } from "@/lib/data";

// Réglages du business : logo, bannière, infos, réseaux sociaux.
export default async function ReglajPage() {
  const session = getCurrentUserSession();
  if (session.role !== "owner") {
    redirect("/");
  }

  const business = await getMyBusiness();
  return <SettingsForm business={business} />;
}
