import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { getMyBusiness, getCurrentUserSession } from "@/lib/data";
import { loadPlatformSettings } from "@/lib/platform-store";

// Réglages du business : logo, bannière, infos, réseaux sociaux.
export default async function ReglajPage() {
  const session = getCurrentUserSession();
  if (session.role !== "owner") {
    redirect("/");
  }

  const [business, { designs }] = await Promise.all([getMyBusiness(), loadPlatformSettings()]);
  return <SettingsForm business={business} designs={designs} />;
}
