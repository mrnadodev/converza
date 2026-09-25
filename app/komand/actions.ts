"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { PIPELINE_COLUMNS, type OrderStatus } from "@/lib/types";

const MOVABLE: OrderStatus[] = [...PIPELINE_COLUMNS, "anile"];

// Déplace une commande d'une étape du pipeline à la suivante.
export async function moveOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabase()) return { ok: true, demo: true };

  if (!MOVABLE.includes(status)) return { ok: false, error: "Etap la pa valab" };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };

  // Les verrous par colonne existaient uniquement dans l'interface : une
  // caissière pouvait déplacer n'importe quelle commande en appelant l'action
  // directement. Le profil métier est relu en base à chaque écriture.
  const permissions = await getMemberPermissions();
  if (permissions && status !== "anile" && !permissions.allowedPipelineColumns.includes(status)) {
    return { ok: false, error: "Ou pa gen dwa deplase kòmand nan etap sa a" };
  }

  const sb = createClient();
  const patch: Record<string, unknown> = { status };
  // `paid_at` n'est plus posé ici, et c'est le fond du sujet.
  //
  // Déplacer une carte dans « Paiement à confirmer » inscrivait une date de
  // paiement. Or cette colonne dit l'inverse : le paiement reste à confirmer.
  // La commande portait donc une date d'encaissement et zéro gourde reçue, et
  // le marchand la croyait réglée pendant qu'elle restait, à juste titre, dans
  // « À recouvrer ». Vu en production sur deux commandes, à un mois d'écart.
  //
  // L'ancien commentaire craignait des rapports de trésorerie vides. C'était
  // faux : le journal se remplit depuis `order_payments`, qu'un déclencheur
  // alimente dès que `amount_paid_cents` change (migration 6). Une date sans
  // montant n'y a jamais rien écrit.
  //
  // L'argent s'enregistre en un seul endroit : markOrderPaid, ci-dessous.
  if (status === "livre") patch.delivered_at = new Date().toISOString();
  if (status === "swivi") patch.followed_up_at = null;

  // Le filtre business_id complète la RLS : une commande d'un autre marchand
  // ne doit pas pouvoir être déplacée, même si une politique se relâchait.
  const { error } = await sb
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .eq("business_id", me.businessId);

  if (error) return { ok: false, error: error.message };

  // Stock et compteur de ventes sont tenus par la base (migration 5) : elle
  // décompte une commande à sa confirmation et la restitue à l'annulation.
  // Tant que la migration n'est pas passée (colonne absente), on garde
  // l'ancien comptage à la livraison.
  const { error: stockCheck } = await sb.from("orders").select("stock_applied").eq("id", orderId).maybeSingle();
  if (stockCheck && status === "livre") {
    const { data: items } = await sb.from("order_items").select("product_id, qty").eq("order_id", orderId);
    for (const it of items ?? []) {
      if (it.product_id) {
        await sb.rpc("increment_product_sold", { p_product: it.product_id, p_qty: it.qty });
      }
    }
  }

  revalidatePath("/komand");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Solde une commande : le reste dû passe à zéro.
 * L'ancien bouton « Regle dèt » ne changeait que l'affichage ; au rechargement,
 * la dette réapparaissait et le tableau de bord la comptait toujours.
 */
