import { redirect } from "next/navigation";

// Le journal d'audit affichait des activités d'agents inventées. Tant qu'aucune
// action n'est réellement journalisée côté marchand, l'ancienne adresse ramène
// au tableau de bord plutôt qu'à une page trompeuse.
export default function AuditPage() {
  redirect("/");
}
