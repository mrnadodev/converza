// Plans d'abonnement CONVERZA (modèle de revenus).
export interface Plan {
  key: string;
  name: string;
  priceGdes: number; // par mois
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "gratis",
    name: "Gratis",
    priceGdes: 0,
    tagline: "Pou kòmanse",
    features: ["Vitrin piblik", "Katalòg + kòmand WhatsApp", "1 itilizatè", "Zòn livrezon"],
  },
  {
    key: "pro",
    name: "Pro",
    priceGdes: 750,
    tagline: "Pou biznis k ap grandi",
    highlight: true,
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

export function planOf(key: string | null | undefined): Plan {
  return PLANS.find((p) => p.key === key) ?? PLANS[0];
}

// Numéro de collecte CONVERZA (à remplacer par le vrai).
export const CONVERZA_PAYMENT_INFO = {
  moncash: "[NIMEWO MONCASH CONVERZA]",
  natcash: "[NIMEWO NATCASH CONVERZA]",
  bank: "[KONT LABANK CONVERZA]",
};
