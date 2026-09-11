import { redirect } from "next/navigation";
import { AuditManager } from "@/components/AuditManager";
import { getCurrentUserSession, getRolePermissions } from "@/lib/data";

// Écran Audit (owner uniquement).
export default async function AuditPage() {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);

  if (!permissions.allowedNavTabs.includes("audit")) {
    redirect("/");
  }

  return <AuditManager userSession={session} />;
}
