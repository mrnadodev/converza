import type { DesignLayoutConfig } from "./platform-config";

// Niveaux de design de la vitrine : design1 (Gratis), design2 (Pro),
// design3 (Premium). Ce que chaque niveau affiche dépend du type de commerce
// (lib/storefront-designs) ; ce fichier ne règle que l'accès selon le plan.
//
// Les clés restent celles déjà enregistrées en base pour ne pas casser les
// vitrines existantes.

export type LayoutKey = "design1" | "design2" | "design3";
type PlanTier = "gratis" | "pro" | "premium";

export interface StorefrontLayout {
  key: LayoutKey;
  minPlan: PlanTier;
}

export const STOREFRONT_LAYOUTS: StorefrontLayout[] = [
  { key: "design1", minPlan: "gratis" },
  { key: "design2", minPlan: "pro" },
  { key: "design3", minPlan: "premium" },
];

/** Disposition de repli, toujours disponible quel que soit le plan. */
export const DEFAULT_LAYOUT: LayoutKey = "design1";

const RANK: Record<string, number> = { gratis: 0, qr_express: 0, pro: 1, premium: 2 };

export function isLayoutKey(value: unknown): value is LayoutKey {
  return STOREFRONT_LAYOUTS.some((l) => l.key === value);
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
