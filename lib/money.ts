// Argent stocké en centimes (bigint) côté DB ; formaté ici pour l'affichage.

export type Currency = "HTG" | "USD";

/** 590_00 centimes HTG -> "590 HTG". Sépare les milliers. */
export function formatMoney(cents: number, currency: Currency = "HTG"): string {
  const value = cents / 100;
  const s = value.toLocaleString("fr-HT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${s} ${currency}`;
}

/** "590" ou "590.50" (gourdes) -> 59000 centimes. */
export function toCents(amount: number | string): number {
  const n = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/** Somme d'une commande : items + livraison, en centimes. */
export function orderTotalCents(
  items: { unitPriceCents: number; qty: number }[],
  deliveryFeeCents = 0,
): number {
  const sub = items.reduce((acc, it) => acc + Math.round(it.unitPriceCents * it.qty), 0);
  return sub + deliveryFeeCents;
}
