import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { hasSupabase } from "@/lib/data";
import { logAdminAction } from "@/lib/audit-logger";
import { merchantIssues } from "@/lib/merchant-health";
import { SupportView, type SupportData } from "@/components/SupportView";

// Vue support d'un compte marchand : tout ce qu'il faut pour comprendre un
// problème sans demander de captures d'écran, et sans rien modifier par
// inadvertance. La consultation est inscrite au journal d'audit.
export default async function SupportPage({ params }: { params: { id: string } }) {
  if (!hasSupabase()) notFound();
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) notFound();

  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: business } = await admin.from("businesses").select("*").eq("id", params.id).maybeSingle();
  if (!business) notFound();

  const count = async (table: string, filters: (q: never) => unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = admin.from(table).select("id", { count: "exact", head: true }).eq("business_id", params.id);
    q = (filters as unknown as (x: unknown) => unknown)(q) ?? q;
    const { count: n } = await q;
    return n ?? 0;
  };

  const [members, products, orders, movements, productsCount, ordersCount, trackedCount, costsCount, lastOrderRes] = await Promise.all([
    admin.from("members").select("id, user_id, full_name, role, agent_profile").eq("business_id", params.id),
    admin.from("products").select("id, name, price_cents, currency, stock_qty, stock_state, is_active, photo_url").eq("business_id", params.id).order("name").limit(50),
    admin
      .from("orders")
      .select("id, ref, status, created_at, amount_paid_cents, delivery_fee_cents, customers(full_name), order_items(qty, unit_price_cents)")
      .eq("business_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("stock_movements").select("id, kind, delta, qty_after, created_at, products(name)").eq("business_id", params.id).order("created_at", { ascending: false }).limit(15),
    count("products", (q) => q),
    count("orders", (q) => q),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("products", (q) => (q as any).not("stock_qty", "is", null)),
    count("product_costs", (q) => q),
    admin.from("orders").select("created_at").eq("business_id", params.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const owner = (members.data ?? []).find((m) => m.role === "owner");
  let ownerEmail: string | null = null;
  let lastSignInAt: string | null = null;
  if (owner) {
    const { data: u } = await admin.auth.admin.getUserById(owner.user_id);
    ownerEmail = u?.user?.email ?? null;
    lastSignInAt = u?.user?.last_sign_in_at ?? null;
  }

  await logAdminAction({ adminEmail: user.email!, action: "VIEW_MERCHANT", targetBusinessId: params.id, details: { name: business.name } });

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  const data: SupportData = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    plan: business.plan ?? "gratis",
    planUntil: business.plan_until ?? null,
    createdAt: business.created_at,
    phone: business.phone_e164 ?? null,
    address: business.address ?? null,
    sector: business.business_type ?? null,
    suspendedAt: business.suspended_at ?? null,
    suspendedReason: business.suspended_reason ?? null,
    ownerEmail,
    lastSignInAt,
    payMethods: [
      business.moncash_number ? "MonCash" : null,
      business.natcash_number ? "NatCash" : null,
      business.bank_accounts ? "Banque" : null,
      business.zelle_info ? "Zelle" : null,
      business.usdt_trc20_address ? "USDT" : null,
    ].filter(Boolean) as string[],
    deliveryZones: Array.isArray(business.delivery_zones) ? business.delivery_zones.length : 0,
    counts: { products: productsCount, orders: ordersCount, tracked: trackedCount, costs: costsCount },
    members: (members.data ?? []).map((m) => ({ id: m.id, name: m.full_name ?? "—", role: m.role, profile: m.agent_profile ?? null })),
    products: (products.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: Number(p.price_cents),
      currency: (p.currency as "HTG" | "USD") ?? "HTG",
      stockQty: p.stock_qty === null ? null : Number(p.stock_qty),
      stockState: p.stock_state as string,
      active: Boolean(p.is_active),
      photo: p.photo_url ?? null,
    })),
    orders: (orders.data ?? []).map((o) => {
      const items = (o.order_items ?? []) as { qty: number; unit_price_cents: number }[];
      const total = items.reduce((a, it) => a + Math.round(Number(it.unit_price_cents) * Number(it.qty)), 0) + Number(o.delivery_fee_cents ?? 0);
      return {
        id: o.id,
        ref: o.ref,
        status: o.status as string,
        createdAt: o.created_at,
        customer: one(o.customers as { full_name: string } | { full_name: string }[] | null)?.full_name ?? "—",
        totalCents: total,
        owedCents: Math.max(total - Number(o.amount_paid_cents ?? 0), 0),
      };
    }),
    movements: movements.error
      ? []
      : (movements.data ?? []).map((m) => ({
          id: m.id,
          kind: m.kind as string,
          delta: Number(m.delta),
          qtyAfter: m.qty_after === null ? null : Number(m.qty_after),
          createdAt: m.created_at,
          product: one(m.products as { name: string } | { name: string }[] | null)?.name ?? "—",
        })),
    issues: merchantIssues({
      suspendedAt: business.suspended_at ?? null,
      products: productsCount,
      orders: ordersCount,
      lastOrderAt: lastOrderRes.data?.created_at ?? null,
      createdAt: business.created_at,
      plan: business.plan ?? "gratis",
      planUntil: business.plan_until,
      phone: business.phone_e164,
      coverUrl: business.cover_url,
      deliveryZones: Array.isArray(business.delivery_zones) ? business.delivery_zones : [],
      hasPayMethod: Boolean(business.moncash_number || business.natcash_number || business.bank_accounts || business.zelle_info || business.usdt_trc20_address),
      trackedProducts: trackedCount,
      productsWithCost: costsCount,
      lastSignInAt,
    }),
  };

  return <SupportView data={data} />;
}

export const metadata = { title: "Vue support · CONVERZA", robots: { index: false, follow: false } };
