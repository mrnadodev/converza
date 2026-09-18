"use server";

import { revalidatePath } from "next/cache";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { hasSupabase, getMyBusiness } from "@/lib/data";
import { toCents } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/kes-period";

// Dépenses de la boutique. Réservées aux profils qui voient les chiffres
// (le propriétaire, par défaut) : une dépense touche directement au bénéfice.

export type KesError = "forbidden" | "invalid" | "migration" | "failed";

async function financeContext() {
  const me = await getMemberContext();
  const permissions = await getMemberPermissions();
  if (!me || (permissions && !permissions.canViewFinancialTurnover)) return null;
  return me;
}

export async function addExpense(input: {
  amount: string;
  category: ExpenseCategory;
  payMethod: string;
  note: string;
  spentOn: string;
}): Promise<{ ok: true } | { ok: false; error: KesError }> {
  if (!hasSupabase()) return { ok: true };
  const me = await financeContext();
  if (!me) return { ok: false, error: "forbidden" };

  const cents = toCents(input.amount);
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(input.category) ? input.category : "autre";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.spentOn) ? input.spentOn : null;
  if (!cents || cents <= 0 || cents > 1_000_000_000_00 || !date) return { ok: false, error: "invalid" };

  const business = await getMyBusiness();
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "failed" };
  const { error } = await admin.from("expenses").insert({
    business_id: me.businessId,
    amount_cents: cents,
    currency: business.default_currency ?? "HTG",
    category,
    pay_method: input.payMethod.slice(0, 40) || null,
    note: input.note.trim().slice(0, 200) || null,
    spent_on: date,
    created_by: me.userId,
  });
  if (error) {
    if (/expenses/.test(error.message) && /exist|schema cache/i.test(error.message)) return { ok: false, error: "migration" };
    console.error("addExpense:", error.message);
    return { ok: false, error: "failed" };
  }
  revalidatePath("/kes");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<{ ok: boolean }> {
  if (!hasSupabase()) return { ok: true };
  const me = await financeContext();
  const admin = createAdminClient();
  if (!me || !admin) return { ok: false };
  const { error } = await admin.from("expenses").delete().eq("id", id).eq("business_id", me.businessId);
  revalidatePath("/kes");
  return { ok: !error };
}
