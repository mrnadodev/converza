"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return isAdminEmail(user?.email) ? true : false;
}

export async function activatePlan(paymentId: string, businessId: string, plan: string) {
  if (!(await requireAdmin())) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const until = new Date();
  until.setMonth(until.getMonth() + 1);

  const r1 = await admin.from("businesses").update({ plan, plan_until: until.toISOString() }).eq("id", businessId);
  const r2 = await admin.from("subscription_payments").update({ status: "confirmed" }).eq("id", paymentId);
  revalidatePath("/admin");
  return { ok: !r1.error && !r2.error, error: r1.error?.message ?? r2.error?.message };
}

export async function rejectPayment(paymentId: string) {
  if (!(await requireAdmin())) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };
  const { error } = await admin.from("subscription_payments").update({ status: "rejected" }).eq("id", paymentId);
  revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}
