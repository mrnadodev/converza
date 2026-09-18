import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import type { Currency } from "@/lib/types";
import { periodStart, type KesPeriod } from "@/lib/kes-period";

export { EXPENSE_CATEGORIES, KES_PERIODS, periodStart, type ExpenseCategory, type KesPeriod } from "@/lib/kes-period";

// Kès : caisse, dépenses, bénéfice et argent dehors d'une boutique, sur une
// période en heure d'Haïti. Tout est lu avec la session du marchand (RLS).
//
// Les montants ne sont additionnés que dans la devise principale de la
// boutique : additionner des gourdes et des dollars donnerait un chiffre faux.

const CONFIRMED = ["konfime_peman", "sou_wout", "livre", "swivi", "peye"];

export interface KesData {
  available: boolean;
  period: KesPeriod;
  currency: Currency;
  since: string;
  cashIn: { total: number; byMethod: { method: string; amount: number }[] };
  expenses: { total: number; byCategory: { category: string; amount: number }[]; rows: ExpenseRow[] };
  purchasesPaid: number;
  cashBalance: number;
  sales: { revenue: number; cost: number; grossProfit: number; coveredRevenue: number; orders: number };
  netProfit: number;
  receivables: { total: number; rows: { orderId: string; ref: string; customer: string; phone: string; owed: number; since: string }[] };
  supplierDebt: { total: number; rows: { supplier: string; owed: number; since: string }[] };
  otherCurrencyOrders: number;
}

export interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  payMethod: string | null;
  note: string | null;
  spentOn: string;
}

function sumBy<T>(rows: T[], key: (r: T) => string, amount: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + amount(r));
  return [...map.entries()].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
}

