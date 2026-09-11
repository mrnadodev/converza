import type { Product } from "./types";
import { waMeLink } from "./whatsapp";

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  stockThreshold: number;
  daysRemaining: number;
  supplierRecommendation?: {
    depositName: string;
    location: string;
    phone_e164: string;
    availableStock: number;
    unitPriceCents: number;
    currency: string;
    orderHref: string;
  };
}

// Réseau simulé de dépôts/fournisseurs partenaires enregistrés sur Converza
const NETWORK_DEPOSITS = [
  {
    name: "Dépôt Central Delmas 19",
    location: "Delmas 19, Pòtoprens",
    phone_e164: "+50938445566",
    inventory: [
      { keywords: ["robe", "rad", "soirée"], qty: 50, priceCents: 350000 },
      { keywords: ["diri", "tchako", "sak"], qty: 120, priceCents: 110000 },
      { keywords: ["lwil", "mazola"], qty: 80, priceCents: 29000 },
      { keywords: ["ze"], qty: 200, priceCents: 16000 },
    ],
  },
  {
    name: "Dépôt Wholesale Pétion-Ville",
    location: "Rue Faubert, Petyonvil",
    phone_e164: "+50937112233",
    inventory: [
      { keywords: ["robe", "veste", "rad"], qty: 35, priceCents: 480000 },
      { keywords: ["kola", "bwason"], qty: 500, priceCents: 4500 },
      { keywords: ["dlo"], qty: 300, priceCents: 2000 },
    ],
  },
];

/**
 * Analyse le catalogue marchand pour identifier les ruptures imminentes et trouver des dépôts partenaires.
 */
export function analyzeStockRisk(products: Product[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const p of products) {
    if (p.stock_qty === null || p.stock_qty === undefined) continue;

    const threshold = p.stock_threshold ?? 5;
    const isLow = p.stock_qty <= threshold || p.stock_state === "ba_stok" || p.stock_state === "fini";

    if (isLow) {
      // Estimation arbitraire des jours restants basée sur le nombre de ventes passées
      const dailySalesRate = Math.max(p.sold_count / 14, 0.5); // ventes estimées/jour sur 2 semaines
      const daysRemaining = Math.max(Math.round(p.stock_qty / dailySalesRate), 0);

      // Sourcing inter-dépôts : chercher si un fournisseur partenaire possède cet article
      const lowerName = p.name.toLowerCase();
      let supplierRec: StockAlert["supplierRecommendation"] | undefined = undefined;

      for (const deposit of NETWORK_DEPOSITS) {
        const item = deposit.inventory.find((inv) =>
          inv.keywords.some((kw) => lowerName.includes(kw))
        );

        if (item && item.qty > 0) {
          const msg = `Bonjou ${deposit.name}! Mwen jwenn depo ou sou CONVERZA. Mwen ta renmen kòmande [${p.name}] an gwo. Èske li disponib toujou?`;
          const href = waMeLink(deposit.phone_e164, msg);

          supplierRec = {
            depositName: deposit.name,
            location: deposit.location,
            phone_e164: deposit.phone_e164,
            availableStock: item.qty,
            unitPriceCents: item.priceCents,
            currency: p.currency,
            orderHref: href,
          };
          break; // Prendre le 1er dépôt disponible
        }
      }

      alerts.push({
        productId: p.id,
        productName: p.name,
        currentStock: p.stock_qty,
        stockThreshold: threshold,
        daysRemaining,
        supplierRecommendation: supplierRec,
      });
    }
  }

  return alerts;
}
