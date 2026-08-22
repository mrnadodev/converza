"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

export interface BusinessInput {
  name: string;
  business_type: string;
  employees_count: string;
  theme: string;
  layout: string;
  phone_e164: string;
  hours: string;
  address: string;
  logo_url: string | null;
  cover_url: string | null;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
}

export async function updateBusiness(input: BusinessInput) {
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

  const { error } = await sb
    .from("businesses")
    .update({
      name: input.name.trim(),
      business_type: input.business_type,
      employees_count: input.employees_count === "" ? null : parseInt(input.employees_count, 10) || null,
      theme: input.theme,
      layout: input.layout,
      phone_e164: input.phone_e164.trim() || null,
      hours: input.hours.trim() || null,
      address: input.address.trim() || null,
      logo_url: input.logo_url,
      cover_url: input.cover_url,
      social_instagram: input.social_instagram.trim() || null,
      social_facebook: input.social_facebook.trim() || null,
      social_tiktok: input.social_tiktok.trim() || null,
    })
    .eq("id", member.business_id);

  revalidatePath("/reglaj");
  revalidatePath("/");
  return { ok: !error, error: error?.message };
}
