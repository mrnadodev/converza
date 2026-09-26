"use server";

import { revalidatePath } from "next/cache";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCents } from "@/lib/money";
import { logAppError } from "@/lib/app-errors";

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
    await logAppError({ scope: "stock.movement", message: error.message, businessId: me.businessId, userId: me.userId, details: { kind: input.kind } });
    return { ok: false, error: "failed" };
  }

  revalidatePath("/stok");
  revalidatePath("/katalog");
  return { ok: true, qtyAfter: (data as number | null) ?? null };
}

/**
 * Réception de marchandise : l'achat, ses lignes, l'entrée en stock et le
 * nouveau prix d'achat de chaque produit, en une seule transaction
 * (record_purchase, db/migrate-2026-6-gestion.sql).
 */
export async function recordPurchase(input: {
  supplierId: string | null;
  newSupplier: string;
  items: { productId: string; qty: number; unitCost: string }[];
  paid: string;
  payMethod: string;
  note: string;
  receivedOn: string;
}): Promise<{ ok: true } | { ok: false; error: StockMovementError }> {
  if (!hasSupabase()) return { ok: true };

  const me = await getMemberContext();
  const permissions = await getMemberPermissions();
  if (!me || (permissions && !permissions.canEditStock)) return { ok: false, error: "forbidden" };

  const items = input.items
    .map((it) => ({ product_id: it.productId, qty: Math.floor(Number(it.qty)), unit_cost_cents: toCents(it.unitCost) }))
    .filter((it) => it.product_id && it.qty > 0 && it.unit_cost_cents >= 0);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.receivedOn) ? input.receivedOn : null;
  if (items.length === 0 || items.length !== input.items.length || !date) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };

  // Nouveau fournisseur saisi à la volée : on le crée, ou on reprend celui du
  // même nom (contrainte d'unicité par boutique).
  let supplierId = input.supplierId;
  const name = input.newSupplier.trim().slice(0, 80);
  if (!supplierId && name) {
    const { data, error } = await admin
      .from("suppliers")
      .upsert({ business_id: me.businessId, name }, { onConflict: "business_id,name" })
      .select("id")
      .single();
    if (error) return { ok: false, error: /suppliers/.test(error.message) ? "migration" : "failed" };
    supplierId = data.id;
  }

  const { error } = await admin.rpc("record_purchase", {
    p_business: me.businessId,
    p_supplier: supplierId,
    p_items: items,
    p_paid_cents: Math.max(toCents(input.paid) || 0, 0),
    p_pay_method: input.payMethod.slice(0, 40) || null,
    p_note: input.note.slice(0, 200),
    p_received_on: date,
    p_actor: me.userId,
  });
  if (error) {
    if (/record_purchase|function|schema cache/i.test(error.message)) return { ok: false, error: "migration" };
    await logAppError({ scope: "stock.purchase", message: error.message, businessId: me.businessId, userId: me.userId, details: { lines: items.length } });
    return { ok: false, error: "failed" };
  }

  revalidatePath("/stok");
  revalidatePath("/katalog");
  revalidatePath("/kes");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Fournisseurs
//
// La table existait depuis la migration 6, avec un telephone et une note, mais
// l application ne s en servait que comme liste deroulante dans le formulaire
// de reception : un nom, rien d autre. Le stockiste qui voulait recommander
// devait chercher le numero ailleurs — sur un carnet, dans ses messages.
// ---------------------------------------------------------------------------

export type SupplierError = "forbidden" | "invalid" | "migration" | "failed" | "duplicate";

/** Cree un fournisseur, ou met a jour celui dont l identifiant est fourni. */
export async function saveSupplier(input: {
  id?: string | null;
  name: string;
  phone: string;
  note: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: SupplierError }> {
  if (!hasSupabase()) return { ok: true, id: "demo" };

  const me = await getMemberContext();
  const permissions = await getMemberPermissions();
  if (!me || (permissions && !permissions.canManageSuppliers)) return { ok: false, error: "forbidden" };

  const name = input.name.trim().slice(0, 80);
  if (!name) return { ok: false, error: "invalid" };

  // Le numero sert a ouvrir WhatsApp : on garde les chiffres et le « + ».
  const phone = input.phone.trim().replace(/[^\d+]/g, "").slice(0, 20) || null;
  const note = input.note.trim().slice(0, 300) || null;

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };

  // Le filtre business_id borne l ecriture : un identifiant d une autre
  // boutique ne modifie rien, meme s il est devine.
  if (input.id) {
    const { data, error } = await admin
      .from("suppliers")
      .update({ name, phone_e164: phone, note })
      .eq("id", input.id)
      .eq("business_id", me.businessId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : /suppliers/.test(error.message) ? "migration" : "failed" };
    if (!data) return { ok: false, error: "forbidden" };
    revalidatePath("/stok");
    return { ok: true, id: data.id };
  }

  const { data, error } = await admin
    .from("suppliers")
    .insert({ business_id: me.businessId, name, phone_e164: phone, note })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "duplicate" };
    await logAppError({ scope: "stock.supplier", message: error.message, businessId: me.businessId });
    return { ok: false, error: /suppliers/.test(error.message) ? "migration" : "failed" };
  }
  revalidatePath("/stok");
  return { ok: true, id: data.id };
}

/**
 * Retire un fournisseur de l annuaire.
 *
 * Les receptions deja enregistrees ne disparaissent pas : leur `supplier_id`
 * passe a null (la cle etrangere le prevoit). L historique d achat reste donc
 * lisible, seul le contact s en va.
 */
export async function deleteSupplier(id: string): Promise<{ ok: true } | { ok: false; error: SupplierError }> {
  if (!hasSupabase()) return { ok: true };

  const me = await getMemberContext();
  const permissions = await getMemberPermissions();
  if (!me || (permissions && !permissions.canManageSuppliers)) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };

  const { error } = await admin.from("suppliers").delete().eq("id", id).eq("business_id", me.businessId);
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/stok");
  return { ok: true };
}