export async function markOrderPaid(orderId: string) {
  if (!hasSupabase()) return { ok: true, demo: true };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };

  const permissions = await getMemberPermissions();
  // Encaisser, c'est toucher à l'argent : réservé aux profils qui gèrent
  // l'étape des paiements ou le suivi des dettes.
  if (permissions && !permissions.canViewFinancialTurnover) {
    const allowed = permissions.allowedPipelineColumns;
    if (!allowed.includes("konfime_peman") && !allowed.includes("swivi")) {
      return { ok: false, error: "Ou pa gen dwa anrejistre yon pèman" };
    }
  }

  const sb = createClient();
  const { data: order } = await sb
    .from("orders")
    .select("delivery_fee_cents, order_items(qty, unit_price_cents)")
    .eq("id", orderId)
    .eq("business_id", me.businessId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Kòmand la pa jwenn" };

  const items: { qty: number; unit_price_cents: number }[] = order.order_items ?? [];
  const total =
    items.reduce((a, it) => a + Math.round(it.unit_price_cents * it.qty), 0) + (order.delivery_fee_cents ?? 0);

  const { error } = await sb
    .from("orders")
    .update({ amount_paid_cents: total, paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("business_id", me.businessId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/komand");
  revalidatePath("/");
  return { ok: true, paidCents: total };
}

/**
 * Clôture une commande suivie : elle quitte le tableau.
 * On marque la relance comme faite, ce qui la sort aussi de la vue
 * « relances dues » — sinon le suivi grossirait indéfiniment.
 */
export async function closeOrder(orderId: string) {
  if (!hasSupabase()) return { ok: true, demo: true };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };

  const permissions = await getMemberPermissions();
  if (permissions && !permissions.allowedPipelineColumns.includes("swivi")) {
    return { ok: false, error: "Ou pa gen dwa fèmen kòmand sa a" };
  }

  const sb = createClient();
  const { error } = await sb
    .from("orders")
    .update({ followed_up_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("business_id", me.businessId)
    .eq("status", "swivi");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/komand");
  revalidatePath("/");
  return { ok: true };
}

/** Droit d'agir sur la livraison : l'étape « en route » ou « livré ». */
async function canDeliver() {
  const me = await getMemberContext();
  if (!me) return null;
  const permissions = await getMemberPermissions();
  if (permissions && !permissions.allowedPipelineColumns.some((s) => s === "sou_wout" || s === "livre")) return null;
  return me;
}

/** Livreur d'une commande : nom et téléphone WhatsApp (vides pour retirer). */
export async function setCourier(orderId: string, name: string, phone: string) {
  if (!hasSupabase()) return { ok: true, demo: true };
  const me = await canDeliver();
  if (!me) return { ok: false, error: "forbidden" };
  const cleanPhone = phone.replace(/[^\d+]/g, "").slice(0, 20);
  const sb = createClient();
  const { error } = await sb
    .from("orders")
    .update({ courier_name: name.trim().slice(0, 60) || null, courier_phone: cleanPhone || null })
    .eq("id", orderId)
    .eq("business_id", me.businessId);
  if (error) return { ok: false, error: /courier_/.test(error.message) ? "migration" : "failed" };
  revalidatePath("/komand");
  return { ok: true };
}

/**
 * Livraison confirmée avec le code à 4 chiffres que le client donne au
 * livreur : la commande passe à « livré » seulement si le code correspond.
 */
export async function confirmDeliveryWithCode(orderId: string, code: string) {
  if (!hasSupabase()) return { ok: true, demo: true };
  const me = await canDeliver();
  if (!me) return { ok: false, error: "forbidden" };
  const sb = createClient();
  const { data: order } = await sb
    .from("orders")
    .select("security_code, status")
    .eq("id", orderId)
    .eq("business_id", me.businessId)
    .maybeSingle();
  if (!order) return { ok: false, error: "failed" };
  if (!order.security_code || code.replace(/\D/g, "") !== String(order.security_code)) return { ok: false, error: "badCode" };

  const now = new Date().toISOString();
  let { error } = await sb
    .from("orders")
    .update({ status: "livre", delivered_at: now, delivered_with_code: true })
    .eq("id", orderId)
    .eq("business_id", me.businessId);
  // Sans la migration 6, on valide quand même la livraison.
  if (error && /delivered_with_code/.test(error.message)) {
    ({ error } = await sb.from("orders").update({ status: "livre", delivered_at: now }).eq("id", orderId).eq("business_id", me.businessId));
  }
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/komand");
  revalidatePath("/");
  return { ok: true };
}
