"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { verticalOf } from "@/lib/verticals";

export interface PreviewSectorTemplate {
  key: string;
  name: string;
  icon: string;
  slogan: string;
  promoBanner: string;
  design1Name: string;
  design2Name: string;
  design3Name: string;
  categories: string[];
  sampleProducts: {
    id: string;
    name: string;
    category: string;
    priceCents: number;
    unit: string;
    photoUrl: string;
    badge?: string;
    extraDetail?: string;
  }[];
}

export const SECTOR_TEMPLATES: PreviewSectorTemplate[] = [
  {
    key: "commerce_vente",
    name: "🛍️ Commerce & Vente",
    icon: "🛍️",
    slogan: "Nouvo kolèksyon rad, aksesoires ak mòd",
    promoBanner: "🔥 NOUVO ARRIVAGE RAD & MODÈNE — Chwazi ant Design 1, Design 2 ak Design 3 !",
    design1Name: "Design 1: Héros Lookbook Asymétrique (1 Gros + 2 Petits)",
    design2Name: "Design 2: Boutique E-commerce (4 Rectangles Égaux)",
    design3Name: "Design 3: Carousel Showcase Deluxe (Bannière VIP & Grid Minimaliste)",
    categories: ["Rad Modèn", "Soulye", "Akseswa & Bijou"],
    sampleProducts: [
      { id: "sp-1", name: "Robe Soirée Elégante", category: "Rad Modèn", priceCents: 450000, unit: "inite", photoUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80", badge: "Héros Left", extraDetail: "Taille M/L · Soie De Qualité" },
      { id: "sp-2", name: "Ensemble Veste & Pantalon", category: "Rad Modèn", priceCents: 620000, unit: "ansanm", photoUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80", badge: "Petit 1 Right", extraDetail: "Coupe Italienne" },
      { id: "sp-3", name: "Chaussures Cuir Homme", category: "Soulye", priceCents: 380000, unit: "pè", photoUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80", badge: "Petit 2 Right", extraDetail: "Cuir Véritable 100%" },
      { id: "sp-4", name: "Sac à Main Cuir Chic", category: "Akseswa & Bijou", priceCents: 290000, unit: "inite", photoUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80", extraDetail: "Format Medium" },
    ],
  },
  {
    key: "restauration",
    name: "🍔 Restauration & Repas",
    icon: "🍕",
    slogan: "Manje cho, bwason ak desè livrezon kòmand rapid",
    promoBanner: "🚚 MANJE CHO — Plats en Sèkl, Menu 2x2 Grid oswa Gourmet Cards !",
    design1Name: "Design 1: Plats en Sèkl (Cercle Bistrot)",
    design2Name: "Design 2: Grille 2x2 (4 cartes rectangulaires arrondies)",
    design3Name: "Design 3: Menu Express Gourmet (Horizontale ak Badges Chef & Ingrédients)",
    categories: ["Plat Prensipal", "Bwason Fraich", "Desè & Patisri"],
    sampleProducts: [
      { id: "sp-10", name: "Plat Poulet Rôti & Diri Kolé", category: "Plat Prensipal", priceCents: 150000, unit: "plat", photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80", badge: "Spesyal Chef", extraDetail: "Ak Banane Pese + Picklis" },
      { id: "sp-11", name: "Pizza Pepperoni Fwomaj", category: "Plat Prensipal", priceCents: 220000, unit: "pizza", photoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80", badge: "Popilè", extraDetail: "Taille Large 14 pouces" },
      { id: "sp-12", name: "Jus d'Ananas Naturel 1L", category: "Bwason Fraich", priceCents: 35000, unit: "boutèy", photoUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80", badge: "Fraich", extraDetail: "100% Natirèl San Sukre" },
      { id: "sp-13", name: "Gâteau Chocó Glacé", category: "Desè & Patisri", priceCents: 50000, unit: "mòso", photoUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80", extraDetail: "Chocolat Noir 70%" },
    ],
  },
  {
    key: "immobilier",
    name: "🏠 Immobilier & Gestion",
    icon: "🏠",
    slogan: "Acha, vant ak lokasyon kay ak teren an Ayiti",
    promoBanner: "🏢 IMMOBILIER PRO — Feature Banner, Listing Compact oswa Villa Deluxe Grid !",
    design1Name: "Design 1: Carte Immobilière Prestige 16:9 Banner",
    design2Name: "Design 2: 2 Cartes carrées haut + 1 Bandeau Full-Width bas",
    design3Name: "Design 3: Villa Deluxe Grid (Galerie 3 Colonnes ak Fiche 3D & Map)",
    categories: ["Appartements", "Maisons", "Terrains"],
    sampleProducts: [
      { id: "sp-20", name: "Appartement Moderne 3 Chambres", category: "Appartements", priceCents: 12000000, unit: "mois", photoUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80", badge: "À Louer", extraDetail: "🛏️ 3 Cb · 🚿 2 Bains · 📍 Delmas 75" },
      { id: "sp-21", name: "Maison Basse avec Jardin", category: "Maisons", priceCents: 85000000, unit: "vente", photoUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80", badge: "En Vente", extraDetail: "🛏️ 4 Cb · 📐 500m² · 📍 Pétion-Ville" },
      { id: "sp-22", name: "Terrain Constructible 1000m²", category: "Terrains", priceCents: 45000000, unit: "vente", photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80", badge: "Titre Foncier", extraDetail: "📜 Titre Clair · 📍 Tabarre" },
    ],
  },
  {
    key: "automobile",
    name: "🚗 Automobile & Services",
    icon: "🚗",
    slogan: "Vant machin, pyès detache ak sèvis mekanik",
    promoBanner: "🚘 SHOWROOM AUTO — Showroom Hero, Grille Alternée oswa Spec Sheet Métallique !",
    design1Name: "Design 1: Showroom Véhicule Vedette Hero",
    design2Name: "Design 2: Grille alternée décalée (Wide+Square / Square+Wide)",
    design3Name: "Design 3: Spec Sheet Pro (Cartes Métalliques + Fiche Technique)",
    categories: ["Véhicules", "Pièces Moteur", "Entretien"],
    sampleProducts: [
      { id: "sp-30", name: "SUV Toyota RAV4 4WD", category: "Véhicules", priceCents: 240000000, unit: "auto", photoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80", badge: "Occasion VEDETTE", extraDetail: "📅 2021 · 🛣️ 45k km · ⛽ Essence" },
      { id: "sp-31", name: "Batterie Auto 12V 75Ah", category: "Pièces Moteur", priceCents: 1850000, unit: "inite", photoUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80", badge: "Garanti 2 Ans", extraDetail: "OEM Compatible All SUV" },
      { id: "sp-32", name: "Plaquettes de Frein Avant", category: "Pièces Moteur", priceCents: 650000, unit: "jeu", photoUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80", extraDetail: "Céramique High Performance" },
      { id: "sp-33", name: "Pneu Tout-Terrain 265/65R17", category: "Entretien", priceCents: 1450000, unit: "pneu", photoUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=80", extraDetail: "Michelin LTX AT2" },
    ],
  },
  {
    key: "sante_bienetre",
    name: "🏥 Santé & Bien-être",
    icon: "🏥",
    slogan: "Swen medikal, medikaman ak pwodwi sante",
    promoBanner: "💊 SANTÉ PRO — Soins Clean, Forme Gélule oswa Clinique Zen & Spa !",
    design1Name: "Design 1: Soins & Traitements Médicaux Clean",
    design2Name: "Design 2: Forme Gélule/Capsule à gauche + 2 rectangles à droite",
    design3Name: "Design 3: Clinique Zen & Spa (Grille Pastel ak Bouton RDV Direct)",
    categories: ["Pharmacie", "Consultations", "Soins Esthétiques"],
    sampleProducts: [
      { id: "sp-40", name: "Consultation Généraliste RDV", category: "Consultations", priceCents: 250000, unit: "rdv", photoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80", badge: "Sur RDV", extraDetail: "⏱️ 45 min · Cabinet Pétion-Ville" },
      { id: "sp-41", name: "Kit Vitamines & Immuno Boost", category: "Pharmacie", priceCents: 145000, unit: "kit", photoUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80", badge: "Sans Ordonnance", extraDetail: "Vitamine C + Zinc + D3" },
      { id: "sp-42", name: "Bilan Sanguin Complet Labo", category: "Consultations", priceCents: 450000, unit: "bilan", photoUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80", extraDetail: "Résultats en 24h par WhatsApp" },
      { id: "sp-43", name: "Sérum Hydratation Cutanée", category: "Soins Esthétiques", priceCents: 280000, unit: "flacon", photoUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80", extraDetail: "Formule Dermatologique" },
    ],
  },
  {
    key: "beaute_services",
    name: "💇 Beauté & Services",
    icon: "💇",
    slogan: "Salon de coiffure, makiyaj ak sèvis estetikyen",
    promoBanner: "✨ BEAUTÉ LOOK — Prestations 3:4, Tarif Reservation oswa Glamour Portfolio HD !",
    design1Name: "Design 1: Book Prestations Esthétiques 3:4",
    design2Name: "Design 2: Tarif & Réservation Express 1-Click",
    design3Name: "Design 3: Glamour Portfolio HD (Grid Instagram Masonry ak Badges)",
    categories: ["Coiffure", "Manucure", "Maquillage"],
    sampleProducts: [
      { id: "sp-50", name: "Tresses Africaines Design", category: "Coiffure", priceCents: 350000, unit: "pose", photoUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80", badge: "Top Tendance", extraDetail: "⏱️ 2h30 · Extensions Incluse" },
      { id: "sp-51", name: "Pose Résine & Vernis Gel", category: "Manucure", priceCents: 200000, unit: "pose", photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80", extraDetail: "Tenue 3 Semaines Garantie" },
      { id: "sp-52", name: "Maquillage Soirée Mariage", category: "Maquillage", priceCents: 450000, unit: "session", photoUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80", extraDetail: "Fixateur HD Pro 24h" },
    ],
  },
  {
    key: "education",
    name: "🎓 Éducation & Formation",
    icon: "🎓",
    slogan: "Kou sou entènèt, bootcamps ak fòmasyon entansif",
    promoBanner: "📚 FORMATION PRO — Catalogue Bootcamp, Fiche Ecolage oswa Masterclass Hub !",
    design1Name: "Design 1: Catalogue Académique & Bootcamps",
    design2Name: "Design 2: Fiche Programme & Ecolage Mensuel",
    design3Name: "Design 3: Masterclass Hub (Bannière Vidéo + Badges Certification)",
    categories: ["Formations Certifiantes", "Cours du Soir", "Coaching"],
    sampleProducts: [
      { id: "sp-60", name: "Bootcamp Marketing Digital 4S", category: "Formations Certifiantes", priceCents: 1500000, unit: "session", photoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80", badge: "Certifié Pro", extraDetail: "🎓 Certificat + Support PDF + Replay" },
      { id: "sp-61", name: "Cours d'Anglais Business Live", category: "Cours du Soir", priceCents: 650000, unit: "mois", photoUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80", extraDetail: "2x par semaine sur Zoom" },
      { id: "sp-62", name: "Formation Comptabilité SAGE", category: "Formations Certifiantes", priceCents: 1200000, unit: "cours", photoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80", extraDetail: "Logiciel Fourni + Exercices" },
    ],
  },
  {
    key: "services_pros",
    name: "💼 Services Professionnels",
    icon: "💼",
    slogan: "Konsèy juridik, konptabilite ak audit antrepriz",
    promoBanner: "⚖️ SERVICES PROS — Packs Executive, Tarification SaaS oswa Corporate Gold !",
    design1Name: "Design 1: Packs Honoraires Executive Dark",
    design2Name: "Design 2: Grille Tarification SaaS / Consulting",
    design3Name: "Design 3: Corporate Gold (Cards Minimalistes Or ak Devis Enstantane)",
    categories: ["Audit & Conseil", "Comptabilité", "Juridique"],
    sampleProducts: [
      { id: "sp-70", name: "Audit Comptable & Fiscal Annuel", category: "Audit & Conseil", priceCents: 4500000, unit: "audit", photoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80", badge: "Expert Certifié", extraDetail: "📋 Rapport d'audit complet + Conseils" },
      { id: "sp-71", name: "Rédaction Contrat de Travail", category: "Juridique", priceCents: 850000, unit: "acte", photoUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80", extraDetail: "Conforme au Code du Travail Haïtien" },
    ],
  },
  {
    key: "construction",
    name: "🏗️ Construction & Habitat",
    icon: "🏗️",
    slogan: "Materyo konstriksyon, zouti ak penti de kalite",
    promoBanner: "📦 CONSTRUCT PRO — Dépôt Chantier, Tarifs Unités oswa Quincaillerie Pro !",
    design1Name: "Design 1: Dépôt Chantier 4 Rectangles Massifs",
    design2Name: "Design 2: Fiche Technique & Tarifs par Unités",
    design3Name: "Design 3: Quincaillerie Pro (Tableau Gros/Palettes ak Calculateur)",
    categories: ["Ciment & Grenn", "Zouti Travay", "Penti"],
    sampleProducts: [
      { id: "sp-80", name: "Sac de Ciment 50kg Pro", category: "Ciment & Grenn", priceCents: 125000, unit: "sak", photoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80", badge: "Prix Dépôt", extraDetail: "🚛 Livrezon Kamyon Disponib" },
      { id: "sp-81", name: "Barre de Fer 1/2 (12mm)", category: "Ciment & Grenn", priceCents: 95000, unit: "barre", photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80", extraDetail: "Acier Haute Résistance" },
      { id: "sp-82", name: "Seau Peinture Blanche 5G", category: "Penti", priceCents: 850000, unit: "seau", photoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80", extraDetail: "Anti-Moisissure Extra Lavable" },
    ],
  },
  {
    key: "digital_tech",
    name: "💻 Digital & Technologie",
    icon: "💻",
    slogan: "Kreyasyon sit web, aplikasyon mobil ak marketing",
    promoBanner: "⚡ DIGITAL TECH — Tech Dark Néon, Clean Minimal oswa Cyberpunk SaaS !",
    design1Name: "Design 1: Tech Dark & Néon Grid",
    design2Name: "Design 2: Minimal Tech Portfolio",
    design3Name: "Design 3: Cyberpunk SaaS Hub (Bordures Néon Bicolores + Stack Tech)",
    categories: ["Développement Web", "Branding", "Marketing"],
    sampleProducts: [
      { id: "sp-90", name: "Création Site Web E-commerce", category: "Développement Web", priceCents: 3500000, unit: "projet", photoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80", badge: "Livraison 7 jours", extraDetail: "⚡ Nom de Domaine + Hebergement 1 An" },
      { id: "sp-91", name: "Pack Design Logo & Charte", category: "Branding", priceCents: 1200000, unit: "pack", photoUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80", extraDetail: "Fichiers HD Vectoriels + PDF" },
    ],
  },
  {
    key: "grossistes_distribution",
    name: "📦 Grossistes & Distribution",
    icon: "📦",
    slogan: "Vant an gwo ak livrezon pa palèt pou boutik yo",
    promoBanner: "🚚 GROSSE B2B — Tarif Volume, Grille Chargement oswa Super-Dépôt Wholesale !",
    design1Name: "Design 1: Tarif Volume B2B & Cartons (MOQ)",
    design2Name: "Design 2: Grille Inventaire Dépôt & Camion",
    design3Name: "Design 3: Super-Dépôt Wholesale (Prix Dégressif pa Kantite ak Palèt)",
    categories: ["Vente par Palettes", "Vente par Cartons"],
    sampleProducts: [
      { id: "sp-100", name: "Carton Diri TCS 25kg (x10 Sak)", category: "Vente par Cartons", priceCents: 2300000, unit: "carton", photoUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80", badge: "Tarif Gros B2B", extraDetail: "📦 Minimum 5 Cartons" },
      { id: "sp-101", name: "Palette Huile Gourmet 5L (x40)", category: "Vente par Palettes", priceCents: 4800000, unit: "palette", photoUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80", extraDetail: "🚛 Livrezon Kamyon Gratis" },
    ],
  },
];

import type { Product } from "@/lib/types";

export function StorefrontPreviewModal({
  isOpen,
  onClose,
  businessName = "Mondesir Business",
  businessType = "commerce_vente",
  logoUrl,
  coverUrl,
  realProducts,
  isAdmin = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  businessType?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  realProducts?: Product[];
  isAdmin?: boolean;
}) {
  const merchantSectorConfig = verticalOf(businessType);
  const [selectedSectorKey, setSelectedSectorKey] = useState<string>(merchantSectorConfig.id);
  const [designVariant, setDesignVariant] = useState<"design1" | "design2" | "design3">("design1");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  // Si Admin : permet d'explorer les 11 secteurs. Si Marchand : verrouillé à son propre secteur.
  const activeSectorKey = isAdmin ? selectedSectorKey : merchantSectorConfig.id;
  const currentTemplate = SECTOR_TEMPLATES.find((t) => t.key === activeSectorKey) || SECTOR_TEMPLATES[0];

  const formattedRealProducts = (realProducts ?? []).map((p) => {
    const photos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
    return {
      id: p.id,
      name: p.name,
      category: p.category || "Jeneral",
      priceCents: p.price_cents,
      unit: p.unit || "inite",
      photoUrl: photos[0] || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
      badge: p.stock_state === "fini" ? "Fini" : p.stock_state === "ba_stok" ? "Ba stòk" : "En stòk",
      extraDetail: `${p.stock_qty ?? "—"} en stòk`,
    };
  });

  const productsSource =
    realProducts && realProducts.length > 0 && activeSectorKey === merchantSectorConfig.id
      ? formattedRealProducts
      : currentTemplate.sampleProducts;

  const displayedProducts = productsSource.filter(
    (p) => activeCategory === "all" || p.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2.5 backdrop-blur-xs md:p-6 animate-fade-in">
      <div className="flex h-[94dvh] w-full max-w-[1080px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-line bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-xl font-bold text-white shadow-xs">
              👁️
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-extrabold md:text-lg">
                {isAdmin ? "👑 Aperçu Admin CONVERZA (Tous les 11 Secteurs)" : "Aperçu Vitrine & Choix Design"}
              </h2>
              <p className="text-xs text-slate-300">
                Chwazi ant <strong className="text-emerald-400">Design 1</strong>, <strong className="text-emerald-400">Design 2</strong> ak <strong className="text-emerald-400">Design 3</strong> pou antrepriz <span className="text-amber-300">{businessName}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* SI ADMIN: Barre de navigation complète à travers les 11 secteurs */}
        {isAdmin ? (
          <div className="flex flex-col gap-2 border-b border-line bg-amber-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span>👑 MÒD ADMIN CONVERZA:</span>
                <span>Visualiser les 11 secteurs & leurs 3 designs</span>
              </span>
              {/* Toggle Design 1 vs Design 2 vs Design 3 */}
              <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-300 shadow-2xs">
                <button
                  onClick={() => setDesignVariant("design1")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                    designVariant === "design1"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🎨 Design 1
                </button>
                <button
                  onClick={() => setDesignVariant("design2")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                    designVariant === "design2"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ✨ Design 2
                </button>
                <button
                  onClick={() => setDesignVariant("design3")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                    designVariant === "design3"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  👑 Design 3
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SECTOR_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setSelectedSectorKey(t.key);
                    setActiveCategory("all");
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    activeSectorKey === t.key
                      ? "bg-slate-900 text-white shadow-xs ring-2 ring-emerald-400"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name.split(" ")[1] || t.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* SI MARCHAND NON-ADMIN: Verrouillé strictement à son secteur */
          <div className="flex flex-col gap-2.5 border-b border-line bg-slate-100 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white shadow-xs flex items-center gap-1.5">
                  <span>{currentTemplate.icon}</span>
                  <span>Sektè Biznis Ou An: {currentTemplate.name}</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500">
                  🔒 Sèlman design ki adaptab ak sektè biznis ou an ki afiche.
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-300 shadow-2xs">
                <button
                  onClick={() => setDesignVariant("design1")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                    designVariant === "design1"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🎨 Design 1
                </button>
                <button
                  onClick={() => setDesignVariant("design2")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                    designVariant === "design2"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ✨ Design 2
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zone de rendu du Design Sélectionné */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <div className="mx-auto flex max-w-[700px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-md">
            {/* Banner Vitrine */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-emerald-950 p-5 text-white">
              {coverUrl && (
                <img src={coverUrl} alt="Cover Banner" className="absolute inset-0 h-full w-full object-cover opacity-35" />
              )}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-md border-2 border-white overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="h-full w-full object-cover" />
                    ) : (
                      currentTemplate.icon
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                      {currentTemplate.name}
                    </span>
                    <h3 className="text-xl font-black text-white">{businessName}</h3>
                    <p className="text-xs text-slate-300">{currentTemplate.slogan}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-2xs">
                  {designVariant === "design1" ? currentTemplate.design1Name : currentTemplate.design2Name}
                </span>
              </div>

              <div className="relative z-10 mt-4 rounded-xl bg-slate-950/60 backdrop-blur-xs p-2.5 text-center text-xs font-bold text-emerald-200 border border-white/20">
                {currentTemplate.promoBanner}
              </div>
            </div>

            {/* Sub-header filtres */}
            <div className="flex gap-2 overflow-x-auto border-b border-line bg-slate-50 p-3 scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={`shrink-0 rounded-xl px-3 py-1 text-xs font-extrabold transition-all cursor-pointer ${
                  activeCategory === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                Tout ({currentTemplate.sampleProducts.length})
              </button>
              {currentTemplate.categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`shrink-0 rounded-xl px-3 py-1 text-xs font-extrabold transition-all cursor-pointer ${
                    activeCategory === c ? "bg-emerald-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* RENDU DESIGN 1 VS DESIGN 2 ADAPTATIF */}
            <div className="p-4">
              {designVariant === "design1" ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-xs font-black text-emerald-950 border border-emerald-300 flex items-center justify-between">
                    <span>🎨 DESIGN 1 : {currentTemplate.design1Name}</span>
                    <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded">Exclusif au secteur</span>
                  </div>

                  {currentTemplate.key === "restauration" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 text-center">
                      {displayedProducts.map((p) => (
                        <div key={p.id} className="flex flex-col items-center gap-2 rounded-2xl bg-amber-50/40 p-3.5 border border-amber-200 shadow-2xs">
                          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-amber-400 shadow-md">
                            <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                          </div>
                          <span className="text-[9.5px] font-extrabold text-amber-700 uppercase">{p.category}</span>
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                          <span className="text-xs font-black text-amber-900">{formatMoney(p.priceCents)}</span>
                          <button className="w-full rounded-xl bg-amber-500 py-1 text-[10.5px] font-black text-amber-950 shadow-2xs">+ Kòmande Repas 🍲</button>
                        </div>
                      ))}
                    </div>
                  ) : currentTemplate.key === "commerce_vente" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {displayedProducts[0] && (
                        <div className="md:col-span-2 relative flex flex-col justify-end overflow-hidden rounded-2xl border border-emerald-300 bg-slate-900 shadow-md h-[210px] md:h-[330px]">
                          <img src={displayedProducts[0].photoUrl} alt={displayedProducts[0].name} className="absolute inset-0 h-full w-full object-cover opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">⭐ GROS RECTANGLE GAUCHE</span>
                          <div className="relative p-3.5 text-white z-10">
                            <h4 className="text-base font-black text-white">{displayedProducts[0].name}</h4>
                            <span className="text-xs font-black text-emerald-300">{formatMoney(displayedProducts[0].priceCents)}</span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-3.5 md:col-span-1">
                        {displayedProducts.slice(1, 3).map((p, idx) => (
                          <div key={p.id} className="relative flex flex-col justify-end overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#081C16] to-[#0D2A21] h-[210px] md:h-[158px]">
                            <img src={p.photoUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#061410] via-[#061410]/50 to-transparent" />
                            <span className="absolute top-1.5 left-1.5 rounded bg-emerald-700/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-black text-emerald-100 border border-emerald-500/30">Petit {idx + 1}</span>
                            <div className="relative p-3 text-white z-10">
                              <h5 className="text-xs font-extrabold line-clamp-1">{p.name}</h5>
                              <span className="text-[11px] font-black text-emerald-300">{formatMoney(p.priceCents)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayedProducts.map((p) => (
                        <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xs">
                          <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                            <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                            {p.badge && <span className="absolute top-2 left-2 rounded bg-emerald-600 px-2 py-0.5 text-[9.5px] font-black text-white">{p.badge}</span>}
                          </div>
                          <div className="p-3 flex flex-col gap-1">
                            <span className="text-[9px] font-extrabold text-emerald-700 uppercase">{p.category}</span>
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                            {p.extraDetail && <p className="text-[10px] text-slate-500 font-medium">{p.extraDetail}</p>}
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">{formatMoney(p.priceCents)} / {p.unit}</span>
                              <button className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black text-white">+ Kòmande</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : designVariant === "design2" ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl bg-amber-50 p-2.5 text-xs font-black text-amber-950 border border-amber-300 flex items-center justify-between">
                    <span>✨ DESIGN 2 : {currentTemplate.design2Name}</span>
                    <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded">Wireframe Ofisyèl</span>
                  </div>

                  {/* RENDU SPÉCIFIQUE DESIGN #2 SELON PDF WIREFRAME — STYLE CLAIR & ÉLÉGANT */}
                  {currentTemplate.key === "sante_bienetre" ? (
                    /* DESIGN #2 - SANTÉ (Gélule/Capsule à gauche + 2 rectangles à droite) */
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-3">
                        {displayedProducts[0] && (
                          <div className="relative flex flex-col justify-end overflow-hidden rounded-t-[50px] rounded-b-xl border border-teal-200 bg-white text-slate-900 shadow-sm h-[150px] p-3">
                            <img src={displayedProducts[0].photoUrl} alt={displayedProducts[0].name} className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                            <span className="relative z-10 text-[10px] font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full w-fit">💊 Capsule Top</span>
                            <h4 className="relative z-10 text-xs font-black text-slate-900 line-clamp-1">{displayedProducts[0].name}</h4>
                            <span className="relative z-10 text-xs font-extrabold text-teal-700">{formatMoney(displayedProducts[0].priceCents)}</span>
                          </div>
                        )}
                        {displayedProducts[1] && (
                          <div className="relative flex flex-col justify-end overflow-hidden rounded-b-[50px] rounded-t-xl border border-teal-200 bg-white text-slate-900 shadow-sm h-[150px] p-3">
                            <img src={displayedProducts[1].photoUrl} alt={displayedProducts[1].name} className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                            <span className="relative z-10 text-[10px] font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full w-fit">💊 Capsule Bottom</span>
                            <h4 className="relative z-10 text-xs font-black text-slate-900 line-clamp-1">{displayedProducts[1].name}</h4>
                            <span className="relative z-10 text-xs font-extrabold text-teal-700">{formatMoney(displayedProducts[1].priceCents)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        {displayedProducts.slice(2, 4).map((p) => (
                          <div key={p.id} className="relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[150px] p-3">
                            <img src={p.photoUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                            <span className="relative z-10 text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md w-fit">{p.category}</span>
                            <h4 className="relative z-10 text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                            <div className="relative z-10 flex items-center justify-between mt-1">
                              <span className="text-xs font-black text-teal-700">{formatMoney(p.priceCents)}</span>
                              <button className="rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] font-black text-white shadow-xs hover:bg-teal-700">+ Kòmande</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : currentTemplate.key === "automobile" ? (
                    /* DESIGN #2 - AUTOMOBILE (Alternating Offset) */
                    <div className="grid grid-cols-3 gap-3">
                      {displayedProducts[0] && (
                        <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[140px] p-3">
                          <img src={displayedProducts[0].photoUrl} alt={displayedProducts[0].name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9.5px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full w-fit">🏎️ Rectangle Wide 1</span>
                          <h4 className="relative z-10 text-xs font-black text-slate-900">{displayedProducts[0].name}</h4>
                          <span className="relative z-10 text-xs font-bold text-amber-700">{formatMoney(displayedProducts[0].priceCents)}</span>
                        </div>
                      )}
                      {displayedProducts[1] && (
                        <div className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[140px] p-2.5">
                          <img src={displayedProducts[1].photoUrl} alt={displayedProducts[1].name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full w-fit">Square 1</span>
                          <h4 className="relative z-10 text-[11px] font-black text-slate-900 line-clamp-1">{displayedProducts[1].name}</h4>
                          <span className="relative z-10 text-[10.5px] font-bold text-amber-700">{formatMoney(displayedProducts[1].priceCents)}</span>
                        </div>
                      )}

                      {displayedProducts[2] && (
                        <div className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[140px] p-2.5">
                          <img src={displayedProducts[2].photoUrl} alt={displayedProducts[2].name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full w-fit">Square 2</span>
                          <h4 className="relative z-10 text-[11px] font-black text-slate-900 line-clamp-1">{displayedProducts[2].name}</h4>
                          <span className="relative z-10 text-[10.5px] font-bold text-amber-700">{formatMoney(displayedProducts[2].priceCents)}</span>
                        </div>
                      )}
                      {displayedProducts[3] && (
                        <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[140px] p-3">
                          <img src={displayedProducts[3].photoUrl} alt={displayedProducts[3].name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9.5px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full w-fit">🏎️ Rectangle Wide 2</span>
                          <h4 className="relative z-10 text-xs font-black text-slate-900">{displayedProducts[3].name}</h4>
                          <span className="relative z-10 text-xs font-bold text-amber-700">{formatMoney(displayedProducts[3].priceCents)}</span>
                        </div>
                      )}
                    </div>
                  ) : currentTemplate.key === "restauration" ? (
                    /* RESTAURANT - DESIGN #2 (Grille 2x2 de 4 cartes rectangulaires arrondies) */
                    <div className="grid grid-cols-2 gap-3.5">
                      {displayedProducts.slice(0, 4).map((p, idx) => (
                        <div key={p.id} className="relative flex flex-col justify-end overflow-hidden rounded-3xl border border-amber-200 bg-white text-slate-900 shadow-sm h-[140px] p-3.5">
                          <img src={p.photoUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9.5px] font-extrabold text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-full w-fit">Plat #{idx + 1}</span>
                          <h4 className="relative z-10 text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                          <div className="relative z-10 flex items-center justify-between mt-1">
                            <span className="text-xs font-black text-amber-900">{formatMoney(p.priceCents)}</span>
                            <button className="rounded-xl bg-amber-500 px-2.5 py-1 text-[10px] font-black text-amber-950 shadow-xs hover:bg-amber-600">+ Kòmande Repas</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : currentTemplate.key === "immobilier" ? (
                    /* IMMOBILIER - DESIGN #2 (2 Cartes carrées haut + 1 Bandeau Full-Width bas) */
                    <div className="grid grid-cols-2 gap-3">
                      {displayedProducts.slice(0, 2).map((p, idx) => (
                        <div key={p.id} className="col-span-1 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm h-[150px] p-3">
                          <img src={p.photoUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[9.5px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">Propriété #{idx + 1}</span>
                          <h4 className="relative z-10 text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                          <span className="relative z-10 text-xs font-bold text-emerald-700">{formatMoney(p.priceCents)}</span>
                        </div>
                      ))}

                      {displayedProducts[2] && (
                        <div className="col-span-2 relative flex flex-col justify-end overflow-hidden rounded-3xl border border-emerald-300 bg-white text-slate-900 shadow-sm h-[160px] p-4">
                          <img src={displayedProducts[2].photoUrl} alt={displayedProducts[2].name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                          <span className="relative z-10 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">🏢 PROPRIÉTÉ BANNER FULL-WIDTH</span>
                          <h4 className="relative z-10 text-sm font-black text-slate-900">{displayedProducts[2].name}</h4>
                          <div className="relative z-10 flex items-center justify-between mt-1">
                            <span className="text-sm font-black text-emerald-800">{formatMoney(displayedProducts[2].priceCents)}</span>
                            <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700">📅 Planifier une Visite</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* AUTRES SECTEURS DESIGN 2 — CARTES BLANCHES LUMINEUSES */
                    <div className="flex flex-col gap-3">
                      {displayedProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 text-slate-900 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60">
                            <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-1 flex-col justify-center gap-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-slate-900">{p.name}</h4>
                              <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[9.5px] font-black text-amber-900 border border-amber-300/60">
                                {p.badge || "PRO"}
                              </span>
                            </div>
                            {p.extraDetail && <p className="text-[10px] text-slate-500 font-medium">{p.extraDetail}</p>}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-black text-emerald-700">{formatMoney(p.priceCents)} / {p.unit}</span>
                              <button className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[11px] font-black text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer">
                                + Kòmande Rapid ⚡
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl bg-purple-900/90 p-2.5 text-xs font-black text-purple-100 border border-purple-500 flex items-center justify-between shadow-md">
                    <span>👑 DESIGN 3 : {currentTemplate.design3Name}</span>
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded">👑 Deluxe VIP (Plan Premium)</span>
                  </div>

                  {/* RENDU DESIGN #3 VIP SHOWCASE CAROUSEL & CARDS DELUXE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {displayedProducts.map((p, idx) => (
                      <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-purple-200/60 bg-gradient-to-b from-slate-900 to-indigo-950 text-white shadow-xl hover:border-amber-400/80 transition-all">
                        <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                          <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-0.5 text-[10px] font-black text-amber-950 shadow-md">
                            {p.badge || `✨ VIP #${idx + 1}`}
                          </span>
                          <span className="absolute top-2.5 right-2.5 rounded-full bg-purple-950/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-extrabold text-purple-200 border border-purple-400/40">
                            {p.category}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col gap-1.5 relative z-10">
                          <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">{p.name}</h4>
                          {p.extraDetail && <p className="text-[11px] text-purple-200/80 font-medium line-clamp-1">✨ {p.extraDetail}</p>}
                          <div className="mt-2 flex items-center justify-between pt-2 border-t border-purple-800/40">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarif VIP</span>
                              <span className="text-sm font-black text-amber-300">{formatMoney(p.priceCents)} / {p.unit}</span>
                            </div>
                            <button className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1.5 text-xs font-black text-amber-950 shadow-md hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95 cursor-pointer">
                              ⚡ Kòmande Kounye a
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Foot note WhatsApp */}
            <div className="border-t border-line bg-slate-900 p-4 text-center text-white">
              <p className="text-xs font-extrabold text-emerald-400">
                💬 CONVERZA Admin View — Visualisation complète des 11 secteurs !
              </p>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-t border-line bg-white px-5 py-4">
          <span className="text-xs font-bold text-slate-500">
            Secteur visualisé: <strong className="text-slate-900">{currentTemplate.name}</strong> ({designVariant === "design1" ? "Design 1" : "Design 2"})
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-95 cursor-pointer"
          >
            Fèmen Aperçu a
          </button>
        </div>
      </div>
    </div>
  );
}
