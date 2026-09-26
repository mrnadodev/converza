import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { StockManager, type MovementRow, type PurchaseRow } from "@/components/StockManager";
import { getCatalog, getMyBusiness, getPipeline, getCurrentUserSession, getRolePermissions, hasSupabase } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// Écran Stòk — quantités, mouvements et rapports de ventes.
export default async function StockPage() {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);

  if (!permissions.allowedNavTabs.includes("stok")) {
    redirect("/");
  }

  // Les commandes ne partent que vers qui a le droit de les lire.
  //
  // Masquer le bouton n'aurait rien réglé : `getPipeline()` était appelé pour
  // tout le monde, si bien que le navigateur du stockiste recevait déjà chaque
  // commande avec le nom et le numéro de son client. La restriction se joue
  // ici, à la source, et le bouton n'en est que la conséquence visible.
  const [products, business, cards, history, purchases] = await Promise.all([
    getCatalog(),
    getMyBusiness(),
    permissions.canViewSalesReport ? getPipeline() : Promise.resolve([]),
    loadMovements(),
    loadPurchases(),
  ]);

  return (
    <div className="app-page with-topnav relative flex min-h-[100dvh] flex-col bg-[#F0F2F3]">
      <StockManager
        business={business}
        initialProducts={products}
        cards={cards}
        canEdit={permissions.canEditStock}
        canViewStockReport={permissions.canViewStockReport}
        canViewSalesReport={permissions.canViewSalesReport}
        movements={history.rows}
        movementsAvailable={history.available}
        purchases={purchases.rows}
        suppliers={purchases.suppliers}
        purchasesAvailable={purchases.available}
      />

      <BottomNav active="stok" userSession={session} />
    </div>
  );
}

/** Réceptions récentes et fournisseurs (migration 6). */
async function loadPurchases(): Promise<{ rows: PurchaseRow[]; suppliers: { id: string; name: string }[]; available: boolean }> {
  if (!hasSupabase()) return { rows: [], suppliers: [], available: false };
  const sb = createClient();
  const [{ data, error }, { data: suppliers }] = await Promise.all([
    sb
      .from("purchases")
      .select("id, total_cents, paid_cents, currency, received_on, note, suppliers(name), purchase_items(qty, unit_cost_cents, products(name))")
      .order("received_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    sb.from("suppliers").select("id, name").order("name"),
  ]);
  if (error) return { rows: [], suppliers: [], available: false };

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  const rows: PurchaseRow[] = (data ?? []).map((p) => ({
    id: p.id,
    supplier: one(p.suppliers as { name: string } | { name: string }[] | null)?.name ?? null,
    receivedOn: p.received_on,
    total: Number(p.total_cents),
    paid: Number(p.paid_cents),
    currency: p.currency,
    note: p.note,
    lines: ((p.purchase_items ?? []) as { qty: number; unit_cost_cents: number; products: { name: string } | { name: string }[] | null }[]).map((it) => ({
      name: one(it.products)?.name ?? "—",
      qty: Number(it.qty),
      unitCost: Number(it.unit_cost_cents),
    })),
  }));
  return { rows, suppliers: suppliers ?? [], available: true };
}

/**
 * Derniers mouvements de la boutique (RLS : seulement les siens).
 * `available` est faux tant que la migration 5 n'a pas créé la table.
 */
async function loadMovements(): Promise<{ rows: MovementRow[]; available: boolean }> {
  if (!hasSupabase()) return { rows: [], available: false };
  const sb = createClient();
  const [{ data, error }, { data: members }] = await Promise.all([
    sb
      .from("stock_movements")
      .select("id, product_id, delta, kind, qty_after, note, created_at, created_by, products(name), orders(ref)")
      .order("created_at", { ascending: false })
      .limit(80),
    sb.from("members").select("user_id, full_name"),
  ]);
  if (error) return { rows: [], available: false };

  const names = new Map((members ?? []).map((m) => [m.user_id, m.full_name]));
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  const rows: MovementRow[] = (data ?? []).map((m) => ({
    id: m.id,
    productId: m.product_id,
    productName: one(m.products as { name: string } | { name: string }[] | null)?.name ?? "—",
    delta: Number(m.delta),
    kind: m.kind,
    qtyAfter: m.qty_after === null ? null : Number(m.qty_after),
    note: m.note,
    createdAt: m.created_at,
    author: m.created_by ? names.get(m.created_by) ?? null : null,
    orderRef: one(m.orders as { ref: string } | { ref: string }[] | null)?.ref ?? null,
  }));
  return { rows, available: true };
}
