// Plans d'abonnement CONVERZA (modèle de revenus).
export interface Plan {
  key: string;
  name: string;
  priceGdes: number; // par mois
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export interface BankAccountDetails {
  bank_name: string;
  account_number: string;
  currency: "HTG" | "USD";
  account_holder: string;
}

export interface PlatformPaymentInfo {
  moncash: string;
  natcash: string;
  bank: string;
  bank_details?: BankAccountDetails[];
  zelle?: string;
  usdt?: string;
  moncash_qr_url?: string;
  natcash_qr_url?: string;
}

// Valeurs par défaut. La configuration réelle est lue en base
// (lib/platform-store.ts) ; ces constantes servent de repli au premier
// démarrage et en mode démo.
export const DEFAULT_PLANS: Plan[] = [
  {
    key: "gratis",
    name: "Gratis",
    priceGdes: 0,
    tagline: "Pou kòmanse",
    features: ["Vitrin piblik", "Katalòg + kòmand WhatsApp", "1 itilizatè", "Zòn livrezon"],
  },
  {
    key: "qr_express",
    name: "Menu QR Express",
    priceGdes: 500,
    tagline: "Spesyal pou Restoran, Bar & Kafeterya (Sèvis Standalone)",
    highlight: true,
    features: [
      "Menu Dijital ak Imaj 4:5 Hyper-Visyèl (Fòma 2Lx2.5H)",
      "Gjeniratè Chevalet QR pou Tab (Jiska 25 tab)",
      "Pran kòmand sou Tab ak notifikasyon Kwizin (/komand)",
      "Sipò Not Kizin (San piman, plis glas...)",
      "Kòmand dirèk WhatsApp ak chwa tab",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceGdes: 750,
    tagline: "Pou biznis k ap grandi",
    features: [
      "Tout sa ki nan Gratis",
      "Pipeline + relans otomatik",
      "Jiska 3 ajan (team)",
      "Rapò vant + best-sellers",
      "Mesaj 1-clic",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    priceGdes: 2500,
    tagline: "Pou vann san rete",
    features: [
      "Tout sa ki nan Pro",
      "API WhatsApp (mesaj otomatik)",
      "AI Assistant (reponn pou ou)",
      "Ajan san limit",
      "Notifikasyon nouvo kòmand",
    ],
  },
];

/**
 * Coordonnées d'encaissement de la plateforme, avant toute configuration.
 *
 * Elles sont vides à dessein : les valeurs de démonstration livrées ici
 * (numéro MonCash, comptes bancaires « CONVERZA S.A. ») s'affichaient aux
 * marchands sur la page Abonnement comme le compte où envoyer leur paiement.
 * Tant que le super-admin n'a pas saisi les vraies coordonnées, la page le dit
 * au lieu d'inventer un numéro.
 */
export const DEFAULT_PAYMENT_INFO: PlatformPaymentInfo = {
  moncash: "",
  natcash: "",
  bank: "",
  bank_details: [],
  zelle: "",
  usdt: "",
  moncash_qr_url: "",
  natcash_qr_url: "",
};

/** Repli synchrone, sur les valeurs par défaut. Pour la configuration réelle,
 *  utiliser `planByKey` de lib/platform-store.ts. */
export function planOf(key: string | null | undefined, plans: Plan[] = DEFAULT_PLANS): Plan {
  return plans.find((p) => p.key === key) ?? plans[0];
}

/**
 * Nombre de membres autorisés par plan (propriétaire compris), `null` = illimité.
 * La limite était contrôlée uniquement dans l'interface : un lien d'invitation
 * suffisait à la contourner. Elle est désormais vérifiée aussi côté serveur.
 */
export function memberSeatsFor(plan: string | null | undefined): number | null {
  switch ((plan ?? "gratis").toLowerCase()) {
    case "premium":
      return null;
    case "pro":
      return 4; // le propriétaire + 3 agents
    case "qr_express":
      return 2;
    default:
      return 1;
  }
}