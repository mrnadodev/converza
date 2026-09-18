// Changement de numéro WhatsApp d'une boutique, après validation CONVERZA.
//
// Côté client, le message reste neutre : on annonce un nouveau numéro, jamais
// un piratage. Le bandeau dure peu (le marchand choisit 3, 7 ou 14 jours) ;
// ensuite une mention discrète reste jusqu'à 30 jours après le changement.

export const PHONE_CHANGE_REASONS = ["piratage", "perte", "autre"] as const;
export type PhoneChangeReason = (typeof PHONE_CHANGE_REASONS)[number];

export const NOTICE_DAY_OPTIONS = [3, 7, 14] as const;
export const DEFAULT_NOTICE_DAYS = 7;
/** Durée de la mention discrète après le changement. */
export const MENTION_DAYS = 30;

export const MAX_PROOFS = 4;
export const MAX_DOC_BYTES = 8 * 1024 * 1024;

export interface PhoneChangeRequest {
  id: string;
  business_id: string;
  old_phone_e164: string | null;
  new_phone_e164: string;
  reason: PhoneChangeReason;
  note: string | null;
  notice_days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
}

const DAY_MS = 86_400_000;

/**
 * Ce que la vitrine affiche : un bandeau, une mention discrète, ou rien.
 */
export function phoneNoticeState(
  b: { phone_changed_at?: string | null; phone_notice_until?: string | null },
  now: number = Date.now(),
): "banner" | "mention" | null {
  if (!b.phone_changed_at) return null;
  const changed = new Date(b.phone_changed_at).getTime();
  if (Number.isNaN(changed) || now < changed) return null;
  if (b.phone_notice_until && now < new Date(b.phone_notice_until).getTime()) return "banner";
  if (now < changed + MENTION_DAYS * DAY_MS) return "mention";
  return null;
}

/** « +509 ••• 3232 » : assez pour reconnaître l'ancien numéro, pas pour le recopier. */
export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  const country = digits.startsWith("509") && digits.length > 8 ? "+509 " : "";
  return `${country}••• ${digits.slice(-4)}`;
}

/** Numéro saisi → format E.164, avec +509 par défaut pour un numéro local à 8 chiffres. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 8) return `+509${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = (a ?? "").replace(/\D/g, "");
  const db = (b ?? "").replace(/\D/g, "");
  return da !== "" && da === db;
}
