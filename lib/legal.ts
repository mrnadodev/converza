// Identité et coordonnées de CONVERZA, telles qu'elles apparaissent dans les
// conditions d'utilisation et la politique de confidentialité.
//
// Rien n'est pré-rempli : une adresse de contact inventée dans un document
// juridique est pire que pas de document. Tant que le super-admin n'a pas saisi
// ces informations dans la console, les pages le disent au lieu d'afficher un
// faux interlocuteur.

export interface LegalInfo {
  /** Raison sociale ou nom sous lequel le service est exploité. */
  entity: string;
  /** Adresse e-mail où un marchand peut exercer ses droits. */
  email: string;
  /** Numéro WhatsApp du support, au format international. */
  whatsapp: string;
  /** Adresse postale, facultative. */
  address: string;
  /** Date de dernière mise à jour des documents (AAAA-MM-JJ). */
  updatedOn: string;
}

export const DEFAULT_LEGAL_INFO: LegalInfo = {
  entity: "",
  email: "",
  whatsapp: "",
  address: "",
  updatedOn: "",
};

/** Vrai dès qu'un marchand a au moins un moyen de nous joindre. */
export function hasLegalContact(info: LegalInfo): boolean {
  return Boolean(info.email.trim() || info.whatsapp.trim());
}

/** Fusionne ce qui est enregistré avec les valeurs par défaut. */
export function mergeLegalInfo(stored: Partial<LegalInfo> | null | undefined): LegalInfo {
  return {
    entity: (stored?.entity ?? "").trim(),
    email: (stored?.email ?? "").trim(),
    whatsapp: (stored?.whatsapp ?? "").trim(),
    address: (stored?.address ?? "").trim(),
    updatedOn: (stored?.updatedOn ?? "").trim(),
  };
}
