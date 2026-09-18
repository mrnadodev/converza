"use server";

import { revalidatePath } from "next/cache";
import { getMemberContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_PROOFS,
  NOTICE_DAY_OPTIONS,
  PHONE_CHANGE_REASONS,
  normalizePhone,
  samePhone,
  type PhoneChangeReason,
} from "@/lib/phone-change";

// Demande de changement du numéro WhatsApp d'une boutique.
//
// Les écritures passent par la clé service role, après avoir vérifié en base
// que l'auteur est le propriétaire : un agent ne doit pas pouvoir détourner
// les commandes vers son propre numéro. Les erreurs sont renvoyées sous forme
// de code, traduit par l'écran.

export type PhoneChangeError =
  | "notOwner"
  | "noService"
  | "invalidPhone"
  | "samePhone"
  | "alreadyPending"
  | "missingId"
  | "missingProof"
  | "badFile"
  | "failed";

const BUCKET = "verification";
const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

async function ownerContext() {
  const me = await getMemberContext();
  if (!me || me.role !== "owner") return null;
  return me;
}

/**
 * Lien d'envoi signé, à usage unique, vers le dossier privé de la boutique.
 * Le fichier ne transite pas par le serveur (limite de taille des actions).
 */
export async function createUploadSlot(ext: string): Promise<{ ok: true; path: string; token: string } | { ok: false; error: PhoneChangeError }> {
  const me = await ownerContext();
  if (!me) return { ok: false, error: "notOwner" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "noService" };

  const clean = ext.toLowerCase().replace(/[^a-z]/g, "");
  if (!EXTENSIONS.has(clean)) return { ok: false, error: "badFile" };

  const path = `${me.businessId}/${crypto.randomUUID()}.${clean}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "failed" };
  return { ok: true, path: data.path, token: data.token };
}

export async function submitPhoneChange(input: {
  newPhone: string;
  reason: PhoneChangeReason;
  note: string;
  noticeDays: number;
  proofPaths: string[];
  idDocPath: string | null;
}): Promise<{ ok: true } | { ok: false; error: PhoneChangeError }> {
  const me = await ownerContext();
  if (!me) return { ok: false, error: "notOwner" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "noService" };

  const phone = normalizePhone(input.newPhone);
  if (!phone) return { ok: false, error: "invalidPhone" };
  if (!input.idDocPath) return { ok: false, error: "missingId" };

  // Les fichiers doivent venir du dossier de cette boutique, pas d'une autre.
  const ownPath = (p: string) => typeof p === "string" && p.startsWith(`${me.businessId}/`) && !p.includes("..");
  const proofs = (input.proofPaths ?? []).filter(ownPath).slice(0, MAX_PROOFS);
  if (!ownPath(input.idDocPath)) return { ok: false, error: "badFile" };
  const reason = PHONE_CHANGE_REASONS.includes(input.reason) ? input.reason : "autre";
  // Un piratage se prouve : captures du compte perdu, message de WhatsApp…
  if (reason === "piratage" && proofs.length === 0) return { ok: false, error: "missingProof" };

  const { data: biz } = await admin.from("businesses").select("phone_e164").eq("id", me.businessId).maybeSingle();
  if (samePhone(biz?.phone_e164, phone)) return { ok: false, error: "samePhone" };

  const noticeDays = (NOTICE_DAY_OPTIONS as readonly number[]).includes(input.noticeDays) ? input.noticeDays : 7;

  const { error } = await admin.from("phone_change_requests").insert({
    business_id: me.businessId,
    requested_by: me.userId,
    old_phone_e164: biz?.phone_e164 ?? null,
    new_phone_e164: phone,
    reason,
    note: input.note.trim().slice(0, 1000) || null,
    notice_days: noticeDays,
    proof_paths: proofs,
    id_doc_path: input.idDocPath,
  });
  if (error) {
    // Index unique : une demande est déjà en cours pour cette boutique.
    if (error.code === "23505") return { ok: false, error: "alreadyPending" };
    console.error("submitPhoneChange:", error.message);
    return { ok: false, error: "failed" };
  }

  revalidatePath("/chanje-nimewo");
  revalidatePath("/admin");
  return { ok: true };
}

/** Annule la demande en cours et supprime aussitôt les pièces envoyées. */
export async function cancelPhoneChange(requestId: string): Promise<{ ok: boolean }> {
  const me = await ownerContext();
  const admin = createAdminClient();
  if (!me || !admin) return { ok: false };

  const { data: req } = await admin
    .from("phone_change_requests")
    .select("id, proof_paths, id_doc_path")
    .eq("id", requestId)
    .eq("business_id", me.businessId)
    .eq("status", "pending")
    .maybeSingle();
  if (!req) return { ok: false };

  const files = [...(req.proof_paths ?? []), req.id_doc_path].filter(Boolean) as string[];
  if (files.length) await admin.storage.from(BUCKET).remove(files);
  await admin
    .from("phone_change_requests")
    .update({ status: "cancelled", decided_at: new Date().toISOString(), proof_paths: [], id_doc_path: null, docs_purged_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/chanje-nimewo");
  revalidatePath("/admin");
  return { ok: true };
}

/** Retire le bandeau de la vitrine avant la fin prévue. La mention discrète reste. */
export async function hidePhoneNotice(): Promise<{ ok: boolean }> {
  const me = await ownerContext();
  const admin = createAdminClient();
  if (!me || !admin) return { ok: false };
  await admin.from("businesses").update({ phone_notice_until: new Date().toISOString() }).eq("id", me.businessId);
  revalidatePath("/chanje-nimewo");
  return { ok: true };
}
