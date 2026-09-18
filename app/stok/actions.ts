"use server";

import { revalidatePath } from "next/cache";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

// Mouvements de stock saisis par le marchand : réception de marchandise,
// perte ou casse, inventaire. Les ventes et annulations sont enregistrées
// par la base elle-même à partir des commandes (db/migrate-2026-5-stock.sql).

export type ManualMovementKind = "entree" | "perte" | "correction";
export type StockMovementError = "forbidden" | "invalid" | "migration" | "failed";

export async function recordStockMovement(input: {
  productId: string;
  kind: ManualMovementKind;
  /** Quantité reçue ou perdue ; pour un inventaire, le total compté. */
  qty: number;
  note?: string;
}): Promise<{ ok: true; qtyAfter: number | null } | { ok: false; error: StockMovementError }> {
  if (!hasSupabase()) return { ok: true, qtyAfter: null };

  const me = await getMemberContext();
  const permissions = await getMemberPermissions();
  if (!me || (permissions && !permissions.canEditStock)) return { ok: false, error: "forbidden" };

  const qty = Number(input.qty);
  const validKind = ["entree", "perte", "correction"].includes(input.kind);
  const validQty = Number.isFinite(qty) && (input.kind === "correction" ? qty >= 0 : qty > 0) && qty <= 1_000_000;
  if (!validKind || !validQty) return { ok: false, error: "invalid" };

  // La fonction n'est ouverte qu'à la clé serveur : l'appartenance du produit
  // à la boutique est vérifiée par la fonction elle-même (p_business).
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };
  const { data, error } = await admin.rpc("apply_stock_movement", {
    p_business: me.businessId,
    p_product: input.productId,
    p_kind: input.kind,
    p_qty: Math.floor(qty),
    p_order: null,
    p_note: input.note?.slice(0, 200) ?? null,
    p_actor: me.userId,
  });
  if (error) {
    // Fonction absente : la migration 5 n'a pas encore été exécutée.
    if (/apply_stock_movement|function|schema cache/i.test(error.message)) return { ok: false, error: "migration" };
    console.error("recordStockMovement:", error.message);
    return { ok: false, error: "failed" };
  }

  revalidatePath("/stok");
  revalidatePath("/katalog");
  return { ok: true, qtyAfter: (data as number | null) ?? null };
}
