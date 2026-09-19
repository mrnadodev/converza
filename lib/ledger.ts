import { createAdminClient } from "@/lib/supabase/admin";
import { periodStart, type KesPeriod } from "./kes-period";
import type { LedgerInput } from "./accounting";
import type { Currency } from "./types";

// Lecture des opérations d'une période pour le livre journal (lib/accounting.ts).
//
// Chaque journal se lit séparément : sur une base où la migration 6 n'a pas
// encore été jouée, les encaissements, dépenses et achats n'existent pas. On
// exporte alors ce qui existe — les ventes — plutôt que de renvoyer une erreur
// au marchand qui attend son fichier.

export interface LedgerFetch {
  input: LedgerInput;
  from: string;
  /** Journaux absents de la base, à signaler à l'écran. */
  missing: string[];
}

const nameOf = (v: unknown): string => {
  const row = Array.isArray(v) ? v[0] : v;
  return (row as { full_name?: string; name?: string } | null)?.full_name ?? (row as { name?: string } | null)?.name ?? "";
};

export async function getLedger(businessId: string, currency: Currency, period: KesPeriod): Promise<LedgerFetch> {
  const { iso, date } = periodStart(period);
  const empty: LedgerFetch = {
    input: { currency, orders: [], payments: [], expenses: [], purchases: [] },
    from: date,
    missing: [],
  };

  const admin = createAdminClient();
  if (!admin) return empty;

  const missing: string[] = [];

  const [ordersRes, paymentsRes, expensesRes, purchasesRes] = await Promise.all([
    admin
      .from("orders")
      .select("ref, status, created_at, pay_method, delivery_fee_cents, customers(full_name), order_items(qty, unit_price_cents)")
      .eq("business_id", businessId)
      .neq("status", "anile")
      .gte("created_at", iso)
      .order("created_at", { ascending: true }),
    admin
      .from("order_payments")
      .select("amount_cents, pay_method, paid_at, orders(ref, customers(full_name))")
      .eq("business_id", businessId)
      .gte("paid_at", iso)
      .order("paid_at", { ascending: true }),
    admin.from("expenses").select("id, category, note, amount_cents, pay_method, spent_on").eq("business_id", businessId).gte("spent_on", date),
    admin.from("purchases").select("id, total_cents, paid_cents, pay_method, received_on, suppliers(name)").eq("business_id", businessId).gte("received_on", date),
  ]);

  if (ordersRes.error) missing.push("ventes");
  if (paymentsRes.error) missing.push("encaissements");
  if (expensesRes.error) missing.push("depenses");
  if (purchasesRes.error) missing.push("achats");

  const orders = (ordersRes.data ?? []).map((o) => {
    const items = (o.order_items ?? []) as { qty: number; unit_price_cents: number }[];
    const total = items.reduce((n, it) => n + Math.round(Number(it.unit_price_cents) * Number(it.qty)), 0) + Number(o.delivery_fee_cents ?? 0);
    return {
      ref: o.ref as string,
      customer: nameOf(o.customers),
      totalCents: total,
      status: o.status as string,
      createdAt: o.created_at as string,
      payMethod: (o.pay_method as string | null) ?? null,
    };
  });

  const payments = (paymentsRes.data ?? []).map((p) => {
    const order = (Array.isArray(p.orders) ? p.orders[0] : p.orders) as { ref?: string; customers?: unknown } | null;
    return {
      orderRef: order?.ref ?? "",
      customer: nameOf(order?.customers),
      amountCents: Number(p.amount_cents),
      method: (p.pay_method as string | null) ?? null,
      paidAt: p.paid_at as string,
    };
  });

  const expenses = (expensesRes.data ?? []).map((e) => ({
    id: e.id as string,
    category: e.category as string,
    note: (e.note as string | null) ?? null,
    amountCents: Number(e.amount_cents),
    method: (e.pay_method as string | null) ?? null,
    spentOn: e.spent_on as string,
  }));

  const purchases = (purchasesRes.data ?? []).map((a) => ({
    id: a.id as string,
    supplier: nameOf(a.suppliers),
    totalCents: Number(a.total_cents),
    paidCents: Number(a.paid_cents),
    method: (a.pay_method as string | null) ?? null,
    receivedOn: a.received_on as string,
  }));

  return { input: { currency, orders, payments, expenses, purchases }, from: date, missing };
}
