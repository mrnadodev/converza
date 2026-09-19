// Couche d'accès aux données.
// Marche en MODE DÉMO (données de lib/demo.ts) tant que Supabase n'est pas
// configuré, puis bascule automatiquement sur Supabase dès que les variables
// NEXT_PUBLIC_SUPABASE_* sont présentes.

import { createClient } from "@/lib/supabase/server";
import { DEBT_STATUSES } from "@/lib/dunning";
import { pickShowcase, type ShowcaseMerchant } from "@/lib/showcase";
import {
  demoBusiness,
  demoCustomers,
  demoFunnel,
  demoPipeline,
  demoProducts,
  demoStats,
  demoTeam,
  demoTopCustomers,
} from "./demo";
import type { Business, Customer, OrderStatus, PipelineCard, Product } from "./types";

export function hasSupabase(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// --- Dashboard (Tablo debò) ---
export async function getDashboard() {
  const session = getCurrentUserSession();
  const userName = session.full_name;
  const isOwner = session.role === "owner";
  const specialty = session.specialty;

  const demo = {
    business: demoBusiness,
    stats: demoStats,
    topCustomers: demoTopCustomers,
    funnel: demoFunnel,
    statusCounts: countByStatus(demoPipeline),
    recentOrders: demoPipeline.map((c) => ({
      id: c.id,
      ref: c.ref,
      status: c.status,
      customerName: c.customerName,
      customerPhone: c.phone_e164 || null,
      totalCents: c.totalCents,
      owedCents: c.owedCents,
      created_at: "",
    })),
    userName,
    isOwner,
    specialty,
  };
  if (!hasSupabase()) return demo;

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return demo;

  const { data: member } = await sb
    .from("members")
    .select("full_name, business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return {
      business: { id: "", name: "Mon Business", slug: "boutik", business_type: "boutik" } as Business,
      stats: { weekSalesCents: 0, weekTrendPct: 0, hasLastWeek: false, ordersToday: 0, owedCents: 0, weekBars: [0, 0, 0, 0, 0, 0, 0] },
      topCustomers: [],
      funnel: { leads: 0, orders: 0, paid: 0, delivered: 0 },
      statusCounts: {} as Partial<Record<OrderStatus, number>>,
      recentOrders: [] as DashboardOrder[],
      userName: userName || "Fondateur",
      isOwner,
      specialty,
    };
  }

  const { data: business } = await sb
    .from("businesses")
    .select("*")
    .eq("id", member.business_id)
    .maybeSingle();

  const { data: orders } = await sb
    .from("orders")
    .select(
      "id, ref, status, created_at, delivery_fee_cents, amount_paid_cents, customer_id, customers(full_name, phone_e164), order_items(qty, unit_price_cents)",
    )
    .eq("business_id", member.business_id)
    .neq("status", "anile")
    .order("created_at", { ascending: false });

  const { count: leadsCount } = await sb
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", member.business_id);

  const rows = orders ?? [];

  return {
    business: (business ?? { id: member.business_id, name: "Mon Business", slug: "boutik", business_type: "boutik" }) as Business,
    stats: aggregateStats(rows),
    topCustomers: aggregateTopCustomers(rows),
    funnel: computeFunnel(rows, leadsCount ?? 0),
    statusCounts: countByStatus(rows),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders: rows.slice(0, 30).map((o: any): DashboardOrder => {
      const totalCents = orderTotalOf(o);
      return {
        id: o.id,
        ref: o.ref,
        status: o.status,
        customerName: o.customers?.full_name ?? "",
        customerPhone: o.customers?.phone_e164 ?? null,
        totalCents,
        owedCents: Math.max(totalCents - (o.amount_paid_cents ?? 0), 0),
        created_at: o.created_at,
      };
    }),
    userName: member.full_name || userName || "Fondateur",
    isOwner,
    specialty,
  };
}

