import { describe, expect, it } from "vitest";
import { INDUSTRY_SECTORS } from "./verticals";
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

  it("propose des catégories traduites dans chaque secteur", () => {
    // Les listes d'origine n'existaient qu'en créole (commerce, restauration)
    // ou qu'en français (les neuf autres). Aucun secteur ne doit rester dans
    // une seule langue : un marchand verrait la langue de quelqu'un d'autre.
    for (const sector of Object.values(INDUSTRY_SECTORS)) {
      const fr = categoriesFor(sector.label, "fr").map((c) => c.label);
      const ht = categoriesFor(sector.label, "ht").map((c) => c.label);
      expect(fr.length, sector.id).toBeGreaterThan(0);
      expect(fr, `${sector.id} n'est pas traduit`).not.toEqual(ht);
    }
  });

  it("détaille la mode même pour une boutique au type générique", () => {
    // Une « Boutique en ligne » qui vend des chaussures ne pouvait choisir
    // qu'un « Vêtements & chaussures » fourre-tout : ni le marchand ni son
    // client ne savaient si l'article était pour homme, femme ou enfant.
    const labels = categoriesFor("Boutique en ligne", "fr").map((c) => c.label);
    expect(labels).toContain("Homme · Chaussures");
    expect(labels).toContain("Femme · Vêtements");
    expect(labels).toContain("Enfant · Accessoires");
    expect(labels, "le fourre-tout ne doit plus être proposé").not.toContain("Vêtements & chaussures");
    // Les autres rayons du commerce restent là.
    expect(labels).toContain("Promotions");
    expect(labels).toContain("Électronique");
  });

  it("reconnaît encore l'ancien libellé porté par des produits existants", () => {
    expect(categoryLabel("Vêtements & chaussures", "ht")).toBe("Rad & Soulye");
  });

  it("traduit les catégories des secteurs de services", () => {
    expect(categoriesFor("Agence immobilière", "ht").map((c) => c.label)).toContain("Apatman pou lwe");
    expect(categoriesFor("Garage automobile", "en").map((c) => c.label)).toContain("Engine parts");
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

  it("reconnaît les anciennes écritures d'une catégorie", () => {
    // Des produits portent encore l'orthographe d'origine des listes.
    expect(categoryLabel("Espaces Commercial", "fr")).toBe("Espaces commerciaux");
    expect(categoryLabel("Coaching 1-on-1", "ht")).toBe("Akonpayman endividyèl");
  });

  it("laisse intacte une catégorie écrite par le marchand", () => {
    expect(categoryLabel("Sacs en cuir de Jacmel", "fr")).toBe("Sacs en cuir de Jacmel");
  });

  it("rend une chaîne vide quand il n'y a pas de catégorie", () => {
    expect(categoryLabel(null, "fr")).toBe("");
    expect(categoryLabel("   ", "fr")).toBe("");
  });
});
