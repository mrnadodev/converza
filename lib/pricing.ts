import { loadPlans } from "./platform-store";

/**
 * Grille tarifaire à afficher sur les pages publiques, sous la forme
 * `{ clé de plan: prix en gourdes }`.
 *
 * Les pages de vente lisaient jusqu'ici des montants écrits en dur : changer un
 * prix dans /admin le changeait au moment de payer, mais pas dans la promesse
 * affichée juste avant.
 */
export async function getPublicPricing(): Promise<Record<string, number>> {
  const plans = await loadPlans();
  return Object.fromEntries(plans.map((p) => [p.key, p.priceGdes]));
}
