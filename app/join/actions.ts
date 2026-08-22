"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

export interface JoinInput {
  businessId: string;
  fullName: string;
  email: string;
  password: string;
}

export async function joinBusiness(input: JoinInput) {
  if (!hasSupabase()) return { ok: false, error: "Supabase pa konfigire" };
  if (!input.businessId) return { ok: false, error: "Lyen envitasyon an pa valab" };
  if (input.password.length < 6) return { ok: false, error: "Modpas la twò kout (6+)" };

  const sb = createClient();
  const { data: auth, error: aerr } = await sb.auth.signUp({
    email: input.email.trim(),
    password: input.password,
  });
  if (aerr) return { ok: false, error: aerr.message };
  if (!auth.user) return { ok: false, error: "Erè pandan kreyasyon kont" };
  if (!auth.session) return { ok: false, needsConfirm: true, error: "Tcheke imèl ou pou konfime, apre konekte." };

  const { error: merr } = await sb.from("members").insert({
    business_id: input.businessId,
    user_id: auth.user.id,
    full_name: input.fullName.trim() || input.email.trim(),
    role: "agent",
  });
  if (merr) return { ok: false, error: merr.message };

  return { ok: true };
}
