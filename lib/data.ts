// Couche d'accès aux données.
// Marche en MODE DÉMO (données de lib/demo.ts) tant que Supabase n'est pas
// configuré, puis bascule automatiquement sur Supabase dès que les variables
// NEXT_PUBLIC_SUPABASE_* sont présentes.

import { createClient } from "@/lib/supabase/server";
import {
  demoBusiness,
  demoPipeline,
  demoProducts,
  demoStats,
  demoTopCustomers,
} from "./demo";
import type { Business, PipelineCard, Product } from "./types";

export function hasSupabase(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// --- Dashboard (Tablo debò) ---
export async function getDashboard() {
  const demo = { business: demoBusiness, stats: demoStats, topCustomers: demoTopCustomers };
  if (!hasSupabase()) return demo;

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return demo;

  const { data: member } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return demo;

  const { data: business } = await sb
    .from("businesses")
    .select("*")
    .eq("id", member.business_id)
    .single();

  const { data: orders } = await sb
    .from("orders")
    .select(
      "status, created_at, delivery_fee_cents, amount_paid_cents, customer_id, customers(full_name), order_items(qty, unit_price_cents)",
    )
    .neq("status", "anile");

  const rows = orders ?? [];
  return {
    business: (business ?? demoBusiness) as Business,
    stats: aggregateStats(rows),
    topCustomers: aggregateTopCustomers(rows),
  };
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
    owedCents += Math.max(total - (o.amount_paid_cents ?? 0), 0);
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

  return { weekSalesCents, weekTrendPct, ordersToday, owedCents, weekBars };
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
  const { data, error } = await sb
    .from("orders")
    .select(
      "id, ref, status, delivery_fee_cents, amount_paid_cents, customers(full_name, phone_e164), order_items(name, qty, unit_price_cents)",
    )
    .neq("status", "anile")
    .order("created_at", { ascending: false });

  if (error || !data) return demoPipeline;

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
      totalCents,
      owedCents: Math.max(totalCents - (o.amount_paid_cents ?? 0), 0),
    };
  });
}

// --- Vitrine publique (#0) ---
export async function getStorefront(
  slug: string,
): Promise<{ business: Business; products: Product[] } | null> {
  if (!hasSupabase()) {
    return slug === demoBusiness.slug
      ? { business: demoBusiness, products: demoProducts }
      : null;
  }

  const sb = createClient();
  const { data: business } = await sb
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!business) return null;

  const { data: products } = await sb
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  return { business: business as Business, products: (products ?? []) as Product[] };
}
