import { redirect } from "next/navigation";
import { getCurrentUserSession, getRolePermissions } from "@/lib/data";

// Les conversations vivent dans WhatsApp : l'app ouvre WhatsApp depuis la fiche
// d'un client ou d'une commande. L'ancienne page « Messagerie » n'était qu'un
// renvoi vers la liste des clients ; on y mène directement.
export default function ChatPage() {
  const permissions = getRolePermissions(getCurrentUserSession());
  redirect(permissions.allowedNavTabs.includes("kliyan") ? "/kliyan" : "/komand");
}
