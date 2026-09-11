import { permanentRedirect } from "next/navigation";

// Ancienne orthographe du chemin. On redirige au lieu de servir une seconde
// copie de la landing page : trois URL pour la même page diluent le
// référencement et faussent les statistiques de campagne.
export default function AcceuilPage(): never {
  permanentRedirect("/accueil");
}
