import type { Business, Product } from "./types";
import { INDUSTRY_SECTORS } from "./verticals";

// Vitrine d'exemple par secteur, pour que la console montre chaque
// disposition sans dépendre d'un compte marchand. Les visuels sont des
// pictogrammes sur dégradé, pas des photos : rien ne peut passer pour le
// produit réel d'une boutique.

type Sample = { name: string; price: number; emoji: string; unit?: string };

const SAMPLES: Record<string, { colors: [string, string]; items: Sample[] }> = {
  commerce_vente: {
    colors: ["#FDE68A", "#F59E0B"],
    items: [
      { name: "Sneakers urbaines", price: 3500, emoji: "👟" },
      { name: "Sac à main", price: 2800, emoji: "👜" },
      { name: "Parfum 100 ml", price: 4200, emoji: "🧴" },
      { name: "Écouteurs sans fil", price: 2500, emoji: "🎧" },
      { name: "Montre", price: 3900, emoji: "⌚" },
    ],
  },
  restauration: {
    colors: ["#FECACA", "#EF4444"],
    items: [
      { name: "Griot & bannann", price: 750, emoji: "🍖", unit: "Portion" },
      { name: "Diri kole ak pwa", price: 450, emoji: "🍛", unit: "Plat" },
      { name: "Burger maison", price: 650, emoji: "🍔" },
      { name: "Jus de chadèk", price: 200, emoji: "🥤" },
      { name: "Gâteau au chocolat", price: 350, emoji: "🍰" },
    ],
  },
  immobilier: {
    colors: ["#BFDBFE", "#1E3A8A"],
    items: [
      { name: "Appartement 2 ch. – Pétion-Ville", price: 90000, emoji: "🏢", unit: "/ mois" },
      { name: "Maison 3 ch. – Tabarre", price: 12500000, emoji: "🏠" },
      { name: "Terrain 500 m² – Croix-des-Bouquets", price: 3500000, emoji: "🌳" },
      { name: "Local commercial – Delmas", price: 60000, emoji: "🏬", unit: "/ mois" },
      { name: "Studio meublé", price: 45000, emoji: "🛏️", unit: "/ mois" },
    ],
  },
  automobile: {
    colors: ["#E5E7EB", "#374151"],
    items: [
      { name: "Toyota RAV4 2018", price: 2800000, emoji: "🚙" },
      { name: "Kit de freins", price: 6500, emoji: "🛞" },
      { name: "Batterie 12 V", price: 9500, emoji: "🔋" },
      { name: "Lavage complet", price: 1500, emoji: "🧽" },
      { name: "Vidange", price: 3500, emoji: "🛢️" },
    ],
  },
  sante_bienetre: {
    colors: ["#CCFBF1", "#0D9488"],
    items: [
      { name: "Consultation générale", price: 1500, emoji: "🩺" },
      { name: "Bilan sanguin", price: 3500, emoji: "🧪" },
      { name: "Soin du visage", price: 2500, emoji: "💆" },
      { name: "Vitamines (30 j)", price: 1200, emoji: "💊" },
      { name: "Massage 1 h", price: 3000, emoji: "🌿" },
    ],
  },
  beaute_services: {
    colors: ["#FBCFE8", "#DB2777"],
    items: [
      { name: "Tresses", price: 2500, emoji: "💇🏾‍♀️" },
      { name: "Manucure gel", price: 1500, emoji: "💅🏾" },
      { name: "Maquillage mariée", price: 6000, emoji: "💄" },
      { name: "Coupe homme", price: 500, emoji: "💈" },
      { name: "Shooting photo", price: 8000, emoji: "📸" },
    ],
  },
  education: {
    colors: ["#C7D2FE", "#4338CA"],
    items: [
      { name: "Anglais débutant (8 sem.)", price: 12000, emoji: "🗣️" },
      { name: "Informatique de base", price: 9000, emoji: "💻" },
      { name: "Bootcamp marketing", price: 15000, emoji: "📈" },
      { name: "Coaching 1-on-1", price: 3000, emoji: "🎯", unit: "/ séance" },
      { name: "Cours du soir – Maths", price: 5000, emoji: "📐" },
    ],
  },
  services_pros: {
    colors: ["#DBEAFE", "#1E40AF"],
    items: [
      { name: "Comptabilité mensuelle", price: 10000, emoji: "📊", unit: "/ mois" },
      { name: "Rédaction de contrat", price: 7500, emoji: "📝" },
      { name: "Audit & conseil", price: 20000, emoji: "🔍" },
      { name: "Assurance auto", price: 15000, emoji: "🛡️", unit: "/ an" },
      { name: "Création d'entreprise", price: 25000, emoji: "🏛️" },
    ],
  },
  construction: {
    colors: ["#FED7AA", "#EA580C"],
    items: [
      { name: "Kit solaire 1 kW", price: 150000, emoji: "☀️" },
      { name: "Sac de ciment", price: 950, emoji: "🧱" },
      { name: "Rénovation cuisine", price: 250000, emoji: "🛠️" },
      { name: "Bois (lot)", price: 18000, emoji: "🪵" },
      { name: "Peinture 5 gal.", price: 7500, emoji: "🎨" },
    ],
  },
  digital_tech: {
    colors: ["#A5F3FC", "#0891B2"],
    items: [
      { name: "Site vitrine", price: 45000, emoji: "🌐" },
      { name: "Logo & identité", price: 15000, emoji: "✏️" },
      { name: "Gestion réseaux sociaux", price: 12000, emoji: "📱", unit: "/ mois" },
      { name: "Application mobile", price: 180000, emoji: "📲" },
      { name: "Maintenance PC", price: 2500, emoji: "🖥️" },
    ],
  },
  grossistes_distribution: {
    colors: ["#FEF3C7", "#B45309"],
    items: [
      { name: "Riz – sac 50 lb", price: 4800, emoji: "🌾" },
      { name: "Huile – carton 12 L", price: 7200, emoji: "🫒" },
      { name: "Eau – palette", price: 18000, emoji: "💧" },
      { name: "Spaghetti – carton", price: 2600, emoji: "🍝" },
      { name: "Savon – carton", price: 3100, emoji: "🧼" },
    ],
  },
};

