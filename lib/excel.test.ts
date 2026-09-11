import { describe, expect, it } from "vitest";
import { generateExcelTemplate, parseBulkProducts } from "./excel";

describe("excel", () => {
  it("génère un modèle CSV compatible Excel avec le BOM UTF-8", () => {
    const template = generateExcelTemplate();
    expect(template.startsWith("\uFEFF")).toBe(true);
    expect(template).toContain("Nom du Produit");
    expect(template).toContain("Robe Soirée Satin");
  });

  it("parse correctement un fichier CSV valide", () => {
    const csvData =
      'Nom du Produit;Catégorie;Prix;Devise;Unité;Quantité en Stock\r\n"Robe Chic";"Rad";"450.00";"HTG";"inite";"15"';
    const result = parseBulkProducts(csvData, "biz-test");

    expect(result.errors.length).toBe(0);
    expect(result.products.length).toBe(1);
    expect(result.products[0].name).toBe("Robe Chic");
    expect(result.products[0].price_cents).toBe(45000);
    expect(result.products[0].stock_qty).toBe(15);
  });
});
