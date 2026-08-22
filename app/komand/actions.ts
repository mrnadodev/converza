"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

// Déplace une commande d'une étape du pipeline à la suivante.
export async function moveOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabase()) return { ok: true, demo: true };

  const sb = createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "peye") patch.paid_at = new Date().toISOString();
  if (status === "livre") patch.delivered_at = new Date().toISOString();
  if (status === "swivi") patch.followed_up_at = null;

  const { error } = await sb.from("orders").update(patch).eq("id", orderId);
  revalidatePath("/komand");
  return { ok: !error };
}
