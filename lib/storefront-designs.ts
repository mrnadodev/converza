import type { LayoutKey } from "./storefront-layouts";

// Les 33 designs de vitrine : 3 par type de commerce (Gratis, Pro, Premium).
//
// Un design = une forme (disposition des images), un habillage (style des
// cartes), un nombre fixe d'images et un bouton adapté au métier. La vitrine
// n'affiche jamais plus d'images que le design n'en prévoit : le reste des
// produits est dans le catalogue complet.
//
// Les couleurs sont celles du secteur, identiques dans les trois designs, pour
// qu'une boutique reste reconnaissable quand elle change de plan.

export type DesignShape =
  | "hero3" // 1 grande à gauche + 2 petites à droite
  | "showroom3" // 1 grande pleine largeur + 2 dessous
  | "grid4" // 4 cartes égales
  | "portrait4" // 4 cartes portrait 3:4
  | "circles4" // photos rondes
  | "stack3" // 3 bandeaux 16:9 empilés
  | "split3" // 2 carrés + 1 bandeau pleine largeur
  | "alt4" // large + carré / carré + large
  | "capsule4" // 2 capsules à gauche + 2 cartes à droite
  | "masonry4" // hauteurs alternées, façon Instagram
  | "feature4" // 1 bannière + 3 cartes
  | "columns3" // 3 colonnes égales
  | "pricing3" // 3 formules comparées, celle du milieu mise en avant
  | "list" // lignes horizontales
  | "table"; // tableau (gros, quincaillerie)

export type DesignSkin =
  | "dark" // photo + dégradé sombre
  | "light" // photo + dégradé clair
  | "card" // photo en haut, fiche blanche
  | "vip" // fiche indigo, prix doré
  | "neon" // fond noir, contour lumineux
  | "gold" // blanc, filet doré
  | "pastel" // fond doux du secteur
  | "metal" // dégradé acier
  | "minimal" // blanc, filet fin, sans ombre
  | "executive"; // ardoise sombre, texte blanc

/** Action principale d'une carte, selon le métier. */
export type DesignCta = "add" | "book" | "enroll" | "appointment" | "quote" | "visit";

export interface DesignSpec {
  shape: DesignShape;
  skin: DesignSkin;
  slots: 3 | 4;
  cta: DesignCta;
}

export interface SectorPalette {
  /** Fond doux (pastilles, fonds pastel). */
  soft: string;
  /** Couleur forte (boutons, prix, contours). */
  strong: string;
}

export const SECTOR_PALETTES: Record<string, SectorPalette> = {
  commerce_vente: { soft: "#FDE68A", strong: "#D97706" },
  restauration: { soft: "#FECACA", strong: "#DC2626" },
  immobilier: { soft: "#BFDBFE", strong: "#1E3A8A" },
  automobile: { soft: "#E5E7EB", strong: "#374151" },
  sante_bienetre: { soft: "#CCFBF1", strong: "#0D9488" },
  beaute_services: { soft: "#FBCFE8", strong: "#DB2777" },
  education: { soft: "#C7D2FE", strong: "#4338CA" },
  services_pros: { soft: "#DBEAFE", strong: "#1E40AF" },
  construction: { soft: "#FED7AA", strong: "#EA580C" },
  digital_tech: { soft: "#A5F3FC", strong: "#0891B2" },
  grossistes_distribution: { soft: "#FEF3C7", strong: "#B45309" },
};

const d = (shape: DesignShape, skin: DesignSkin, cta: DesignCta, slots?: 3 | 4): DesignSpec => ({
  shape,
  skin,
  cta,
  slots: slots ?? (["hero3", "showroom3", "stack3", "split3", "columns3", "pricing3"].includes(shape) ? 3 : 4),
});

export const SECTOR_DESIGNS: Record<string, [DesignSpec, DesignSpec, DesignSpec]> = {
  // Boutique e-commerce · Vedette (1 grande + 2) · Showcase Deluxe
  commerce_vente: [d("grid4", "card", "add"), d("hero3", "dark", "add"), d("feature4", "vip", "add")],
  // Cercle bistrot · Grille 2×2 arrondie · Menu express gourmet
  restauration: [d("circles4", "pastel", "add"), d("grid4", "light", "add"), d("list", "vip", "add", 4)],
  // Prestige 16:9 · Mixte 2+1 · Villa Deluxe
  immobilier: [d("stack3", "card", "visit"), d("split3", "light", "visit"), d("columns3", "vip", "visit")],
  // Showroom · Grille alternée · Spec Sheet Pro
  automobile: [d("showroom3", "dark", "add"), d("alt4", "light", "add"), d("grid4", "metal", "add")],
  // Soins clean · Capsules · Clinique zen & spa
  sante_bienetre: [d("grid4", "minimal", "appointment"), d("capsule4", "light", "appointment"), d("grid4", "pastel", "appointment")],
  // Book 3:4 · Tarif & réservation express · Glamour portfolio
  beaute_services: [d("portrait4", "card", "book"), d("list", "minimal", "book", 4), d("masonry4", "dark", "book")],
  // Catalogue académique · Fiche programme · Masterclass hub
  education: [d("grid4", "card", "enroll"), d("list", "card", "enroll", 3), d("feature4", "vip", "enroll")],
  // Packs executive · Tarification comparée · Corporate gold
  services_pros: [d("columns3", "executive", "quote"), d("pricing3", "minimal", "quote"), d("grid4", "gold", "quote")],
  // Dépôt chantier · Fiche unités · Quincaillerie pro
  construction: [d("grid4", "dark", "add"), d("list", "card", "add", 4), d("table", "card", "add")],
  // Tech néon · Portfolio minimal · SaaS hub
  digital_tech: [d("grid4", "neon", "quote"), d("grid4", "minimal", "quote"), d("columns3", "neon", "quote")],
  // Tarif volume · Inventaire dépôt · Super-dépôt
  grossistes_distribution: [d("table", "minimal", "add"), d("grid4", "card", "add"), d("table", "vip", "quote")],
};

const INDEX: Record<LayoutKey, 0 | 1 | 2> = { design1: 0, design2: 1, design3: 2 };

export function sectorKey(sector: string | null | undefined): string {
  return sector && sector in SECTOR_DESIGNS ? sector : "commerce_vente";
}

export function designFor(sector: string | null | undefined, layout: LayoutKey): DesignSpec {
  return SECTOR_DESIGNS[sectorKey(sector)][INDEX[layout]];
}

export function paletteFor(sector: string | null | undefined): SectorPalette {
  return SECTOR_PALETTES[sectorKey(sector)];
}
