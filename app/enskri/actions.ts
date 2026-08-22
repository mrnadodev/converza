"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

export interface RegisterInput {
  businessName: string;
  businessType: string;
  employeesCount: string;
  phone: string;
  fullName: string;
  email: string;
  password: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "boutik"
  );
}

export async function registerMerchant(input: RegisterInput) {
  if (!hasSupabase()) return { ok: false, error: "Supabase pa konfigire" };
  if (!input.businessName.trim()) return { ok: false, error: "Non biznis obligatwa" };
  if (input.password.length < 6) return { ok: false, error: "Modpas la twò kout (6+)" };

  const sb = createClient();
  const { data: auth, error: aerr } = await sb.auth.signUp({
    email: input.email.trim(),
    password: input.password,
  });
  if (aerr) return { ok: false, error: aerr.message };
  if (!auth.user) return { ok: false, error: "Erè pandan kreyasyon kont" };
  if (!auth.session) {
    return { ok: false, needsConfirm: true, error: "Tcheke imèl ou pou konfime, apre konekte." };
  }

  // Slug unique
  const base = slugify(input.businessName);
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data: exists } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { data: biz, error: berr } = await sb
    .from("businesses")
    .insert({
      name: input.businessName.trim(),
      slug,
      business_type: input.businessType,
      employees_count: input.employeesCount === "" ? null : parseInt(input.employeesCount, 10) || null,
      phone_e164: input.phone.trim() || null,
    })
    .select("id")
    .single();
  if (berr || !biz) return { ok: false, error: berr?.message ?? "Erè kreyasyon biznis" };

  const { error: merr } = await sb.from("members").insert({
    business_id: biz.id,
    user_id: auth.user.id,
    full_name: input.fullName.trim() || input.email.trim(),
    role: "owner",
  });
  if (merr) return { ok: false, error: merr.message };

  return { ok: true, slug };
}
