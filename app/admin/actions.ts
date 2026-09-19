"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

import { logAdminAction } from "@/lib/audit-logger";
import { logAppError } from "@/lib/app-errors";
import { nextPlanUntil } from "@/lib/plans";

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

  const { data: currentBiz } = await admin.from("businesses").select("plan, plan_until").eq("id", businessId).maybeSingle();
  const until = nextPlanUntil(currentBiz?.plan, currentBiz?.plan_until, plan);

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

import { savePlan, savePaymentInfo, savePlatformSettings, saveLegalInfo, loadLandingOverrides, saveLandingOverrides } from "@/lib/platform-store";
import { LANDING_COPY } from "@/lib/i18n/landing";
import { sanitizeOverrides } from "@/lib/landing-overrides";
import type { Language } from "@/lib/i18n/translations";

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

/**
 * Textes de la page d'accueil, pour une langue. Seuls les écarts avec le texte
 * du code sont gardés : un champ remis à l'origine recommence à suivre le code.
 */
export async function updateLandingCopy(language: Language, values: Record<string, string>) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const base = LANDING_COPY[language];
  if (!base) return { ok: false, error: "Langue inconnue" };

  const clean = sanitizeOverrides(values, base);
  const current = await loadLandingOverrides();
  const saved = await saveLandingOverrides({ ...current, [language]: clean });
  if (!saved) return { ok: false, error: "Enposib pou anrejistre" };

  await logAdminAction({
    adminEmail,
    action: "UPDATE_LANDING_COPY",
    details: { language, fields: Object.keys(clean).length },
  });
  revalidatePath("/");
  revalidatePath("/accueil");
  revalidatePath("/admin");
  return { ok: true, count: Object.keys(clean).length };
}

/**
 * Identité et coordonnées affichées dans les conditions d'utilisation et la
 * politique de confidentialité. Tant qu'elles sont vides, ces pages disent
 * qu'aucun contact n'est publié plutôt que d'afficher un faux interlocuteur.
 */
export async function updateLegalInfoConfig(input: {
  entity: string;
  email: string;
  whatsapp: string;
  address: string;
  updatedOn: string;
}) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };

  const clean = {
    entity: input.entity.trim().slice(0, 120),
    email: input.email.trim().slice(0, 160),
    whatsapp: input.whatsapp.trim().slice(0, 40),
    address: input.address.trim().slice(0, 200),
    updatedOn: /^d{4}-d{2}-d{2}$/.test(input.updatedOn.trim()) ? input.updatedOn.trim() : "",
  };
  const saved = await saveLegalInfo(clean);
  if (!saved) return { ok: false, error: "Enposib pou anrejistre" };

  await logAdminAction({ adminEmail, action: "UPDATE_LEGAL_INFO", details: clean });
  revalidatePath("/admin");
  revalidatePath("/kondisyon");
  revalidatePath("/konfidansyalite");
  revalidatePath("/accueil");
  return { ok: true };
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

// ------------------------------------------------------------------
// Changement de numéro WhatsApp
// ------------------------------------------------------------------

const DAY_MS = 86_400_000;

/**
 * Supprime les pièces justificatives : on ne garde pas une pièce d'identité
 * après la décision. Renvoie false si la suppression a échoué — dans ce cas le
 * dossier ne doit pas se déclarer purgé, et l'incident part au journal
 * technique pour que scripts/purge-verification.mjs le rattrape.
 */
async function purgePhoneDocs(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  req: { id?: string; business_id?: string; proof_paths: string[] | null; id_doc_path: string | null },
): Promise<boolean> {
  const files = [...(req.proof_paths ?? []), req.id_doc_path].filter(Boolean) as string[];
  if (files.length === 0) return true;
  const { error } = await admin.storage.from("verification").remove(files);
  if (error) {
    await logAppError({
      scope: "phone.purge",
      message: error.message,
      businessId: req.business_id ?? null,
      details: { requestId: req.id ?? null, files: files.length },
    });
    return false;
  }
  return true;
}

