"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { planOf } from "@/lib/plans";

export async function submitPayment(input: { plan: string; payMethod: string; payRef: string }) {
  if (!hasSupabase()) return { ok: true, demo: true };
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Ou pa konekte" };
  const { data: member } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { ok: false, error: "Pa gen biznis" };

  const plan = planOf(input.plan);
  const { error } = await sb.from("subscription_payments").insert({
    business_id: member.business_id,
    plan: plan.key,
    amount_cents: plan.priceGdes * 100,
    pay_method: input.payMethod,
    pay_ref: input.payRef.trim() || null,
    status: "pending",
  });
  return { ok: !error, error: error?.message };
}
