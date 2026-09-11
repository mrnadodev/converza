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

export const DEFAULT_PAYMENT_INFO: PlatformPaymentInfo = {
  moncash: "+509 3712 4488",
  natcash: "+509 4123 9988",
  bank: "Sogebank HTG #402-998-1120 / Unibank HTG #220-410-098",
  bank_details: [
    {
      bank_name: "Sogebank",
      account_number: "402-998-1120",
      currency: "HTG",
      account_holder: "CONVERZA S.A.",
    },
    {
      bank_name: "Unibank",
      account_number: "220-410-0981",
      currency: "USD",
      account_holder: "CONVERZA S.A.",
    },
  ],
  zelle: "payments@converza.ht",
  usdt: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  moncash_qr_url: "",
  natcash_qr_url: "",
};

/** Repli synchrone, sur les valeurs par défaut. Pour la configuration réelle,
 *  utiliser `planByKey` de lib/platform-store.ts. */
export function planOf(key: string | null | undefined, plans: Plan[] = DEFAULT_PLANS): Plan {
  return plans.find((p) => p.key === key) ?? plans[0];
}