export async function decidePhoneChange(requestId: string, decision: "approve" | "reject", adminNote: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const { data: req } = await admin
    .from("phone_change_requests")
    .select("id, business_id, old_phone_e164, new_phone_e164, reason, notice_days, proof_paths, id_doc_path, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.status !== "pending") return { ok: false, error: "Demande introuvable ou déjà traitée" };

  const now = new Date();
  const note = adminNote.trim().slice(0, 500) || null;

  if (decision === "approve") {
    const { data: biz } = await admin.from("businesses").select("phone_e164").eq("id", req.business_id).maybeSingle();
    const { error } = await admin
      .from("businesses")
      .update({
        phone_e164: req.new_phone_e164,
        previous_phone_e164: biz?.phone_e164 ?? req.old_phone_e164,
        phone_changed_at: now.toISOString(),
        phone_notice_until: new Date(now.getTime() + req.notice_days * DAY_MS).toISOString(),
      })
      .eq("id", req.business_id);
    if (error) return { ok: false, error: error.message };
  }

  const purged = await purgePhoneDocs(admin, req);
  await admin
    .from("phone_change_requests")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      admin_email: adminEmail,
      admin_note: note,
      decided_at: now.toISOString(),
      // Les chemins ne sont effacés du dossier que si les fichiers ont vraiment
      // disparu : sinon on perdrait la trace de ce qu'il reste à supprimer.
      ...(purged ? { proof_paths: [], id_doc_path: null, docs_purged_at: now.toISOString() } : {}),
    })
    .eq("id", requestId);

  await logAdminAction({
    adminEmail,
    action: decision === "approve" ? "APPROVE_PHONE_CHANGE" : "REJECT_PHONE_CHANGE",
    targetBusinessId: req.business_id,
    // Les numéros figurent au journal : c'est la trace qui permettra de
    // retrouver qui a validé quoi en cas de contestation.
    details: { from: req.old_phone_e164, to: req.new_phone_e164, reason: req.reason, note },
  });

  revalidatePath("/admin");
  revalidatePath("/chanje-nimewo");
  return { ok: true };
}

// ------------------------------------------------------------------
// Support : suspension, accès au compte, propriété
// ------------------------------------------------------------------

/** Suspend une boutique (ou lève la suspension avec `reason` vide). */
export async function suspendMerchant(businessId: string, reason: string, suspended: boolean) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const { error } = await admin
    .from("businesses")
    .update({
      suspended_at: suspended ? new Date().toISOString() : null,
      suspended_reason: suspended ? reason.trim().slice(0, 200) || null : null,
    })
    .eq("id", businessId);
  if (error) return { ok: false, error: /suspended_at/.test(error.message) ? "migration" : error.message };

  await logAdminAction({
    adminEmail,
    action: suspended ? "SUSPEND_MERCHANT" : "UNSUSPEND_MERCHANT",
    targetBusinessId: businessId,
    details: { reason: reason.trim().slice(0, 200) },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Lien de réinitialisation du mot de passe du propriétaire.
 * Le lien est renvoyé à la console : le support l'envoie lui-même par
 * WhatsApp, sans dépendre de la boîte mail du marchand.
 */
export async function ownerRecoveryLink(businessId: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false as const, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const { data: owner } = await admin.from("members").select("user_id").eq("business_id", businessId).eq("role", "owner").maybeSingle();
  if (!owner) return { ok: false as const, error: "Pa gen mèt boutik" };
  const { data: user } = await admin.auth.admin.getUserById(owner.user_id);
  const email = user?.user?.email;
  if (!email) return { ok: false as const, error: "Pa gen imèl" };

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: site ? { redirectTo: `${site}/nouvo-modpas` } : undefined,
  });
  if (error || !data?.properties?.action_link) return { ok: false as const, error: error?.message ?? "Echèk" };

  await logAdminAction({ adminEmail, action: "RESET_PASSWORD_LINK", targetBusinessId: businessId, details: { email } });
  return { ok: true as const, link: data.properties.action_link, email };
}

/** Change l'adresse du propriétaire quand il a perdu sa boîte mail. */
export async function changeOwnerEmail(businessId: string, email: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, error: "Imèl la pa valab" };

  const { data: owner } = await admin.from("members").select("user_id").eq("business_id", businessId).eq("role", "owner").maybeSingle();
  if (!owner) return { ok: false, error: "Pa gen mèt boutik" };

  const { error } = await admin.auth.admin.updateUserById(owner.user_id, { email: clean, email_confirm: true });
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ adminEmail, action: "CHANGE_OWNER_EMAIL", targetBusinessId: businessId, details: { email: clean } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Transfère la propriété de la boutique à un autre membre de l'équipe. */
export async function transferOwnership(businessId: string, memberId: string) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return { ok: false, error: "Non otorize" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manke" };

  const { data: target } = await admin.from("members").select("id, user_id, full_name").eq("id", memberId).eq("business_id", businessId).maybeSingle();
  if (!target) return { ok: false, error: "Manm lan pa jwenn" };

  // L'ancien propriétaire devient agent : la boutique garde toujours un seul
  // propriétaire, et personne ne perd son accès.
  const { error: demote } = await admin.from("members").update({ role: "agent" }).eq("business_id", businessId).eq("role", "owner");
  if (demote) return { ok: false, error: demote.message };
  const { error } = await admin.from("members").update({ role: "owner", agent_profile: null }).eq("id", memberId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ adminEmail, action: "TRANSFER_OWNERSHIP", targetBusinessId: businessId, details: { memberId, name: target.full_name } });
  revalidatePath("/admin");
  return { ok: true };
}
