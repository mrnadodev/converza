import type { LandingCopy } from "./i18n/landing";
import type { Language } from "./i18n/translations";

// Textes de la page d'accueil modifiables depuis la console.
//
// Les textes par défaut vivent dans le code (lib/i18n/landing.ts). La console
// n'enregistre que les écarts, champ par champ, sous forme de chemins plats :
// « hero.titleLead », « faq.items.2.a ». Deux conséquences voulues :
//
// - un texte que le super-admin n'a pas touché continue de suivre le code ;
// - un chemin qui n'existe pas dans le texte par défaut est ignoré, à
//   l'enregistrement comme à l'affichage. On ne peut rien injecter d'autre
//   que du texte là où il y a déjà du texte.

export type LandingOverrides = Partial<Record<Language, Record<string, string>>>;

/** Les écrans de connexion ne font pas partie de la page d'accueil. */
const EXCLUDED_SECTIONS = new Set(["auth"]);

/**
 * Les prix affichés viennent de la configuration des abonnements
 * (console → Abonnements) : les éditer ici ne changerait rien à l'écran.
 */
const EXCLUDED_PATHS = [/^pricing\.plans\.\d+\.price$/];

/** Longueur maximale d'un texte : assez pour une réponse de FAQ, pas pour un roman. */
export const MAX_FIELD_LENGTH = 800;

export interface LandingField {
  path: string;
  section: string;
  value: string;
}

function walk(value: unknown, path: string, out: LandingField[]) {
  if (typeof value === "string") {
    const section = path.split(".")[0];
    out.push({ path, section, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}.${i}`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key, out);
  }
}

/** Tous les textes modifiables d'une langue, dans l'ordre de la page. */
export function editableFields(copy: LandingCopy): LandingField[] {
  const out: LandingField[] = [];
  walk(copy, "", out);
  return out.filter((f) => !EXCLUDED_SECTIONS.has(f.section) && !EXCLUDED_PATHS.some((re) => re.test(f.path)));
}

/** Sections dans l'ordre où elles apparaissent sur la page. */
export function editableSections(copy: LandingCopy): string[] {
  return [...new Set(editableFields(copy).map((f) => f.section))];
}

/**
 * Ne garde que des chemins modifiables, dont la valeur est du texte différent
 * de celui du code. Tout le reste est écarté sans bruit.
 */
export function sanitizeOverrides(input: Record<string, unknown>, base: LandingCopy): Record<string, string> {
  const defaults = new Map(editableFields(base).map((f) => [f.path, f.value]));
  const clean: Record<string, string> = {};
  for (const [path, raw] of Object.entries(input ?? {})) {
    if (!defaults.has(path) || typeof raw !== "string") continue;
    const value = raw.replace(/\r\n/g, "\n").trim().slice(0, MAX_FIELD_LENGTH);
    // Un champ vidé ou ramené au texte d'origine revient au code.
    if (!value || value === defaults.get(path)) continue;
    clean[path] = value;
  }
  return clean;
}

/** Applique les écarts enregistrés sur une copie des textes par défaut. */
export function applyOverrides(base: LandingCopy, overrides: Record<string, string> | undefined): LandingCopy {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const copy = structuredClone(base) as unknown as Record<string, unknown>;
  const allowed = new Set(editableFields(base).map((f) => f.path));

  for (const [path, value] of Object.entries(overrides)) {
    if (!allowed.has(path) || typeof value !== "string" || !value.trim()) continue;
    const keys = path.split(".");
    let node: Record<string, unknown> | unknown[] = copy;
    for (const key of keys.slice(0, -1)) {
      node = (node as Record<string, unknown>)[key] as Record<string, unknown>;
      if (!node || typeof node !== "object") break;
    }
    const last = keys[keys.length - 1];
    if (node && typeof node === "object" && typeof (node as Record<string, unknown>)[last] === "string") {
      (node as Record<string, unknown>)[last] = value;
    }
  }
  return copy as unknown as LandingCopy;
}
