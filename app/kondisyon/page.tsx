import { LegalView } from "@/components/LegalView";
import { loadLegalInfo } from "@/lib/platform-store";

// Conditions d'utilisation, publiques : un marchand doit pouvoir les lire avant
// d'ouvrir un compte, et un client avant de commander.
export default async function TermsPage() {
  return <LegalView doc="terms" info={await loadLegalInfo()} />;
}

// Les coordonnées viennent de la console : la page se rend à la demande, sinon
// elle resterait figée telle qu'elle était au moment du build. La lecture des
// réglages est mise en cache 30 s (lib/platform-store.ts), donc cela ne coûte
// pas une requête par visite.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conditions d'utilisation · CONVERZA",
  description: "Ce que CONVERZA fait, ce qu'elle ne fait pas, et ce que chacun s'engage à respecter.",
};
