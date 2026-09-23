// Plans d'abonnement CONVERZA (modèle de revenus).
export interface Plan {
  key: string;
  name: string;
  priceGdes: number; // par mois
  tagline: string;
  features: string[];
  highlight?: boolean;
  /**
   * Textes par langue saisis dans la console (lib/plan-texts.ts). Les champs
   * ci-dessus restent la version créole, écrite avant que les langues soient
   * séparées.
   */
  i18n?: Partial<Record<import("./i18n/translations").Language, { name?: string; tagline?: string; features?: string[] }>>;
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
      "Menu QR pou tab yo (restoran, bar, kafeterya)",
      "API WhatsApp, mesaj otomatik (byento)",
      "Asistan IA ki reponn pou ou (byento)",
      "Ajan san limit",
      "Notifikasyon nouvo kòmand (byento)",
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
/**
 * Jours de tolérance après l'échéance. Un marchand qui paie le 5 et renouvelle
 * le 6 ne doit pas voir sa vitrine changer entre les deux.
 */
export const PLAN_GRACE_DAYS = 3;

/**
 * Plan réellement dû aujourd'hui. **Toute fonction payante se décide ici**,
 * jamais sur `business.plan` seul : le plan reste écrit en base après
 * l'échéance, donc le lire directement offre l'abonnement à vie au premier
 * mois payé.
 *
 * `plan_until` vide signifie « pas d'échéance connue » — un plan accordé
 * depuis la console. On le laisse actif : c'est une décision humaine.
 */
export function effectivePlan(
  plan: string | null | undefined,
  planUntil: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  const key = (plan ?? "gratis").toLowerCase();
  if (key === "gratis") return "gratis";
  if (!planUntil) return key;
  const end = planUntil instanceof Date ? planUntil.getTime() : Date.parse(planUntil);
  if (!Number.isFinite(end)) return key;
  return end + PLAN_GRACE_DAYS * 86_400_000 > now.getTime() ? key : "gratis";
}

/**
 * Nouvelle date de fin après un paiement.
 *
 * Un renouvellement du même plan, payé avant l'échéance, s'ajoute à la fin en
 * cours : le marchand qui paie en avance ne perd aucun jour déjà payé. Un
 * changement de plan, ou un plan déjà échu, repart d'aujourd'hui.
 */
export function nextPlanUntil(
  currentPlan: string | null | undefined,
  currentUntil: string | Date | null | undefined,
  newPlan: string,
  now: Date = new Date(),
  months = 1,
): Date {
  const end = currentUntil ? new Date(currentUntil) : null;
  const sameAndActive =
    (currentPlan ?? "gratis").toLowerCase() === newPlan.toLowerCase() &&
    end !== null &&
    Number.isFinite(end.getTime()) &&
    end.getTime() > now.getTime();
  const until = new Date(sameAndActive ? (end as Date) : now);
  // En UTC : le résultat ne dépend pas du fuseau du serveur ni de l'heure d'été.
  until.setUTCMonth(until.getUTCMonth() + months);
  return until;
}

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