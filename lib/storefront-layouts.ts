import type { DesignLayoutConfig } from "./platform-config";

// Dispositions de la vitrine publique : la section « mis en avant » affiche
// exactement le nombre d'images de la disposition choisie, rien de plus. Le
// reste des produits se trouve dans le catalogue complet.
//
// Les clés restent celles déjà enregistrées en base (design1…3) pour ne pas
// casser les vitrines existantes.

export type LayoutKey = "design1" | "design2" | "design3";
type PlanTier = "gratis" | "pro" | "premium";

export interface StorefrontLayout {
  key: LayoutKey;
  /** Nombre de produits mis en avant. */
  slots: 3 | 4;
  minPlan: PlanTier;
}

export const STOREFRONT_LAYOUTS: StorefrontLayout[] = [
  { key: "design1", slots: 4, minPlan: "gratis" }, // Grille : 4 cartes égales
  { key: "design2", slots: 3, minPlan: "pro" }, // Vedette : 1 grande + 2
  { key: "design3", slots: 4, minPlan: "premium" }, // Mosaïque : 1 grande + 3
];

/** Disposition de repli, toujours disponible quel que soit le plan. */
export const DEFAULT_LAYOUT: LayoutKey = "design1";

const RANK: Record<string, number> = { gratis: 0, qr_express: 0, pro: 1, premium: 2 };

export function isLayoutKey(value: unknown): value is LayoutKey {
  return STOREFRONT_LAYOUTS.some((l) => l.key === value);
}

export function layoutSlots(key: LayoutKey): number {
  return STOREFRONT_LAYOUTS.find((l) => l.key === key)?.slots ?? 4;
}

/**
 * Plan minimal d'une disposition et son activation. La console super-admin
 * peut les modifier ; sans configuration on garde les valeurs du code.
 */
export function layoutRule(key: LayoutKey, config?: DesignLayoutConfig[] | null) {
  const base = STOREFRONT_LAYOUTS.find((l) => l.key === key)!;
  // La disposition de repli reste ouverte à tous : il en faut une.
  if (key === DEFAULT_LAYOUT) return { minPlan: "gratis" as PlanTier, enabled: true };
  const stored = config?.find((d) => d.key === key);
  return {
    minPlan: (stored?.minPlanRequired ?? base.minPlan) as PlanTier,
    enabled: stored?.enabled ?? true,
  };
}

export function layoutAllowed(key: LayoutKey, plan: string | null | undefined, config?: DesignLayoutConfig[] | null): boolean {
  const rule = layoutRule(key, config);
  if (!rule.enabled) return false;
  return (RANK[(plan ?? "gratis").toLowerCase()] ?? 0) >= RANK[rule.minPlan];
}

/**
 * Disposition réellement affichée. Une valeur héritée (« auto », vide) ou une
 * disposition que le plan ne couvre plus, après une rétrogradation par
 * exemple, retombe sur la grille.
 */
export function resolveLayout(
  requested: string | null | undefined,
  plan: string | null | undefined,
  config?: DesignLayoutConfig[] | null,
): LayoutKey {
  if (isLayoutKey(requested) && layoutAllowed(requested, plan, config)) return requested;
  return DEFAULT_LAYOUT;
}
