import { describe, expect, it } from "vitest";
import { analyzeStockRisk } from "./stock_ai";
import type { Product } from "./types";

function product(patch: Partial<Product>): Product {
  return {
    id: "p",
    business_id: "b1",
    name: "Produit",
    category: "Rad",
    price_cents: 450000,
    currency: "HTG",
    unit: "inite",
    stock_qty: 50,
    stock_threshold: 5,
    stock_state: "en_stok",
    photo_url: null,
    sold_count: 0,
    is_active: true,
    ...patch,
  };
}

describe("stock_ai", () => {
  it("signale un produit sous le seuil sans inventer de fournisseur", () => {
    const alerts = analyzeStockRisk([product({ id: "p1", name: "Robe Soirée Satin", stock_qty: 2, stock_state: "ba_stok" })]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toEqual({
      productId: "p1",
      productName: "Robe Soirée Satin",
      currentStock: 2,
      stockThreshold: 5,
      soldOut: false,
    });
  });

  it("ne génère pas d'alerte pour un produit avec du stock suffisant", () => {
    expect(analyzeStockRisk([product({ stock_qty: 50 })])).toHaveLength(0);
  });

  it("ignore les produits dont le stock n'est pas suivi", () => {
    expect(analyzeStockRisk([product({ stock_qty: null })])).toHaveLength(0);
  });

  it("place les ruptures avant les stocks faibles", () => {
    const alerts = analyzeStockRisk([
      product({ id: "low", stock_qty: 3 }),
      product({ id: "out", stock_qty: 0 }),
    ]);
    expect(alerts.map((a) => a.productId)).toEqual(["out", "low"]);
    expect(alerts[0].soldOut).toBe(true);
  });
});
