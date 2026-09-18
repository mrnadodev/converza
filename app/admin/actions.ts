"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

import { logAdminAction } from "@/lib/audit-logger";

async function requireAdmin() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user.email;
}

export async function activatePlan(paymentId: string, businessId: string, plan: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const until = new Date();
  until.setMonth(until.getMonth() + 1);

  const r1 = await admin.from("businesses").update({ plan, plan_until: until.toISOString() }).eq("id", businessId);
  const r2 = await admin.from("subscription_payments").update({ status: "confirmed" }).eq("id", paymentId);

  await logAdminAction({
    adminEmail,
    action: "ACTIVATE_PLAN",
    targetBusinessId: businessId,
    targetPaymentId: paymentId,
    details: { plan, plan_until: until.toISOString() },
  });

  revalidatePath("/admin");
  return { ok: !r1.error && !r2.error, error: r1.error?.message ?? r2.error?.message };
}

export async function setPlan(businessId: string, plan: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };
  const patch: Record<string, unknown> = { plan };
  if (plan === "gratis") {
    patch.plan_until = null;
  } else {
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    patch.plan_until = until.toISOString();
  }
  const { error } = await admin.from("businesses").update(patch).eq("id", businessId);

  await logAdminAction({
    adminEmail,
    action: "SET_PLAN",
    targetBusinessId: businessId,
    details: { plan, patch },
  });

  revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}

export async function revokePlan(businessId: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const patch = { plan: "gratis", plan_until: null };
  const { error } = await admin.from("businesses").update(patch).eq("id", businessId);

  await logAdminAction({
    adminEmail,
    action: "REVOKE_PLAN",
    targetBusinessId: businessId,
    details: { note: "Plan révoqué et remis à Gratis par le Super-Admin" },
  });

  revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}

/**
 * Prolonge l'abonnement en cours de N mois.
 * Le renouvellement repart de la date de fin quand elle est encore devant nous :
 * repartir d'aujourd'hui, comme le faisait « upgrade », effaçait les jours déjà
 * payés par le marchand.
 */
export async function renewPlan(businessId: string, months: number) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non autorisé" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquante" };
  if (!Number.isFinite(months) || months < 1 || months > 24) return { ok: false, error: "Durée invalide" };

  const { data: business } = await admin.from("businesses").select("plan, plan_until").eq("id", businessId).maybeSingle();
  if (!business) return { ok: false, error: "Marchand introuvable" };
  if ((business.plan ?? "gratis") === "gratis") return { ok: false, error: "Ce marchand est sur le plan gratuit" };

  const current = business.plan_until ? new Date(business.plan_until) : null;
  const base = current && current.getTime() > Date.now() ? current : new Date();
  const until = new Date(base);
  until.setMonth(until.getMonth() + months);

  const { error } = await admin.from("businesses").update({ plan_until: until.toISOString() }).eq("id", businessId);

  await logAdminAction({
    adminEmail,
    action: "RENEW_PLAN",
    targetBusinessId: businessId,
    details: { months, plan: business.plan, plan_until: until.toISOString() },
  });

  revalidatePath("/admin");
  return { ok: !error, error: error?.message, until: until.toISOString() };
}

export async function upgradePlan(businessId: string, targetPlan: string, months: number = 1) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const until = new Date();
  until.setMonth(until.getMonth() + months);

  const patch = { plan: targetPlan, plan_until: until.toISOString() };
  const { error } = await admin.from("businesses").update(patch).eq("id", businessId);

  await logAdminAction({
    adminEmail,
    action: "UPGRADE_PLAN",
    targetBusinessId: businessId,
    details: { targetPlan, months, plan_until: until.toISOString() },
  });

  revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}

import { savePlan, savePaymentInfo, savePlatformSettings } from "@/lib/platform-store";

export async function rejectPayment(paymentId: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };
  const { error } = await admin.from("subscription_payments").update({ status: "rejected" }).eq("id", paymentId);

  await logAdminAction({
    adminEmail,
    action: "REJECT_PAYMENT",
    targetPaymentId: paymentId,
  });

  revalidatePath("/admin");
  return { ok: !error, error: error?.message };
}