export interface DashboardOrder {
  id: string;
  ref: string;
  status: OrderStatus;
  /** Vide quand la commande n'a pas de client rattaché. */
  customerName: string;
  /** Numéro du client, pour la relance WhatsApp. Vide si aucun client. */
  customerPhone: string | null;
  totalCents: number;
  owedCents: number;
  created_at: string;
}

function countByStatus(orders: { status: OrderStatus }[]): Partial<Record<OrderStatus, number>> {
  const counts: Partial<Record<OrderStatus, number>> = {};
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  return counts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeFunnel(orders: any[], leads: number) {
  // Une commande est payée dès que le paiement est confirmé, donc à partir de « sou_wout ».
  const paid = orders.filter((o) => ["peye", "sou_wout", "livre", "swivi"].includes(o.status)).length;
  const delivered = orders.filter((o) => ["livre", "swivi"].includes(o.status)).length;
  return { leads, orders: orders.length, paid, delivered };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderTotalOf(o: any): number {
  const items: { qty: number; unit_price_cents: number }[] = o.order_items ?? [];
  const sub = items.reduce((a, it) => a + Math.round(it.unit_price_cents * it.qty), 0);
  return sub + (o.delivery_fee_cents ?? 0);
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateStats(orders: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (now.getDay() + 6) % 7; // 0 = lundi
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);

  const weekBars = [0, 0, 0, 0, 0, 0, 0]; // L..D, en gourdes (hauteur relative)
  let weekSalesCents = 0;
  let lastWeekCents = 0;
  let ordersToday = 0;
  let owedCents = 0;

  for (const o of orders) {
    const total = orderTotalOf(o);
    // Une dette commence là où le marchand s'est engagé (lib/dunning.ts).
    if (DEBT_STATUSES.includes(o.status)) owedCents += Math.max(total - (o.amount_paid_cents ?? 0), 0);
    const c = new Date(o.created_at);
    if (c >= today) ordersToday++;
    if (c >= weekStart) {
      weekSalesCents += total;
      weekBars[(c.getDay() + 6) % 7] += Math.round(total / 100);
    } else if (c >= lastWeekStart && c < weekStart) {
      lastWeekCents += total;
    }
  }

  const weekTrendPct =
    lastWeekCents > 0 ? Math.round(((weekSalesCents - lastWeekCents) / lastWeekCents) * 100) : 0;

  return { weekSalesCents, weekTrendPct, hasLastWeek: lastWeekCents > 0, ordersToday, owedCents, weekBars };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateTopCustomers(orders: any[]) {
  const map = new Map<string, { id: string; full_name: string; orders: number; totalCents: number }>();
  for (const o of orders) {
    if (!o.customer_id) continue;
    const name = o.customers?.full_name ?? "Kliyan";
    const e = map.get(o.customer_id) ?? { id: o.customer_id, full_name: name, orders: 0, totalCents: 0 };
    e.orders += 1;
    e.totalCents += orderTotalOf(o);
    map.set(o.customer_id, e);
  }
  return [...map.values()]
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      business_id: "",
      full_name: c.full_name,
      phone_e164: "",
      address: null,
      tags: [] as string[],
      note: null,
      created_at: "",
      orders: c.orders,
      totalCents: c.totalCents,
      initials: initialsOf(c.full_name),
    }));
}

