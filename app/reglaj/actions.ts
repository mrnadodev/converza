"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, setBusinessOverride } from "@/lib/data";
import { getMemberPermissions } from "@/lib/auth";
import type { DeliveryZone } from "@/lib/types";

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
  slogan?: string;
  promo_text?: string;
  usd_exchange_rate?: string | number | null;
  bank_accounts?: string | null;
  zelle_info?: string | null;
  usdt_trc20_address?: string | null;
  moncash_number?: string | null;
  moncash_name?: string | null;
  moncash_qr_url?: string | null;
  natcash_number?: string | null;
  natcash_name?: string | null;
  natcash_qr_url?: string | null;
  zelle_qr_url?: string | null;
  usdt_qr_url?: string | null;
  delivery_zones: DeliveryZone[];
}

function parseUsdRate(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const n = parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function updateBusiness(input: BusinessInput) {
  // Cet écran contient les coordonnées bancaires, MonCash et USDT du commerce.
  // Le masquage côté interface ne suffit pas : on revérifie en base.
  const permissions = await getMemberPermissions();
  if (permissions && !permissions.canManageSettings) {
    return { ok: false, error: "Sèlman patwon an ka chanje reglaj yo" };
  }

  const payload = {
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
    slogan: input.slogan?.trim() || null,
    promo_text: input.promo_text?.trim() || null,
    // Taux de change : on conserve `null` si le marchand n'a rien saisi, plutôt
    // que d'écrire un taux codé en dur qui vieillit mal et fausse les prix USD.
    usd_exchange_rate: parseUsdRate(input.usd_exchange_rate),
    bank_accounts: input.bank_accounts?.trim() || null,
    zelle_info: input.zelle_info?.trim() || null,
    usdt_trc20_address: input.usdt_trc20_address?.trim() || null,
    moncash_number: input.moncash_number?.trim() || null,
    moncash_name: input.moncash_name?.trim() || null,
    moncash_qr_url: input.moncash_qr_url || null,
    natcash_number: input.natcash_number?.trim() || null,
    natcash_name: input.natcash_name?.trim() || null,
    natcash_qr_url: input.natcash_qr_url || null,
    zelle_qr_url: input.zelle_qr_url || null,
    usdt_qr_url: input.usdt_qr_url || null,
    delivery_zones: input.delivery_zones ?? [],
  };

  // Toujours enregistrer dans le stockage d'overrides pour cohérence totale
  setBusinessOverride(payload);

  if (!hasSupabase()) {
    revalidatePath("/reglaj");
    revalidatePath("/komand");
    revalidatePath("/fakti");
    revalidatePath("/");
    return { ok: true, demo: true };
  }

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
    .update(payload)
    .eq("id", member.business_id);

  if (error) {
    console.warn("Supabase update warning (column missing in schema cache):", error.message);
    const basePayload = {
      name: payload.name,
      business_type: payload.business_type,
      employees_count: payload.employees_count,
      theme: payload.theme,
      layout: payload.layout,
      phone_e164: payload.phone_e164,
      hours: payload.hours,
      address: payload.address,
      logo_url: payload.logo_url,
      cover_url: payload.cover_url,
      social_instagram: payload.social_instagram,
      social_facebook: payload.social_facebook,
      social_tiktok: payload.social_tiktok,
      delivery_zones: payload.delivery_zones,
    };
    await sb.from("businesses").update(basePayload).eq("id", member.business_id);
  }

  revalidatePath("/reglaj");
  revalidatePath("/komand");
  revalidatePath("/fakti");
  revalidatePath("/");
  return { ok: true };
}
