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
  /**
   * Anciennes écritures de la même catégorie, déjà enregistrées chez des
   * marchands. Elles ne sont plus proposées, mais restent reconnues pour que
   * leurs produits gardent une catégorie lisible.
   */
  aliases?: string[];
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

const opt = (key: string, fr: string, ht: string, en: string, ...aliases: string[]): CategoryOption => ({
  key,
  labels: { fr, ht, en },
  ...(aliases.length > 0 ? { aliases } : {}),
});

/**
 * Catégories proposées par secteur, hors mode.
 *
 * Les listes d'origine (lib/verticals) n'existaient que dans une seule langue :
 * en créole pour le commerce et la restauration, en français pour les neuf
 * autres secteurs. Un marchand voyait donc toujours la langue de l'autre.
 * Chaque secteur a maintenant ses catégories dans les trois langues.
 */
const BY_SECTOR: Record<string, CategoryOption[]> = {
  commerce_vente: [
    // La mode est détaillée ici aussi, pas seulement pour les boutiques dont le
    // type d'activité contient le mot. Une « Boutique en ligne » qui vend des
    // chaussures ne pouvait choisir qu'un « Vêtements & chaussures » fourre-tout :
    // ni le marchand ni son client ne savaient si l'article était pour homme,
    // femme ou enfant.
    ...FASHION,
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
  immobilier: [
    opt("immo_location", "Appartements à louer", "Apatman pou lwe", "Apartments for rent", "Appartements à Louer"),
    opt("immo_vente", "Maisons à vendre", "Kay pou vann", "Houses for sale", "Maisons en Vente"),
    opt("immo_terrain", "Terrains", "Teren", "Land"),
    opt("immo_commercial", "Espaces commerciaux", "Espas komèsyal", "Commercial spaces", "Espaces Commercial"),
  ],
  automobile: [
    opt("auto_vehicule", "Véhicules", "Machin", "Vehicles"),
    opt("auto_moteur", "Pièces moteur", "Pyès motè", "Engine parts", "Pièces Moteur"),
    opt("auto_freinage", "Freinage & suspension", "Fren & sispansyon", "Brakes & suspension", "Freinage & Suspension"),
    opt("auto_location", "Location & lavage", "Lwe & lave machin", "Rental & car wash", "Location & Car Wash"),
  ],
  sante_bienetre: [
    opt("sante_consultation", "Consultations", "Konsiltasyon", "Consultations"),
    opt("sante_esthetique", "Soins esthétiques", "Swen estetik", "Aesthetic care", "Soins Esthétiques"),
    opt("sante_pharmacie", "Pharmacie & traitements", "Famasi & tretman", "Pharmacy & treatments", "Pharmacie & Traitements"),
    opt("sante_labo", "Bilans & labo", "Analiz & labo", "Tests & lab", "Bilan & Labo"),
  ],
  beaute_services: [
    opt("beaute_coiffure", "Coiffure & coupe", "Kwafi & koup", "Hair & cuts", "Coiffure & Coupe"),
    opt("beaute_ongles", "Manucure & pédicure", "Manikè & pedikè", "Manicure & pedicure", "Manucure & Pédicure"),
    opt("beaute_maquillage", "Maquillage", "Makiyaj", "Makeup"),
    opt("beaute_photo", "Photo & vidéo", "Foto & videyo", "Photo & video", "Shooting & Vidéo"),
  ],
  education: [
    opt("edu_certifiante", "Formations certifiantes", "Fòmasyon ak sètifika", "Certified training", "Formations Certifiantes"),
    opt("edu_soir", "Cours du soir", "Kou aswè", "Evening classes", "Cours du Soir"),
    opt("edu_atelier", "Ateliers & bootcamps", "Atelye & bootcamp", "Workshops & bootcamps", "Ateliers & Bootcamp"),
    opt("edu_coaching", "Coaching individuel", "Akonpayman endividyèl", "One-on-one coaching", "Coaching 1-on-1"),
  ],
  services_pros: [
    opt("pro_audit", "Audit & conseil", "Odit & konsèy", "Audit & consulting", "Audit & Conseil"),
    opt("pro_compta", "Comptabilité", "Kontablite", "Accounting"),
    opt("pro_juridique", "Contrats & juridique", "Kontra & jiridik", "Contracts & legal", "Contrats & Juridique"),
    opt("pro_finance", "Assurance & finance", "Asirans & finans", "Insurance & finance", "Assurance & Finance"),
  ],
  construction: [
    opt("btp_cle_en_main", "Projets clé en main", "Pwojè kle an men", "Turnkey projects", "Projets Clé en Main"),
    opt("btp_solaire", "Kits solaires", "Kit solè", "Solar kits", "Kits Solaires"),
    opt("btp_materiaux", "Matériaux & bois", "Materyo & bwa", "Materials & timber", "Matériaux & Bois"),
    opt("btp_renovation", "Rénovation & déco", "Renovasyon & dekorasyon", "Renovation & decor", "Rénovation & Déco"),
  ],
  digital_tech: [
    opt("tech_dev", "Développement web & app", "Devlopman web & app", "Web & app development", "Développement Web/App"),
    opt("tech_branding", "Image de marque & design", "Imaj mak & design", "Branding & design", "Branding & Design"),
    opt("tech_marketing", "Marketing digital", "Maketing dijital", "Digital marketing", "Marketing Digital"),
    opt("tech_maintenance", "Maintenance technique", "Antretyen teknik", "Technical maintenance", "Maintenance Tech"),
  ],
  grossistes_distribution: [
    opt("gros_palette", "Vente par palettes", "Vann an palèt", "Pallet sales", "Vente par Palettes"),
    opt("gros_carton", "Vente par cartons", "Vann an katon", "Carton sales", "Vente par Cartons"),
    opt("gros_volume", "Promos volume B2B", "Pwomo gwo kantite B2B", "B2B volume deals", "Promos Volume B2B"),
    opt("gros_sec", "Produits secs", "Pwodwi sèk", "Dry goods", "Produits Secs"),
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

/**
 * Catégories qui ne sont plus proposées mais que des produits portent encore.
 * Elles restent reconnues pour s'afficher dans la langue du visiteur.
 */
const RETIREES: CategoryOption[] = [opt("mode", "Vêtements & chaussures", "Rad & Soulye", "Clothing & shoes")];

const ALL: CategoryOption[] = [...FASHION, ...Object.values(BY_SECTOR).flat(), ...RETIREES];

/**
 * Libellé d'une catégorie enregistrée, dans la langue du visiteur.
 * Une catégorie écrite à la main par le marchand s'affiche telle quelle.
 */
export function categoryLabel(value: string | null | undefined, language: Language): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const needle = raw.toLowerCase();
  const found = ALL.find(
    (o) =>
      o.key === needle ||
      Object.values(o.labels).some((l) => l.toLowerCase() === needle) ||
      (o.aliases ?? []).some((a) => a.toLowerCase() === needle),
  );
  return found ? found.labels[language] ?? raw : raw;
}