// --- Pipeline (Kanban) ---
export async function getPipeline(): Promise<PipelineCard[]> {
  if (!hasSupabase()) return demoPipeline;

  const sb = createClient();
  const bid = await myBusinessId(sb);
  if (!bid) return [];

  const base =
    "id, ref, status, delivery_fee_cents, amount_paid_cents, security_code, pay_method, delivery_addr, customers(full_name, phone_e164), order_items(name, qty, unit_price_cents)";
  const query = (columns: string) =>
    sb
      .from("orders")
      .select(columns)
      .eq("business_id", bid)
      .neq("status", "anile")
      // Une commande suivie et clôturée quitte le tableau, sinon la colonne
      // « Suivi » s'allongerait sans fin.
      .or("status.neq.swivi,followed_up_at.is.null")
      .order("created_at", { ascending: false });
  let { data, error } = await query(`${base}, courier_name, courier_phone, tracking_token, delivered_with_code`);
  // Colonnes de livraison absentes (migration 6 pas encore passée).
  if (error && /courier_|tracking_token|delivered_with_code/.test(error.message)) ({ data, error } = await query(base));

  // Un échec de requête ne doit pas retomber sur des commandes de démo : le
  // marchand croirait à de vraies ventes.
  if (error) {
    console.error("getPipeline:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((o: any) => {
    const items: { name: string; qty: number; unit_price_cents: number }[] = o.order_items ?? [];
    const subtotal = items.reduce((a, it) => a + Math.round(it.unit_price_cents * it.qty), 0);
    const totalCents = subtotal + (o.delivery_fee_cents ?? 0);
    return {
      id: o.id,
      ref: o.ref,
      status: o.status,
      customerName: o.customers?.full_name ?? "Kliyan",
      phone_e164: o.customers?.phone_e164 ?? "",
      itemsSummary: items.map((it) => `${it.qty}× ${it.name}`).join(" · "),
      items: items.map((it) => ({ name: it.name, qty: it.qty, unitPriceCents: it.unit_price_cents })),
      totalCents,
      deliveryFeeCents: o.delivery_fee_cents ?? 0,
      owedCents: Math.max(totalCents - (o.amount_paid_cents ?? 0), 0),
      securityCode: o.security_code ?? null,
      pay_method: o.pay_method ?? null,
      deliveryAddr: o.delivery_addr ?? null,
      courierName: o.courier_name ?? null,
      courierPhone: o.courier_phone ?? null,
      trackingToken: o.tracking_token ?? null,
      deliveredWithCode: Boolean(o.delivered_with_code),
    };
  });
}

// Business_id du membre connecté (les produits ont une lecture publique,
// donc il faut filtrer explicitement sur le business du marchand).
async function myBusinessId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
): Promise<string | null> {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.business_id ?? null;
}

import { getCurrentUserSession } from "./session";
import {
  type UserSession,
  type RolePermissions,
  getRolePermissions,
} from "./rbac";

export type { UserSession, RolePermissions };
export { getCurrentUserSession, getRolePermissions };

export const getGlobalUserOverride = (): UserSession => {
  return getCurrentUserSession();
};

// Les « overrides » vivent sur globalThis, donc partagés par TOUS les visiteurs
// du même processus. C'est acceptable en mode démo (une seule boutique fictive,
// pas de base), jamais en mode Supabase : sinon les réglages d'un marchand
// s'afficheraient chez les autres. On les neutralise dès qu'une base existe.
const getGlobalOverrides = (): Partial<Business> => {
  if (!(globalThis as any)._converzaBusinessOverrides) {
    (globalThis as any)._converzaBusinessOverrides = {};
  }
  return (globalThis as any)._converzaBusinessOverrides;
};

export function setBusinessOverride(patch: Partial<Business>) {
  if (hasSupabase()) return;
  const overrides = getGlobalOverrides();
  Object.assign(overrides, patch);
  Object.assign(demoBusiness, patch);
}

export function addDemoProduct(product: Product) {
  const existingIdx = demoProducts.findIndex((p) => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase());
  if (existingIdx >= 0) {
    demoProducts[existingIdx] = { ...demoProducts[existingIdx], ...product };
  } else {
    demoProducts.unshift(product);
  }
}

export function removeDemoProduct(id: string) {
  const idx = demoProducts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    demoProducts.splice(idx, 1);
  }
}

