// Données de démo (miroir de db/seed.sql) pour faire tourner l'UI
// sans base de données. À remplacer par des requêtes Supabase une fois
// les variables d'env configurées.

import type { Business, Customer, PipelineCard, Product } from "./types";

export const demoBusiness: Business = {
  id: "biz-demo",
  name: "Ti Kòk Boutik",
  slug: "ti-kok-boutik",
  category: "Boutik alimantè",
  address: "Delmas 31, Pòtoprens",
  phone_e164: "+50937124488",
  logo_url: null,
  cover_url: null,
  hours: "7am–7pm",
  business_type: "boutik",
  employees_count: 3,
  theme: "whatsapp",
  layout: "auto",
  plan: "gratis",
  plan_until: null,
  social_instagram: "https://instagram.com/tikokboutik",
  social_facebook: "https://facebook.com/tikokboutik",
  social_tiktok: "https://tiktok.com/@tikokboutik",
  delivery_zones: [
    { name: "Delmas", fee_cents: 5000 },
    { name: "Petyonvil", fee_cents: 10000 },
    { name: "Tabarre", fee_cents: 7500 },
  ],
  default_currency: "HTG",
};

export const demoTopCustomers: (Customer & {
  orders: number;
  totalCents: number;
  initials: string;
})[] = [
  { id: "c1", business_id: "biz-demo", full_name: "Wideline Désir", phone_e164: "+50937124488", address: "Delmas 31", tags: ["kliyan_fidel"], note: null, created_at: "", orders: 14, totalCents: 940000, initials: "WD" },
  { id: "c2", business_id: "biz-demo", full_name: "Jameson Pierre", phone_e164: "+50938220145", address: null, tags: [], note: null, created_at: "", orders: 11, totalCents: 785000, initials: "JM" },
  { id: "c3", business_id: "biz-demo", full_name: "Marie-Carmelle J.", phone_e164: "+50934567712", address: null, tags: [], note: null, created_at: "", orders: 9, totalCents: 610000, initials: "MC" },
];

export const demoFunnel = { leads: 312, orders: 48, paid: 40, delivered: 35 };

export const demoTeam = [
  { id: "m1", full_name: "Nadège Pierre", role: "owner", user_id: "u1", salesCount: 0, salesCents: 0 },
  { id: "m2", full_name: "Jean Baptiste", role: "agent", user_id: "u2", salesCount: 14, salesCents: 940000 },
  { id: "m3", full_name: "Marie Joseph", role: "agent", user_id: "u3", salesCount: 9, salesCents: 610000 },
];

export const demoStats = {
  weekSalesCents: 4875000,
  weekTrendPct: 18,
  ordersToday: 12,
  owedCents: 1520000,
  // ventes des 7 derniers jours (en gourdes), pour le mini-graphe
  weekBars: [3200, 5400, 4100, 8200, 6600, 9400, 2500],
};

export const demoPipeline: PipelineCard[] = [
  { id: "o142", ref: "0142", status: "pou_konfime", customerName: "Wideline Désir",    phone_e164: "+50937124488", itemsSummary: "3 douzèn ze · 2 pen", totalCents: 90000,  owedCents: 0,      badge: "→ Jean" },
  { id: "o143", ref: "0143", status: "pou_konfime", customerName: "Nadège Fils-Aimé",  phone_e164: "+50936781290", itemsSummary: "1 sak diri Tchako",    totalCents: 120000, owedCents: 0,      badge: "Nouvo" },
  { id: "o140", ref: "0140", status: "peye",        customerName: "Jameson Pierre",    phone_e164: "+50938220145", itemsSummary: "2 boutèy lwil · sik",   totalCents: 64000,  owedCents: 0,      badge: "MonCash 8842" },
  { id: "o138", ref: "0138", status: "livre",       customerName: "Marie-Carmelle J.", phone_e164: "+50934567712", itemsSummary: "1 douzèn ze",          totalCents: 18000,  owedCents: 0 },
  { id: "o131", ref: "0131", status: "swivi",       customerName: "Ricardo Chéry",     phone_e164: "+50937905533", itemsSummary: "1 sak diri Tchako",    totalCents: 120000, owedCents: 120000 },
];

export const demoProducts: Product[] = [
  { id: "p1", business_id: "biz-demo", name: "Ze fre", category: "Manje", price_cents: 18000, currency: "HTG", unit: "douzèn", stock_qty: 42, stock_state: "en_stok", photo_url: null, sold_count: 48, is_active: true },
  { id: "p2", business_id: "biz-demo", name: "Diri Tchako", category: "Grenn", price_cents: 120000, currency: "HTG", unit: "sak", stock_qty: 8, stock_state: "en_stok", photo_url: null, sold_count: 12, is_active: true },
  { id: "p3", business_id: "biz-demo", name: "Pen konplè", category: "Boulanjri", price_cents: 15500, currency: "HTG", unit: "inite", stock_qty: 3, stock_state: "ba_stok", photo_url: null, sold_count: 31, is_active: true },
  { id: "p4", business_id: "biz-demo", name: "Lwil", category: "Manje", price_cents: 32000, currency: "HTG", unit: "boutèy", stock_qty: 20, stock_state: "en_stok", photo_url: null, sold_count: 22, is_active: true },
  { id: "p5", business_id: "biz-demo", name: "Sik", category: "Manje", price_cents: 9000, currency: "HTG", unit: "liv", stock_qty: 30, stock_state: "en_stok", photo_url: null, sold_count: 18, is_active: true },
  { id: "p6", business_id: "biz-demo", name: "Kola", category: "Bwason", price_cents: 5000, currency: "HTG", unit: "boutèy", stock_qty: 60, stock_state: "en_stok", photo_url: null, sold_count: 27, is_active: true },
  { id: "p7", business_id: "biz-demo", name: "Dlo", category: "Bwason", price_cents: 2500, currency: "HTG", unit: "galon", stock_qty: 0, stock_state: "fini", photo_url: null, sold_count: 40, is_active: true },
];
