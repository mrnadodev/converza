import { verticalOf } from "./verticals";
import type { Language } from "./i18n/translations";

// Catégories de produits proposées au marchand, dans la langue du site.
//
// Jusqu'ici les suggestions d'un commerce venaient d'une liste écrite en
// créole (« Rad & Soulye », « Pwomo Flach ») quelle que soit la langue, et
// s'affichaient telles quelles sur la vitrine d'un marchand francophone.
//
// La catégorie reste un texte libre : un marchand peut écrire la sienne. Mais
// les catégories que nous proposons ont maintenant une version par langue, et
// une catégorie déjà enregistrée dans une langue s'affiche dans celle du
// visiteur.

export interface CategoryOption {
  key: string;
  /** Regroupement affiché avant la catégorie (Homme, Femme, Enfant…). */
  group?: string;
  labels: Record<Language, string>;
}

/**
 * Boutiques de vêtements et chaussures : trois publics, trois rayons.
 * Demandé par les marchands, qui rangeaient tout dans « Rad & Soulye ».
 */
const FASHION: CategoryOption[] = [
  ["homme", "Homme", "Gason", "Men"],
  ["femme", "Femme", "Fanm", "Women"],
  ["enfant", "Enfant", "Timoun", "Kids"],
].flatMap(([groupKey, gFr, gHt, gEn]) =>
  [
    ["chaussures", "Chaussures", "Soulye", "Shoes"],
    ["vetements", "Vêtements", "Rad", "Clothing"],
    ["accessoires", "Accessoires", "Akseswa", "Accessories"],
  ].map(([rayon, rFr, rHt, rEn]) => ({
    key: `${groupKey}_${rayon}`,
    group: gFr,
    labels: {
      fr: `${gFr} · ${rFr}`,
      ht: `${gHt} · ${rHt}`,
      en: `${gEn} · ${rEn}`,
    } as Record<Language, string>,
  })),
);

const opt = (key: string, fr: string, ht: string, en: string): CategoryOption => ({ key, labels: { fr, ht, en } });

/** Catégories proposées par secteur, hors mode. */
const BY_SECTOR: Record<string, CategoryOption[]> = {
  commerce_vente: [
    opt("mode", "Vêtements & chaussures", "Rad & Soulye", "Clothing & shoes"),
    opt("beaute", "Beauté & parfums", "Bote & Parfen", "Beauty & perfumes"),
    opt("electronique", "Électronique", "Elektronik", "Electronics"),
    opt("accessoires", "Accessoires", "Akseswa", "Accessories"),
    opt("promo", "Promotions", "Pwomo Flach", "Deals"),
  ],
  restauration: [
    opt("entree", "Entrées", "Antre", "Starters"),
    opt("plat", "Plats principaux", "Plat Prensipal", "Main dishes"),
    opt("dessert", "Pâtisserie & desserts", "Patisri & Desè", "Pastry & desserts"),
    opt("boisson", "Boissons", "Bwason", "Drinks"),
    opt("combo", "Combos spéciaux", "Konbo Spesyal", "Special combos"),
  ],
};

/** Reconnaît une boutique de vêtements et chaussures à son type d'activité. */
export function isFashionShop(businessType: string | null | undefined): boolean {
  const t = (businessType ?? "").toLowerCase();
  return /v[êe]tement|chaussure|soulye|rad|mode|fashion|shoe|clothing|boutique de v/.test(t);
}

/** Catégories à proposer au marchand, dans sa langue. */
export function categoriesFor(businessType: string | null | undefined, language: Language): { label: string; group?: string }[] {
  const options = isFashionShop(businessType) ? FASHION : BY_SECTOR[verticalOf(businessType).id];
  if (options) return options.map((o) => ({ label: o.labels[language] ?? o.labels.fr, group: o.group }));
  // Secteur sans liste traduite : on garde les suggestions d'origine.
  return verticalOf(businessType).defaultCategories.map((label) => ({ label }));
}

const ALL: CategoryOption[] = [...FASHION, ...Object.values(BY_SECTOR).flat()];

/**
 * Libellé d'une catégorie enregistrée, dans la langue du visiteur.
 * Une catégorie écrite à la main par le marchand s'affiche telle quelle.
 */
export function categoryLabel(value: string | null | undefined, language: Language): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const needle = raw.toLowerCase();
  const found = ALL.find(
    (o) => o.key === needle || Object.values(o.labels).some((l) => l.toLowerCase() === needle),
  );
  return found ? found.labels[language] ?? raw : raw;
}