export function resetDataForNewBusiness(businessName: string, ownerName: string, businessType: string) {
  demoBusiness.name = businessName;
  demoBusiness.slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "boutik";
  demoBusiness.business_type = businessType;

  // Réinitialiser les statistiques à zéro
  demoStats.weekSalesCents = 0;
  demoStats.weekTrendPct = 0;
  demoStats.ordersToday = 0;
  demoStats.owedCents = 0;
  demoStats.weekBars = [0, 0, 0, 0, 0, 0, 0];

  // Réinitialiser le funnel à zéro
  demoFunnel.leads = 0;
  demoFunnel.orders = 0;
  demoFunnel.paid = 0;
  demoFunnel.delivered = 0;

  // Vider les listes d'exemples (catalogue 100% vide pour le nouveau marchand)
  demoProducts.length = 0;
  demoTopCustomers.length = 0;
  demoCustomers.length = 0;
  demoPipeline.length = 0;

  // Équipe : uniquement le propriétaire
  demoTeam.length = 0;
  demoTeam.push({
    id: "m-owner",
    full_name: ownerName,
    role: "owner",
    user_id: "u-owner",
    specialty: "Fondateur / Admin",
    salesCount: 0,
    salesCents: 0,
  });
}

export function resetCatalogForNewBusiness(businessName: string, businessType: string) {
  resetDataForNewBusiness(businessName, "Fondateur", businessType);
}

// Business du marchand connecté (pour l'espace d'édition).
export async function getMyBusiness(): Promise<Business> {
  if (hasSupabase()) {
    const sb = createClient();
    const bid = await myBusinessId(sb);
    if (bid) {
      const { data } = await sb.from("businesses").select("*").eq("id", bid).single();
      if (data) return data as Business;
    }
    return demoBusiness;
  }

  return { ...demoBusiness, ...getGlobalOverrides() } as Business;
}

// --- Team (agents + ventes par agent) ---
export async function getTeam() {
  const myBiz = await getMyBusiness();
  if (!hasSupabase()) {
    return { members: demoTeam, isOwner: true, businessId: myBiz.id, businessType: myBiz.business_type, businessPlan: myBiz.plan ?? "gratis" };
  }
  const sb = createClient();
  const bid = await myBusinessId(sb);
  if (!bid) return { members: [], isOwner: true, businessId: myBiz.id, businessType: myBiz.business_type, businessPlan: myBiz.plan ?? "gratis" };

  const { data: members } = await sb
    .from("members")
    .select("id, full_name, role, user_id, agent_profile")
    .eq("business_id", bid);

  const { data: orders } = await sb
    .from("orders")
    .select("assigned_to, delivery_fee_cents, order_items(qty, unit_price_cents)")
    .eq("business_id", bid)
    .neq("status", "anile");

  const salesBy = new Map<string, { count: number; cents: number }>();
  for (const o of orders ?? []) {
    if (!o.assigned_to) continue;
    const e = salesBy.get(o.assigned_to) ?? { count: 0, cents: 0 };
    e.count += 1;
    e.cents += orderTotalOf(o);
    salesBy.set(o.assigned_to, e);
  }

  const list = (members ?? []).map((m) => ({
    ...m,
    salesCount: salesBy.get(m.id)?.count ?? 0,
    salesCents: salesBy.get(m.id)?.cents ?? 0,
  }));

  const session = getCurrentUserSession();
  const isOwner = session.role === "owner";
  return { members: list, isOwner, businessId: bid, businessType: myBiz.business_type };
}

// --- Katalòg (produits du marchand) ---
export async function getCatalog(): Promise<Product[]> {
  if (!hasSupabase()) return demoProducts;
  const sb = createClient();
  const bid = await myBusinessId(sb);
  if (!bid) return demoProducts;
  const [{ data }, { data: costs }] = await Promise.all([
    sb.from("products").select("*").eq("business_id", bid).order("name"),
    // Prix d'achat : table privée (migration 6). Absente, la requête échoue
    // et les produits restent simplement sans coût.
    sb.from("product_costs").select("product_id, cost_cents").eq("business_id", bid),
  ]);
  const costOf = new Map((costs ?? []).map((c: { product_id: string; cost_cents: number }) => [c.product_id, Number(c.cost_cents)]));

  // Un catalogue vide reste vide : injecter les produits de démo ferait croire
  // à un nouveau marchand qu'il a déjà un stock en ligne.
  return ((data ?? []) as Product[]).map((p) => ({ ...p, cost_cents: costOf.get(p.id) ?? null }));
}

