// Ouvert ou fermé, et quand la réponse viendra.
//
// Un marchand seul ne peut pas répondre à 22 h. Le client, lui, ne voit qu'un
// silence : il ne sait pas s'il a été lu, ni quand il le sera. Sans réponse, il
// écrit ailleurs. Une attente annoncée n'est pas une attente subie.
//
// L'heure est celle de l'appareil du client, pas du serveur. C'est la même
// heure que celle du marchand — ils sont dans le même pays — et c'est celle que
// le client lit sur son téléphone en ouvrant la vitrine.

export interface Horaires {
  /** « 07:00 », ou « 07:00:00 » tel que PostgreSQL le renvoie. */
  opensAt?: string | null;
  closesAt?: string | null;
  /** Jours travaillés au format Date.getDay() : 0 = dimanche … 6 = samedi. */
  openDays?: number[] | null;
}

export type EtatBoutique =
  | { connu: false }
  | { connu: true; ouvert: true }
  /** Fermée : `reouvreDans` porte le délai en minutes, `jour` le décalage en jours. */
  | { connu: true; ouvert: false; reouvreA: string; jours: number };

/** « 07:30:00 » → 450 minutes depuis minuit. Null si la valeur est inutilisable. */
export function minutesDe(heure: string | null | undefined): number | null {
  if (!heure) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(heure.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 450 → « 07:30 ». */
export function formatHeure(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * État de la boutique à un instant donné.
 *
 * Renvoie `{ connu: false }` tant que le marchand n'a pas renseigné ses heures :
 * mieux vaut ne rien dire que d'affirmer « ouvert » sans le savoir. Une
 * fermeture qui traverse minuit — 18 h à 2 h du matin — est traitée comme la
 * continuation de la veille, sinon un bar aurait été « fermé » en plein service.
 */
export function etatBoutique(h: Horaires, maintenant: Date = new Date()): EtatBoutique {
  const ouverture = minutesDe(h.opensAt);
  const fermeture = minutesDe(h.closesAt);
  const jours = (h.openDays ?? []).filter((j) => Number.isInteger(j) && j >= 0 && j <= 6);
  if (ouverture === null || fermeture === null || jours.length === 0) return { connu: false };

  const jour = maintenant.getDay();
  const minute = maintenant.getHours() * 60 + maintenant.getMinutes();
  const traverseMinuit = fermeture <= ouverture;

  const ouvertMaintenant = traverseMinuit
    ? // Après l'ouverture aujourd'hui, ou avant la fermeture héritée d'hier.
      (jours.includes(jour) && minute >= ouverture) || (jours.includes((jour + 6) % 7) && minute < fermeture)
    : jours.includes(jour) && minute >= ouverture && minute < fermeture;

  if (ouvertMaintenant) return { connu: true, ouvert: true };

  // Prochain jour travaillé, aujourd'hui compris si l'ouverture est à venir.
  for (let d = 0; d < 8; d++) {
    const candidat = (jour + d) % 7;
    if (!jours.includes(candidat)) continue;
    if (d === 0 && minute >= ouverture) continue;
    return { connu: true, ouvert: false, reouvreA: formatHeure(ouverture), jours: d };
  }
  return { connu: false };
}