/** Visuel d'exemple : pictogramme centré sur un dégradé, format 4:5. */
function art(emoji: string, [from, to]: [string, string], shade: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}" stop-opacity="${0.55 + shade * 0.1}"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><text x="200" y="285" font-size="170" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function isDemoSector(id: string): boolean {
  return id in SAMPLES;
}

export function demoStorefront(sectorId: string, theme: string): { business: Business; products: Product[] } {
  const key = isDemoSector(sectorId) ? sectorId : "commerce_vente";
  const sector = INDUSTRY_SECTORS[key as keyof typeof INDUSTRY_SECTORS];
  const sample = SAMPLES[key];
  const categories = sector?.defaultCategories ?? [];

  const business: Business = {
    id: `demo-${key}`,
    name: "CONVERZA Démo",
    slug: `demo-${key}`,
    category: null,
    address: "Port-au-Prince",
    phone_e164: null,
    logo_url: null,
    cover_url: null,
    hours: "8h – 18h",
    business_type: key,
    employees_count: null,
    theme,
    layout: null,
    plan: "premium",
    plan_until: null,
    social_instagram: null,
    social_facebook: null,
    social_tiktok: null,
    delivery_zones: [],
    default_currency: "HTG",
  };

  const products: Product[] = sample.items.map((item, i) => ({
    id: `demo-${key}-${i}`,
    business_id: business.id,
    name: item.name,
    category: categories[i % Math.max(categories.length, 1)] ?? null,
    price_cents: item.price * 100,
    currency: "HTG",
    unit: item.unit ?? null,
    stock_qty: 20,
    stock_state: "en_stok",
    photo_url: art(item.emoji, sample.colors, i),
    sold_count: 50 - i * 8,
    is_active: true,
  }));

  return { business, products };
}
