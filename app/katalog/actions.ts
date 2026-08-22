"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { toCents } from "@/lib/money";
import type { StockState } from "@/lib/types";

export interface ProductInput {
  id?: string;
  name: string;
  category: string;
  priceGdes: string;
  currency: "HTG" | "USD";
  unit: string;
  stockQty: string;
  stockState: StockState;
  isActive: boolean;
}

async function memberBusinessId(sb: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.business_id ?? null;
}

export async function saveProduct(input: ProductInput) {
  if (!hasSupabase()) return { ok: true, demo: true };
  if (!input.name.trim()) return { ok: false, error: "Non pwodwi a obligatwa" };

  const sb = createClient();
  const bid = await memberBusinessId(sb);
  if (!bid) return { ok: false, error: "Ou pa konekte" };

  const row = {
    business_id: bid,
    name: input.name.trim(),
    category: input.category.trim() || null,
    price_cents: toCents(input.priceGdes),
    currency: input.currency,
    unit: input.unit.trim() || null,
    stock_qty: input.stockQty === "" ? null : Math.max(0, parseInt(input.stockQty, 10) || 0),
    stock_state: input.stockState,
    is_active: input.isActive,
  };

  const res = input.id
    ? await sb.from("products").update(row).eq("id", input.id)
    : await sb.from("products").insert(row);

  revalidatePath("/katalog");
  return { ok: !res.error, error: res.error?.message };
}

export async function deleteProduct(id: string) {
  if (!hasSupabase()) return { ok: true, demo: true };
  const sb = createClient();
  const { error } = await sb.from("products").delete().eq("id", id);
  revalidatePath("/katalog");
  return { ok: !error, error: error?.message };
}
