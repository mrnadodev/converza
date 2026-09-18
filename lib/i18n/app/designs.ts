import type { Language } from "../translations";

// Noms des 33 designs de vitrine (lib/storefront-designs) : pour chaque type
// de commerce, [Gratis, Pro, Premium].

type Entry = { name: string; desc: string };
export type DesignCopy = Record<string, [Entry, Entry, Entry]>;

const e = (name: string, desc: string): Entry => ({ name, desc });

export const DESIGN_COPY: Record<Language, DesignCopy> = {
  fr: {
    commerce_vente: [
      e("Boutique e-commerce", "4 cartes égales, photo et prix bien lisibles"),
      e("Vedette", "1 grande carte vedette et 2 plus petites"),
      e("Showcase Deluxe", "Bannière VIP et carrousel de 3 produits"),
    ],
    restauration: [
      e("Cercle bistrot", "Photos rondes façon assiette, prix en pastille"),
      e("Grille 2×2 arrondie", "4 cartes repas avec la photo en fond"),
      e("Menu express gourmet", "Menu en lignes, style carte de chef"),
    ],
    immobilier: [
      e("Prestige 16:9", "Grandes photos format brochure"),
      e("Mixte 2 + 1", "2 biens en carré et 1 grand bandeau"),
      e("Villa Deluxe", "Galerie 3 colonnes au style haut de gamme"),
    ],
    automobile: [
      e("Showroom", "Le véhicule phare en grand, 2 offres dessous"),
      e("Grille alternée", "Cartes larges et carrées entrelacées"),
      e("Spec Sheet Pro", "Cartes métal façon fiche technique"),
    ],
    sante_bienetre: [
      e("Soins clean", "Présentation épurée de cabinet médical"),
      e("Capsules", "Cartes arrondies façon gélule"),
      e("Clinique zen & spa", "Grille pastel avec prise de rendez-vous"),
    ],
    beaute_services: [
      e("Book 3:4", "Photos portrait, idéales coiffure et esthétique"),
      e("Tarif & réservation express", "Liste de prestations, réservation en 1 clic"),
      e("Glamour portfolio", "Mosaïque façon Instagram"),
    ],
    education: [
      e("Catalogue académique", "Formations présentées en cartes"),
      e("Fiche programme", "Liste des cours avec tarif et inscription"),
      e("Masterclass hub", "Bannière vedette et carrousel de cours"),
    ],
    services_pros: [
      e("Packs executive", "3 offres sur fond sombre élégant"),
      e("Tarification comparée", "3 formules côte à côte, la plus demandée en avant"),
      e("Corporate gold", "Cartes épurées à filet doré, devis en 1 clic"),
    ],
    construction: [
      e("Dépôt chantier", "4 blocs massifs et lisibles"),
      e("Fiche unités", "Liste avec le prix par sac, barre ou m³"),
      e("Quincaillerie pro", "Tableau de prix avec quantités"),
    ],
    digital_tech: [
      e("Tech néon", "Grille sombre aux contours lumineux"),
      e("Portfolio minimal", "Cartes blanches épurées pour agences"),
      e("SaaS hub", "3 offres en colonnes néon"),
    ],
    grossistes_distribution: [
      e("Tarif volume", "Tableau de prix clair pour les revendeurs"),
      e("Inventaire dépôt", "Grille des produits disponibles"),
      e("Super-dépôt", "Tableau premium, devis de volume en 1 clic"),
    ],
  },
  ht: {
    commerce_vente: [
      e("Boutik e-commerce", "4 kat menm gwosè, foto ak pri byen klè"),
      e("Vedèt", "1 gwo kat vedèt ak 2 pi piti"),
      e("Showcase Deluxe", "Banyè VIP ak karousèl 3 pwodui"),
    ],
    restauration: [
      e("Sèk bistwo", "Foto won tankou yon asyèt, pri nan yon pastiy"),
      e("Kadriyaj 2×2 won", "4 kat manje ak foto an fon"),
      e("Meni ekspre gourmet", "Meni an liy, stil kat chèf"),
    ],
    immobilier: [
      e("Prestij 16:9", "Gwo foto fòma bwochi"),
      e("Melanj 2 + 1", "2 kay an kare ak 1 gwo bandwòl"),
      e("Villa Deluxe", "Galri 3 kolòn, stil wo gam"),
    ],
    automobile: [
      e("Showroom", "Machin vedèt la an gwo, 2 lòt anba"),
      e("Kadriyaj altène", "Kat laj ak kat kare ki mele"),
      e("Spec Sheet Pro", "Kat metal tankou yon fich teknik"),
    ],
    sante_bienetre: [
      e("Swen klin", "Prezantasyon pwòp tankou yon kabinè"),
      e("Kapsil", "Kat won tankou grenn medikaman"),
      e("Klinik zen & spa", "Kadriyaj pastèl ak randevou"),
    ],
    beaute_services: [
      e("Book 3:4", "Foto pòtrè, bon pou kwafi ak estetik"),
      e("Tarif & rezèvasyon ekspre", "Lis sèvis, rezève an 1 klik"),
      e("Glamour portfolio", "Mozayik tankou Instagram"),
    ],
    education: [
      e("Katalòg akademik", "Fòmasyon yo an kat"),
      e("Fich pwogram", "Lis kou ak pri ak enskripsyon"),
      e("Masterclass hub", "Banyè vedèt ak karousèl kou"),
    ],
    services_pros: [
      e("Pake executive", "3 òf sou fon nwa elegan"),
      e("Tarif konpare", "3 fòmil kòt a kòt, sa moun plis mande an avan"),
      e("Corporate gold", "Kat pwòp ak liy dore, devi an 1 klik"),
    ],
    construction: [
      e("Depo chantye", "4 gwo blòk ki fasil pou li"),
      e("Fich inite", "Lis ak pri pa sak, ba oswa m³"),
      e("Kenkayri pro", "Tablo pri ak kantite"),
    ],
    digital_tech: [
      e("Tech neyon", "Kadriyaj nwa ak kontou limen"),
      e("Portfolio minimal", "Kat blan pwòp pou ajans"),
      e("SaaS hub", "3 òf an kolòn neyon"),
    ],
    grossistes_distribution: [
      e("Tarif volim", "Tablo pri klè pou revandè"),
      e("Envantè depo", "Kadriyaj pwodui ki disponib"),
      e("Super-depo", "Tablo premium, devi volim an 1 klik"),
    ],
  },
  en: {
    commerce_vente: [
      e("E-commerce shop", "4 equal cards, clear photo and price"),
      e("Spotlight", "1 large featured card and 2 smaller ones"),
      e("Showcase Deluxe", "VIP banner and a 3-product carousel"),
    ],
    restauration: [
      e("Bistro circles", "Round plate-style photos, price in a pill"),
      e("Rounded 2×2 grid", "4 dish cards with the photo as background"),
      e("Gourmet express menu", "Menu in rows, chef's-card style"),
    ],
    immobilier: [
      e("Prestige 16:9", "Large brochure-style photos"),
      e("Mixed 2 + 1", "2 square listings and 1 wide banner"),
      e("Villa Deluxe", "Upscale 3-column gallery"),
    ],
    automobile: [
      e("Showroom", "The flagship vehicle large, 2 offers below"),
      e("Alternating grid", "Wide and square cards interlocked"),
      e("Spec Sheet Pro", "Metal cards styled like a spec sheet"),
    ],
    sante_bienetre: [
      e("Clean care", "Clean, clinic-style presentation"),
      e("Capsules", "Rounded, pill-shaped cards"),
      e("Zen clinic & spa", "Pastel grid with appointment booking"),
    ],
    beaute_services: [
      e("3:4 book", "Portrait photos, ideal for hair and beauty"),
      e("Express rates & booking", "Service list, 1-click booking"),
      e("Glamour portfolio", "Instagram-style mosaic"),
    ],
    education: [
      e("Course catalog", "Programs shown as cards"),
      e("Program sheet", "Course list with fees and sign-up"),
      e("Masterclass hub", "Featured banner and course carousel"),
    ],
    services_pros: [
      e("Executive packs", "3 offers on an elegant dark background"),
      e("Compared pricing", "3 plans side by side, the most requested highlighted"),
      e("Corporate gold", "Clean gold-trimmed cards, 1-click quote"),
    ],
    construction: [
      e("Job-site depot", "4 bold, easy-to-read blocks"),
      e("Unit price sheet", "List with price per bag, bar or m³"),
      e("Pro hardware", "Price table with quantities"),
    ],
    digital_tech: [
      e("Neon tech", "Dark grid with glowing outlines"),
      e("Minimal portfolio", "Clean white cards for agencies"),
      e("SaaS hub", "3 offers in neon columns"),
    ],
    grossistes_distribution: [
      e("Volume pricing", "Clear price table for resellers"),
      e("Depot inventory", "Grid of available products"),
      e("Super depot", "Premium table, 1-click volume quote"),
    ],
  },
};

export function designName(copy: DesignCopy, sector: string, index: 0 | 1 | 2): Entry {
  return (copy[sector] ?? copy.commerce_vente)[index];
}
