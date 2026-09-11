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
  // Le pipeline utilise `konfime_peman` ; `peye` n'est que l'ancien libellé.
  // Sans les deux, `paid_at` ne serait jamais renseigné et les rapports de
  // trésorerie resteraient vides.
  if (status === "konfime_peman" || status === "peye") patch.paid_at = new Date().toISOString();
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

  // À la livraison, on incrémente le compteur de ventes (best-sellers).
  if (status === "livre") {
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
