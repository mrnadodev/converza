import type { Plan } from "./plans";
import type { Language } from "./i18n/translations";

// Textes d'une offre — nom, accroche, avantages — dans la langue du visiteur.
//
// Jusqu'ici il y en avait deux jeux : ceux de la console (page Abonnement) et
// ceux du code (page d'accueil). Changer un avantage dans la console ne
// changeait rien sur la page que voient les futurs marchands, et les deux
// pages finissaient par se contredire.
//
// Désormais une seule source : la configuration des plans. Elle porte les
// textes par langue ; le code ne fournit plus que les valeurs de départ.

export interface PlanText {
  name: string;
  tagline: string;
  features: string[];
}

export type PlanTextOverrides = Partial<Record<Language, Partial<PlanText>>>;

/** Valeurs de départ, reprises des textes affichés jusqu'ici. */
export const DEFAULT_PLAN_TEXTS: Record<Language, Record<string, PlanText>> = {
  fr: {
    gratis: {
      name: "Gratuit",
      tagline: "Pour commencer",
      features: ["Vitrine publique", "Catalogue et panier WhatsApp", "Zones de livraison", "1 utilisateur"],
    },
    qr_express: {
      name: "Menu QR Express",
      tagline: "Pour les restaurants, bars et cafétérias",
      features: ["Menu visuel pour restaurant", "Chevalets QR, jusqu'à 25 tables", "Commande avec numéro de table", "Notes pour la cuisine"],
    },
    pro: {
      name: "Pro",
      tagline: "Pour un commerce qui grandit",
      features: ["Tout le plan Gratuit", "Suivi des commandes, 7 étapes", "Jusqu'à 3 comptes d'équipe", "Rapports de vente et relances"],
    },
    premium: {
      name: "Premium",
      tagline: "Pour vendre sans interruption",
      features: ["Tout le plan Pro", "Comptes d'équipe illimités", "Assistant de gestion du stock", "Notifications de commande (bientôt)"],
    },
  },
  ht: {
    gratis: {
      name: "Gratis",
      tagline: "Pou kòmanse",
      features: ["Vitrin piblik", "Katalòg ak panier WhatsApp", "Zòn livrezon", "1 itilizatè"],
    },
    qr_express: {
      name: "Menu QR Express",
      tagline: "Spesyal pou restoran, bar ak kafeterya",
      features: ["Menu vizyèl pou restoran", "Chevalè QR, jiska 25 tab", "Kòmand ak nimewo tab", "Nòt pou kwizin nan"],
    },
    pro: {
      name: "Pro",
      tagline: "Pou biznis k ap grandi",
      features: ["Tout plan Gratis la", "Swivi kòmand, 7 etap", "Jiska 3 kont ekip", "Rapò vant ak relans"],
    },
    premium: {
      name: "Premium",
      tagline: "Pou vann san rete",
      features: ["Tout plan Pro a", "Kont ekip san limit", "Asistan jesyon stòk", "Notifikasyon kòmand (byento)"],
    },
  },
  en: {
    gratis: {
      name: "Free",
      tagline: "To get started",
      features: ["Public storefront", "Catalogue and WhatsApp cart", "Delivery zones", "1 user"],
    },
    qr_express: {
      name: "Menu QR Express",
      tagline: "For restaurants, bars and cafeterias",
      features: ["Visual restaurant menu", "QR table tents, up to 25 tables", "Orders with table number", "Kitchen notes"],
    },
    pro: {
      name: "Pro",
      tagline: "For a growing business",
      features: ["Everything in Free", "Order tracking, 7 stages", "Up to 3 team accounts", "Sales reports and reminders"],
    },
    premium: {
      name: "Premium",
      tagline: "To sell without interruption",
      features: ["Everything in Pro", "Unlimited team accounts", "Stock management assistant", "Order notifications (coming soon)"],
    },
  },
};

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Textes d'une offre dans une langue.
 *
 * Ordre : ce que le super-admin a saisi pour cette langue, puis les valeurs de
 * départ du code, puis — en créole seulement — les anciens champs du plan, qui
 * étaient écrits dans cette langue avant que la console ne sépare les langues.
 */
export function planTexts(plan: Plan, language: Language): PlanText {
  const saved = plan.i18n?.[language] ?? {};
  const base = DEFAULT_PLAN_TEXTS[language]?.[plan.key] ?? DEFAULT_PLAN_TEXTS.fr[plan.key];
  const legacy: Partial<PlanText> =
    language === "ht" ? { name: plan.name, tagline: plan.tagline, features: plan.features } : {};

  const features = (saved.features ?? legacy.features ?? base?.features ?? []).map(clean).filter(Boolean);

  return {
    name: clean(saved.name) || clean(legacy.name) || base?.name || plan.name || plan.key,
    tagline: clean(saved.tagline) || clean(legacy.tagline) || base?.tagline || "",
    features: features.length > 0 ? features : (base?.features ?? []),
  };
}

/** Limites de saisie : un avantage tient sur une ligne, une offre en a peu. */
export const MAX_FEATURES = 8;
export const MAX_TEXT_LENGTH = 160;

/**
 * Nettoie ce que la console envoie. Les avantages arrivent une par ligne : la
 * virgule ne sépare plus rien, car un avantage en contient souvent une
 * (« Notes pour la cuisine, sans piment »).
 */
export function sanitizePlanText(input: { name?: string; tagline?: string; features?: string | string[] }): Partial<PlanText> {
  const lines = Array.isArray(input.features) ? input.features : String(input.features ?? "").split("\n");
  const features = lines
    .map((l) => clean(l).slice(0, MAX_TEXT_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_FEATURES);
  const out: Partial<PlanText> = {};
  const name = clean(input.name).slice(0, 60);
  const tagline = clean(input.tagline).slice(0, MAX_TEXT_LENGTH);
  if (name) out.name = name;
  if (tagline) out.tagline = tagline;
  if (features.length > 0) out.features = features;
  return out;
}
