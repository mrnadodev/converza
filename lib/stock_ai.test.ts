import { describe, expect, it } from "vitest";
import { analyzeStockRisk } from "./stock_ai";
import type { Product } from "./types";

describe("stock_ai", () => {
  it("détecte les produits en ba_stok et propose un réapprovisionnement", () => {
    const products: Product[] = [
      {
        id: "p1",
        business_id: "b1",
        name: "Robe Soirée Satin",
        category: "Rad",
        price_cents: 450000,
        currency: "HTG",
        unit: "inite",
        stock_qty: 2,
        stock_threshold: 5,
        stock_state: "ba_stok",
        photo_url: null,
        sold_count: 20,
        is_active: true,
      },
    ];

    const alerts = analyzeStockRisk(products);
    expect(alerts.length).toBe(1);
    expect(alerts[0].productName).toBe("Robe Soirée Satin");
    expect(alerts[0].supplierRecommendation).toBeDefined();
    expect(alerts[0].supplierRecommendation?.depositName).toContain("Dépôt");
  });

  it("ne génère pas d'alerte pour un produit avec du stock suffisant", () => {
    const products: Product[] = [
      {
        id: "p2",
        business_id: "b1",
        name: "Kola Couronne",
        category: "Bwason",
        price_cents: 5000,
        currency: "HTG",
        unit: "boutèy",
        stock_qty: 50,
        stock_threshold: 5,
        stock_state: "en_stok",
        photo_url: null,
        sold_count: 10,
        is_active: true,
      },
    ];

    const alerts = analyzeStockRisk(products);
    expect(alerts.length).toBe(0);
  });
});
