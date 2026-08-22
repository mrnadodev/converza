import { TeamManager } from "@/components/TeamManager";
import { getTeam } from "@/lib/data";

// Gestion de l'équipe (owner + agents).
export default async function EkipPage() {
  const { members, isOwner, businessId } = await getTeam();
  return <TeamManager members={members} isOwner={isOwner} businessId={businessId} />;
}