export async function updatePlanConfig(key: string, priceGdes: number, tagline: string, featuresStr: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };

  if (!Number.isFinite(priceGdes) || priceGdes < 0) return { ok: false, error: "Pri a pa valab" };

  const features = featuresStr.split(",").map((s) => s.trim()).filter(Boolean);
  const updated = await savePlan(key, { priceGdes: Math.round(priceGdes), tagline, features });
  if (!updated) return { ok: false, error: "Enposib pou anrejistre plan an" };

  await logAdminAction({
    adminEmail,
    action: "UPDATE_PLAN_CONFIG",
    details: { key, priceGdes, tagline, features },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/acceuil");
  revalidatePath("/accueil");
  revalidatePath("/abonman");
  return { ok: !!updated };
}

export async function updatePaymentInfoConfig(
  moncash: string,
  natcash: string,
  bank: string,
  zelle?: string,
  usdt?: string,
  moncash_qr_url?: string,
  natcash_qr_url?: string,
  bank_details?: any[]
) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };

  const updated = await savePaymentInfo({ moncash, natcash, bank, zelle, usdt, moncash_qr_url, natcash_qr_url, bank_details });
  if (!updated) return { ok: false, error: "Enposib pou anrejistre enfòmasyon pèman yo" };

  await logAdminAction({
    adminEmail,
    action: "UPDATE_PAYMENT_INFO",
    details: { type: "PLATFORM_PAYMENT_INFO", moncash, natcash, bank, zelle, usdt, moncash_qr_url, natcash_qr_url, bank_details },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/acceuil");
  revalidatePath("/accueil");
  revalidatePath("/abonman");
  return { ok: !!updated };
}

import { type PlatformGlobalSettings } from "@/lib/platform-config";

export async function updateGlobalSettingsAction(patch: Partial<PlatformGlobalSettings>) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };

  const updated = await savePlatformSettings(patch);
  if (!updated) return { ok: false, error: "Enposib pou anrejistre reglaj yo" };

  await logAdminAction({
    adminEmail,
    action: "UPDATE_PLATFORM_SETTINGS",
    details: { type: "GLOBAL_PLATFORM_SETTINGS", patch },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/acceuil");
  revalidatePath("/accueil");
  revalidatePath("/abonman");
  revalidatePath("/reglaj");
  return { ok: !!updated };
}

// Colonnes qu'un super-admin peut corriger sur la fiche d'un marchand. Une
// liste explicite évite qu'un patch arbitraire n'atteigne `id`, `plan` ou
// `slug` (qui ont leurs propres actions et leurs propres traces d'audit).
const MERCHANT_EDITABLE_COLUMNS = new Set([
  "name",
  "category",
  "address",
  "phone_e164",
  "hours",
  "business_type",
  "employees_count",
  "theme",
  "layout",
  "logo_url",
  "cover_url",
  "default_currency",
  "social_instagram",
  "social_facebook",
  "social_tiktok",
]);

export async function updateMerchantStructureAction(businessId: string, patch: Record<string, unknown>) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([k]) => MERCHANT_EDITABLE_COLUMNS.has(k)),
  );
  if (Object.keys(safePatch).length === 0) return { ok: false, error: "Pa gen anyen pou chanje" };

  const { error } = await admin.from("businesses").update(safePatch).eq("id", businessId);

  await logAdminAction({
    adminEmail,
    action: "UPDATE_MERCHANT",
    targetBusinessId: businessId,
    details: { patch: safePatch },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/reglaj");
  return { ok: !error, error: error?.message };
}

export async function repairMerchantDataAction(businessId: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();

  // On ne « répare » plus en collant une photo de banque d'images sur les
  // produits d'un marchand : le catalogue afficherait un article qu'il ne vend
  // pas. On se contente de normaliser les incohérences réelles (photo_url
  // absente alors que la galerie existe, et inversement).
  let repaired = 0;
  if (admin) {
    const { data: prods } = await admin
      .from("products")
      .select("id, photo_url, photos")
      .eq("business_id", businessId);
    for (const p of prods ?? []) {
      const gallery: string[] = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];
      if (!p.photo_url && gallery.length > 0) {
        await admin.from("products").update({ photo_url: gallery[0] }).eq("id", p.id);
        repaired++;
      } else if (p.photo_url && gallery.length === 0) {
        await admin.from("products").update({ photos: [p.photo_url] }).eq("id", p.id);
        repaired++;
      }
    }
  }

  await logAdminAction({
    adminEmail,
    action: "REPAIR_MERCHANT_MEDIA",
    targetBusinessId: businessId,
    details: { repaired },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, repaired };
}