// --- Sources de vente (attribution des campagnes) ---
export interface SourceRow {
  source: string;
  orders: number;
  revenueCents: number;
}

/**
 * Chiffre d'affaires par source publicitaire, sur une fenêtre glissante.
 * Les commandes sans source sont regroupées sous une source vide (affichée « lien direct ») : les exclure
 * donnerait un total qui ne correspond à rien de connu.
 */
export async function getSourceBreakdown(days = 30): Promise<SourceRow[]> {
  if (!hasSupabase()) return [];

  const sb = createClient();
  const bid = await myBusinessId(sb);
  if (!bid) return [];

  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await sb
    .from("orders")
    .select("source, delivery_fee_cents, order_items(qty, unit_price_cents)")
    .eq("business_id", bid)
    .neq("status", "anile")
    .gte("created_at", since);

  if (error || !data) return [];

  const map = new Map<string, SourceRow>();
  for (const o of data) {
    const key = o.source?.trim() || "";
    const row = map.get(key) ?? { source: key, orders: 0, revenueCents: 0 };
    row.orders += 1;
    row.revenueCents += orderTotalOf(o);
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => b.revenueCents - a.revenueCents);
}

// --- Kliyan (clients du marchand) ---
export async function getCustomers(): Promise<Customer[]> {
  if (!hasSupabase()) return demoCustomers;
  const sb = createClient();
  const bid = await myBusinessId(sb);
  if (!bid) return [];
  const { data } = await sb.from("customers").select("*").eq("business_id", bid).order("full_name");
  return (data ?? []) as Customer[];
}

// --- Boutiques présentées sur la page d'accueil ---
/**
 * Lit les boutiques publiques et leur nombre de produits en ligne, avec la
 * même session anonyme qu'un visiteur : la page d'accueil ne montre rien que
 * les vitrines ne montrent déjà. Le choix se fait dans lib/showcase.ts.
 */
export async function getShowcaseMerchants(): Promise<ShowcaseMerchant[]> {
  if (!hasSupabase()) return [];
  const sb = createClient();
  const { data: businesses, error } = await sb
    .from("public_businesses")
    .select("id, name, slug, logo_url, business_type, created_at")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !businesses?.length) return [];

  const { data: products } = await sb
    .from("products")
    .select("business_id")
    .eq("is_active", true)
    .in(
      "business_id",
      businesses.map((b) => b.id),
    )
    .limit(5000);
  const counts = new Map<string, number>();
  for (const row of products ?? []) counts.set(row.business_id, (counts.get(row.business_id) ?? 0) + 1);

  return pickShowcase(
    businesses.map((b) => ({
      name: b.name ?? "",
      slug: b.slug ?? "",
      logoUrl: b.logo_url ?? null,
      sector: b.business_type ?? null,
      activeProducts: counts.get(b.id) ?? 0,
      createdAt: b.created_at ?? "",
    })),
  );
}

// --- Vitrine publique (#0) ---
export async function getStorefront(
  slug: string,
): Promise<{ business: Business; products: Product[] } | null> {
  // La vitrine est publique : en mode Supabase on ne doit surtout pas passer par
  // la session du visiteur (getMyBusiness), qui coûte deux requêtes inutiles et
  // renverrait la boutique du marchand connecté.
  if (!hasSupabase()) {
    const myBiz = await getMyBusiness();
    return slug === demoBusiness.slug || slug === myBiz.slug
      ? { business: myBiz, products: await getCatalog() }
      : null;
  }

  const sb = createClient();
  // Vue publique : elle n'expose pas les coordonnées bancaires, MonCash,
  // Natcash ni l'adresse USDT du marchand.
  const { data: business } = await sb
    .from("public_businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) {
    return null;
  }

  const { data: products } = await sb
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  return { business: business as Business, products: (products ?? []) as Product[] };
}
