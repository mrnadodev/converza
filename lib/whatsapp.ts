// ============================================================
// Cœur de CONVERZA : générer des liens wa.me pré-remplis.
// Aucune API WhatsApp payante — on ouvre le WhatsApp du marchand
// avec le message déjà écrit. Gratuit, zéro risque de bannissement.
// ============================================================

/**
 * Normalise un numéro haïtien vers le format international sans "+"
 * attendu par wa.me. Gère : +509 xxxx xxxx, 509xxxxxxxx, et le local 8 chiffres.
 */
export function normalizePhoneHT(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");
  if (digits.startsWith("509")) return digits;          // déjà préfixé
  if (digits.length === 8) return "509" + digits;       // numéro local haïtien
  return digits;                                        // autre pays / déjà complet
}

/** Vrai si le numéro ressemble à un numéro joignable sur WhatsApp. */
export function isValidWaPhone(input: string): boolean {
  const d = normalizePhoneHT(input);
  return d.length >= 10 && d.length <= 15;
}

/** Construit un lien https://wa.me/<num>?text=<message>. */
export function waMeLink(phone: string, message = ""): string {
  const p = normalizePhoneHT(phone);
  const base = `https://wa.me/${p}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Remplit un modèle de message avec des variables {kle}.
 * Ex: fillTemplate("Bonjou {non}, total la se {total}", {non:"Wideline", total:"590 HTG"})
 */
export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
