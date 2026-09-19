import { LegalView } from "@/components/LegalView";
import { loadLegalInfo } from "@/lib/platform-store";

// Politique de confidentialité, publique. Elle décrit ce que le logiciel fait
// réellement des données : voir lib/i18n/legal.ts.
export default async function PrivacyPage() {
  return <LegalView doc="privacy" info={await loadLegalInfo()} />;
}

// Les coordonnées viennent de la console : la page se rend à la demande, sinon
// elle resterait figée telle qu'elle était au moment du build. La lecture des
// réglages est mise en cache 30 s (lib/platform-store.ts), donc cela ne coûte
// pas une requête par visite.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Politique de confidentialité · CONVERZA",
  description: "Quelles données CONVERZA détient, pourquoi, combien de temps, et qui peut les voir.",
};
