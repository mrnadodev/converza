import { redirect } from "next/navigation";
import { TeamManager } from "@/components/TeamManager";
import { getTeam, getCurrentUserSession } from "@/lib/data";

// Gestion de l'équipe (owner + agents).
export default async function EkipPage() {
  const session = getCurrentUserSession();
  if (session.role !== "owner") {
    redirect("/");
  }

  const { members, isOwner, businessId, businessType, businessPlan } = await getTeam();
  return (
    <TeamManager
      members={members}
      isOwner={isOwner}
      businessId={businessId}
      businessType={businessType ?? undefined}
      businessPlan={businessPlan}
    />
  );
}
