import { createAdminClient } from "@/lib/supabase/admin";
import { planOf } from "@/lib/plans";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderTotal(o: any): number {
  const items: { qty: number; unit_price_cents: number }[] = o.order_items ?? [];
  return items.reduce((a, it) => a + Math.round(it.unit_price_cents * it.qty), 0) + (o.delivery_fee_cents ?? 0);
}

export async function getAdminData() {
  const admin = createAdminClient();
  if (!admin) return null;
  const now = Date.now();

  const [bizRes, payRes, ordRes, prodRes, memRes] = await Promise.all([
    admin.from("businesses").select("id,name,slug,business_type,plan,plan_until,created_at"),
    admin.from("subscription_payments").select("id,plan,amount_cents,pay_method,pay_ref,status,created_at,business_id,businesses(name,slug)").order("created_at", { ascending: false }),
    admin.from("orders").select("business_id,status,delivery_fee_cents,order_items(qty,unit_price_cents)").neq("status", "anile"),
    admin.from("products").select("business_id"),
    admin.from("members").select("business_id,role"),
  ]);

  const businesses = bizRes.data ?? [];
  const payments = payRes.data ?? [];
  const orders = ordRes.data ?? [];
  const products = prodRes.data ?? [];
  const members = memRes.data ?? [];

  // Agrégats par business
  const ordCount = new Map<string, number>();
  const gmv = new Map<string, number>();
  for (const o of orders) {
    ordCount.set(o.business_id, (ordCount.get(o.business_id) ?? 0) + 1);
    gmv.set(o.business_id, (gmv.get(o.business_id) ?? 0) + orderTotal(o));
  }
  const prodCount = new Map<string, number>();
  for (const p of products) prodCount.set(p.business_id, (prodCount.get(p.business_id) ?? 0) + 1);
  const agentCount = new Map<string, number>();
  for (const m of members) if (m.role === "agent") agentCount.set(m.business_id, (agentCount.get(m.business_id) ?? 0) + 1);

  // KPIs
  const monthAgo = now - 30 * 864e5;
  let mrrCents = 0;
  const planCounts = { gratis: 0, pro: 0, premium: 0 };
  let newThisMonth = 0;
  const expired: { id: string; name: string; plan: string }[] = [];

  for (const b of businesses) {
    const plan = (b.plan ?? "gratis") as keyof typeof planCounts;
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    const until = b.plan_until ? new Date(b.plan_until).getTime() : null;
    const active = until == null || until > now;
    if ((plan === "pro" || plan === "premium") && active) mrrCents += planOf(plan).priceGdes * 100;
    if ((plan === "pro" || plan === "premium") && until != null && until < now) expired.push({ id: b.id, name: b.name, plan });
    if (new Date(b.created_at).getTime() > monthAgo) newThisMonth += 1;
  }

  const totalGmv = [...gmv.values()].reduce((a, v) => a + v, 0);
  const paidCount = planCounts.pro + planCounts.premium;
  const conversionPct = businesses.length ? Math.round((paidCount / businesses.length) * 100) : 0;

  // Inscriptions par semaine (8 dernières)
  const weeks = Array.from({ length: 8 }, () => 0);
  for (const b of businesses) {
    const wk = Math.floor((now - new Date(b.created_at).getTime()) / (7 * 864e5));
    if (wk >= 0 && wk < 8) weeks[7 - wk] += 1; // index 7 = semaine courante
  }

  const merchants = businesses
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      business_type: b.business_type,
      plan: b.plan ?? "gratis",
      plan_until: b.plan_until,
      created_at: b.created_at,
      products: prodCount.get(b.id) ?? 0,
      orders: ordCount.get(b.id) ?? 0,
      agents: agentCount.get(b.id) ?? 0,
      gmvCents: gmv.get(b.id) ?? 0,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    kpis: {
      mrrCents,
      merchants: businesses.length,
      newThisMonth,
      gmvCents: totalGmv,
      conversionPct,
      paidCount,
    },
    planCounts,
    signups: weeks,
    pendingPayments: payments.filter((p) => p.status === "pending"),
    expired,
    merchants,
  };
}
