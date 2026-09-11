import { createHmac, timingSafeEqual } from "crypto";

// Lien d'invitation d'agent.
//
// Sans signature, `/join?b=<uuid>` suffirait à rejoindre l'équipe de n'importe
// quel marchand dont on connaît l'identifiant — et donc à lire ses clients et
// ses commandes. Le jeton lie l'identifiant du business à une date d'expiration
// et à un secret serveur.

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function secret(): string {
  const s = process.env.INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!s) throw new Error("INVITE_SECRET (oswa SUPABASE_SERVICE_ROLE_KEY) pa configure");
  return s;
}

function sign(businessId: string, expiresAt: number): string {
  return createHmac("sha256", secret()).update(`${businessId}.${expiresAt}`).digest("base64url");
}

/** Jeton à placer dans le lien : `<expiration>.<signature>`. */
export function createInviteToken(businessId: string, ttlMs = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs;
  return `${expiresAt}.${sign(businessId, expiresAt)}`;
}

export function verifyInviteToken(businessId: string, token: string | null | undefined): boolean {
  if (!businessId || !token) return false;
  const [rawExp, providedSig] = token.split(".");
  const expiresAt = Number(rawExp);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  if (!providedSig) return false;

  const expected = Buffer.from(sign(businessId, expiresAt));
  const provided = Buffer.from(providedSig);
  // Comparaison à temps constant : une comparaison `===` fuit la signature
  // attendue octet par octet.
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
