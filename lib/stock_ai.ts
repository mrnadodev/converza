import type { Product, StockState } from "./types";

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  stockThreshold: number;
  soldOut: boolean;
}

/**
 * Produits suivis en stock dont la quantité est passée sous le seuil d'alerte.
 *
 * On s'en tient à ce que le catalogue sait réellement : la quantité et le seuil
 * fixés par le marchand. Aucune estimation de date de rupture (le nombre de
 * ventes n'est pas daté) et aucun fournisseur suggéré (il n'existe pas de
 * réseau de dépôts vérifié). Les ruptures remontent en premier.
 */
export function analyzeStockRisk(products: Product[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const p of products) {
    if (p.stock_qty === null || p.stock_qty === undefined) continue;
    const threshold = p.stock_threshold ?? 5;
    const soldOut = p.stock_qty <= 0 || p.stock_state === "fini";
    if (!soldOut && p.stock_qty > threshold && p.stock_state !== "ba_stok") continue;

    alerts.push({
      productId: p.id,
      productName: p.name,
      currentStock: Math.max(p.stock_qty, 0),
      stockThreshold: threshold,
      soldOut,
    });
  }

  return alerts.sort((a, b) => Number(b.soldOut) - Number(a.soldOut) || a.currentStock - b.currentStock);
}

/**
 * État du stock déduit de la quantité : « épuisé » à zéro, « stock faible »
 * sous le seuil, « en stock » au-dessus. Il était choisi à la main dans le
 * formulaire du catalogue, si bien qu'un produit à 3 unités sous un seuil de 5
 * pouvait rester marqué « en stock » et n''apparaître dans aucune alerte.
 */
export function stockStateFor(qty: number | null | undefined, threshold = 5): StockState {
  if (qty === null || qty === undefined) return "en_stok";
  if (qty <= 0) return "fini";
  return qty <= threshold ? "ba_stok" : "en_stok";
}