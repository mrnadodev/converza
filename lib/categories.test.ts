import { describe, expect, it } from "vitest";
import { categoriesFor, categoryLabel, isFashionShop } from "./categories";

describe("catégories proposées au marchand", () => {
  it("propose Homme, Femme et Enfant à une boutique de vêtements et chaussures", () => {
    const fr = categoriesFor("Boutique de vêtements et chaussures", "fr").map((c) => c.label);
    expect(fr).toHaveLength(9);
    expect(fr).toContain("Homme · Chaussures");
    expect(fr).toContain("Femme · Vêtements");
    expect(fr).toContain("Enfant · Accessoires");
  });

  it("traduit ces catégories", () => {
    expect(categoriesFor("Boutique de chaussures", "ht").map((c) => c.label)).toContain("Gason · Soulye");
    expect(categoriesFor("Boutique de chaussures", "en").map((c) => c.label)).toContain("Kids · Accessories");
  });

  it("reconnaît une boutique de mode, pas une pharmacie", () => {
    expect(isFashionShop("Boutique de vêtements et chaussures")).toBe(true);
    expect(isFashionShop("Vendeur TikTok")).toBe(false);
    expect(isFashionShop(null)).toBe(false);
  });

  it("propose les catégories du secteur dans la langue du site", () => {
    const fr = categoriesFor("Vendeur TikTok", "fr").map((c) => c.label);
    expect(fr).toContain("Promotions");
    expect(fr).not.toContain("Pwomo Flach");
    expect(categoriesFor("Vendeur TikTok", "ht").map((c) => c.label)).toContain("Pwomo Flach");
  });

  it("garde les suggestions d'origine pour un secteur sans liste traduite", () => {
    const labels = categoriesFor("Appartements à Louer", "fr").map((c) => c.label);
    expect(labels.length).toBeGreaterThan(0);
  });
});

describe("affichage d'une catégorie enregistrée", () => {
  it("traduit une catégorie écrite dans une autre langue", () => {
    // Les produits déjà en base portent des catégories créoles.
    expect(categoryLabel("Pwomo Flach", "fr")).toBe("Promotions");
    expect(categoryLabel("Rad & Soulye", "fr")).toBe("Vêtements & chaussures");
    expect(categoryLabel("Promotions", "ht")).toBe("Pwomo Flach");
  });

  it("ne tient pas compte de la casse", () => {
    expect(categoryLabel("pwomo flach", "en")).toBe("Deals");
  });

  it("laisse intacte une catégorie écrite par le marchand", () => {
    expect(categoryLabel("Sacs en cuir de Jacmel", "fr")).toBe("Sacs en cuir de Jacmel");
  });

  it("rend une chaîne vide quand il n'y a pas de catégorie", () => {
    expect(categoryLabel(null, "fr")).toBe("");
    expect(categoryLabel("   ", "fr")).toBe("");
  });
});
