// Configuration par type de business : CONVERZA s'adapte à chaque secteur
// (vocabulaire, mise en page de la vitrine, catégories par défaut).

export type BusinessType =
  | "supermarket"
  | "autoparts"
  | "boutik"
  | "online_store"
  | "restoran"
  | "boulanjri"
  | "fastfood"
  | "depo_alimante"
  | "depo_bwason"
  | "enfomel";

export interface VerticalConfig {
  label: string; // nom du secteur (affichage)
  catalogWord: string; // "Katalòg" ou "Menu"
  layout: "grid" | "menu"; // présentation de la vitrine
  defaultCategories: string[];
}

export const VERTICALS: Record<BusinessType, VerticalConfig> = {
  supermarket: {
    label: "SuperMarket",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Manje", "Bwason", "Pwodwi kay", "Fwi & legim", "Konjelé"],
  },
  autoparts: {
    label: "Autoparts",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Motè", "Fren", "Elektrik", "Kawotchou", "Lwil & filt"],
  },
  boutik: {
    label: "Boutik",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Rad", "Soulye", "Akseswa", "Bote"],
  },
  online_store: {
    label: "Online Store",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Nouvo", "Popilè", "Pwomo"],
  },
  restoran: {
    label: "Restoran",
    catalogWord: "Menu",
    layout: "menu",
    defaultCategories: ["Antre", "Plat prensipal", "Bwason", "Desè"],
  },
  boulanjri: {
    label: "Boulanjri",
    catalogWord: "Menu",
    layout: "menu",
    defaultCategories: ["Pen", "Gato", "Patisri", "Bwason cho"],
  },
  fastfood: {
    label: "Fast Food",
    catalogWord: "Menu",
    layout: "menu",
    defaultCategories: ["Konbo", "Sandwich", "Fri", "Bwason"],
  },
  depo_alimante: {
    label: "Depo Alimantè",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Manje", "Grenn", "Konsèv", "An gwo"],
  },
  depo_bwason: {
    label: "Depo Bwason",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: ["Byè", "Kola", "Ji", "Dlo", "Alkòl"],
  },
  enfomel: {
    label: "Biznis",
    catalogWord: "Katalòg",
    layout: "grid",
    defaultCategories: [],
  },
};

export function verticalOf(type: string | null | undefined): VerticalConfig {
  return VERTICALS[(type as BusinessType) ?? "boutik"] ?? VERTICALS.boutik;
}