export async function getKes(businessId: string, currency: Currency, period: KesPeriod): Promise<KesData> {
  const { iso, date } = periodStart(period);
  const empty: KesData = {
    available: false,
    period,
    currency,
    since: date,
    cashIn: { total: 0, byMethod: [] },
    expenses: { total: 0, byCategory: [], rows: [] },
    purchasesPaid: 0,
    cashBalance: 0,
    sales: { revenue: 0, cost: 0, grossProfit: 0, coveredRevenue: 0, orders: 0 },
    netProfit: 0,
    receivables: { total: 0, rows: [] },
    supplierDebt: { total: 0, rows: [] },
    otherCurrencyOrders: 0,
  };
  if (!hasSupabase()) return empty;

  const sb = createClient();
  const [payRes, expRes, purRes, salesRes, openRes, debtRes] = await Promise.all([
    sb.from("order_payments").select("amount_cents, currency, pay_method").eq("business_id", businessId).gte("paid_at", iso),
    sb.from("expenses").select("id, amount_cents, currency, category, pay_method, note, spent_on").eq("business_id", businessId).gte("spent_on", date).order("spent_on", { ascending: false }),
    sb.from("purchases").select("paid_cents, currency").eq("business_id", businessId).gte("received_on", date),
    sb
      .from("orders")
      .select("id, currency, order_items(qty, unit_price_cents, unit_cost_cents)")
      .eq("business_id", businessId)
      .in("status", CONFIRMED)
      .gte("created_at", iso),
    // Argent dehors : toutes les commandes non annulées, quelle que soit la date.
    sb
      .from("orders")
      .select("id, ref, currency, created_at, delivery_fee_cents, amount_paid_cents, customers(full_name, phone_e164), order_items(qty, unit_price_cents)")
      .eq("business_id", businessId)
      .neq("status", "anile"),
    sb.from("purchases").select("total_cents, paid_cents, currency, received_on, suppliers(name)").eq("business_id", businessId),
  ]);

  // Tables de la migration 6 absentes : on le signale plutôt que d'afficher des zéros.
  if (payRes.error || expRes.error || purRes.error) return empty;

  const same = (c: string | null | undefined) => (c ?? "HTG") === currency;

  const payments = (payRes.data ?? []).filter((p) => same(p.currency));
  const cashTotal = payments.reduce((a, p) => a + Number(p.amount_cents), 0);

  const expenseRows = (expRes.data ?? []).filter((e) => same(e.currency));
  const expenseTotal = expenseRows.reduce((a, e) => a + Number(e.amount_cents), 0);

  const purchasesPaid = (purRes.data ?? []).filter((p) => same(p.currency)).reduce((a, p) => a + Number(p.paid_cents), 0);

  // Ventes et coût des ventes : seules les lignes au prix d'achat connu
  // entrent dans la marge ; la part couverte est affichée.
  let revenue = 0;
  let cost = 0;
  let coveredRevenue = 0;
  let otherCurrencyOrders = 0;
  const salesOrders = salesRes.data ?? [];
  for (const o of salesOrders) {
    if (!same(o.currency)) {
      otherCurrencyOrders++;
      continue;
    }
    for (const it of (o.order_items ?? []) as { qty: number; unit_price_cents: number; unit_cost_cents: number | null }[]) {
      const line = Math.round(Number(it.unit_price_cents) * Number(it.qty));
      revenue += line;
      if (it.unit_cost_cents !== null && it.unit_cost_cents !== undefined) {
        cost += Math.round(Number(it.unit_cost_cents) * Number(it.qty));
        coveredRevenue += line;
      }
    }
  }
  const grossProfit = coveredRevenue - cost;

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const receivableRows = (openRes.data ?? [])
    .filter((o) => same(o.currency))
    .map((o) => {
      const items = (o.order_items ?? []) as { qty: number; unit_price_cents: number }[];
      const total = items.reduce((a, it) => a + Math.round(Number(it.unit_price_cents) * Number(it.qty)), 0) + Number(o.delivery_fee_cents ?? 0);
      const customer = one(o.customers as { full_name: string; phone_e164: string } | { full_name: string; phone_e164: string }[] | null);
      return {
        orderId: o.id,
        ref: o.ref,
        customer: customer?.full_name ?? "—",
        phone: customer?.phone_e164 ?? "",
        owed: Math.max(total - Number(o.amount_paid_cents ?? 0), 0),
        since: o.created_at,
      };
    })
    .filter((r) => r.owed > 0)
    .sort((a, b) => b.owed - a.owed);

  const debtRows = debtRes.error
    ? []
    : (debtRes.data ?? [])
        .filter((p) => same(p.currency))
        .map((p) => ({
          supplier: one(p.suppliers as { name: string } | { name: string }[] | null)?.name ?? "—",
          owed: Math.max(Number(p.total_cents) - Number(p.paid_cents), 0),
          since: p.received_on,
        }))
        .filter((r) => r.owed > 0);

  return {
    available: true,
    period,
    currency,
    since: date,
    cashIn: { total: cashTotal, byMethod: sumBy(payments, (p) => p.pay_method ?? "", (p) => Number(p.amount_cents)).map(({ k, v }) => ({ method: k, amount: v })) },
    expenses: {
      total: expenseTotal,
      byCategory: sumBy(expenseRows, (e) => e.category, (e) => Number(e.amount_cents)).map(({ k, v }) => ({ category: k, amount: v })),
      rows: expenseRows.map((e) => ({ id: e.id, amount: Number(e.amount_cents), category: e.category, payMethod: e.pay_method, note: e.note, spentOn: e.spent_on })),
    },
    purchasesPaid,
    cashBalance: cashTotal - expenseTotal - purchasesPaid,
    sales: { revenue, cost, grossProfit, coveredRevenue, orders: salesOrders.length - otherCurrencyOrders },
    netProfit: grossProfit - expenseTotal,
    receivables: { total: receivableRows.reduce((a, r) => a + r.owed, 0), rows: receivableRows.slice(0, 30) },
    supplierDebt: { total: debtRows.reduce((a, r) => a + r.owed, 0), rows: debtRows.slice(0, 30) },
    otherCurrencyOrders,
  };
}
