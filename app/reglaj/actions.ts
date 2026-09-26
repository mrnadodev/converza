"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, setBusinessOverride } from "@/lib/data";
import { getMemberPermissions } from "@/lib/auth";
import type { DeliveryZone } from "@/lib/types";
import { loadPlatformSettings } from "@/lib/platform-store";
import { resolveLayout } from "@/lib/storefront-layouts";
import { effectivePlan } from "@/lib/plans";

export interface BusinessInput {
  name: string;
  business_type: string;
  employees_count: string;
  theme: string;
  layout: string;
  phone_e164: string;
  hours: string;
  /** Horaires structures (migration 12) : « 07:00 », ou vide si non renseigne. */
  opens_at?: string;
  closes_at?: string;
  open_days?: number[];
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
  /** Refus d'apparaître sur la page d'accueil de CONVERZA (migration 9). */
  showcase_opt_out?: boolean;
  /**
   * Inscription à l'annuaire public (migration 11), vraie par défaut.
   *
   * Distincte de `showcase_opt_out` : l'une place la boutique sur la page
   * d'accueil, devant de futurs marchands ; l'autre la rend trouvable par un
   * acheteur qui cherche un produit. Les confondre aurait forcé un choix que
   * le marchand n'a pas à faire.
   */
  listed?: boolean;
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

  // Le plan limite les dispositions : l'interface grise celles qui ne sont pas
  // incluses, le serveur ne se fie pas à elle.
  const [{ data: current }, { designs }] = await Promise.all([
    sb.from("businesses").select("plan, plan_until, phone_e164").eq("id", member.business_id).maybeSingle(),
    loadPlatformSettings(),
  ]);
  payload.layout = resolveLayout(input.layout, effectivePlan(current?.plan, current?.plan_until), designs);
  // Le numéro enregistré reçoit les commandes : il ne change que par une
  // demande vérifiée (/chanje-nimewo). La base applique la même règle.
  if (current?.phone_e164) payload.phone_e164 = current.phone_e164;

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

  if (typeof input.showcase_opt_out === "boolean") {
    const { error: showcaseError } = await sb
      .from("businesses")
      .update({ showcase_opt_out: input.showcase_opt_out })
      .eq("id", member.business_id);
    // Colonne absente : la migration 9 n'est pas passée, le choix attendra.
    if (showcaseError && !/showcase_opt_out|column|schema cache/i.test(showcaseError.message)) {
      console.warn("showcase_opt_out:", showcaseError.message);
    }
    revalidatePath("/accueil");
  }

  if (typeof input.listed === "boolean") {
    const { error: listedError } = await sb
      .from("businesses")
      .update({ listed: input.listed })
      .eq("id", member.business_id);
    // Colonne absente : la migration 11 n'est pas passée, le choix attendra.
    if (listedError && !/listed|column|schema cache/i.test(listedError.message)) {
      console.warn("listed:", listedError.message);
    }
    revalidatePath("/boutik");
  }

  // Horaires structurés (migration 12). Écrits à part pour la même raison que
  // les deux réglages précédents : tant que la migration n'est pas passée, les
  // colonnes n'existent pas, et les mêler au reste ferait échouer la
  // sauvegarde entière — le marchand perdrait son adresse en réglant ses
  // heures.
  if (input.opens_at !== undefined || input.closes_at !== undefined || input.open_days !== undefined) {
    const heure = (v: string | undefined) => (v && /^\d{2}:\d{2}$/.test(v) ? v : null);
    const jours = (input.open_days ?? []).filter((j) => Number.isInteger(j) && j >= 0 && j <= 6);
    const { error: horairesError } = await sb
      .from("businesses")
      .update({
        opens_at: heure(input.opens_at),
        closes_at: heure(input.closes_at),
        open_days: jours,
      })
      .eq("id", member.business_id);
    if (horairesError && !/opens_at|closes_at|open_days|column|schema cache/i.test(horairesError.message)) {
      console.warn("horaires:", horairesError.message);
    }
  }

  revalidatePath("/reglaj");
  revalidatePath("/komand");
  revalidatePath("/fakti");
  revalidatePath("/");
  return { ok: true };
}
