import { describe, expect, it } from "vitest";
import { layoutAllowed, resolveLayout } from "./storefront-layouts";
import { SECTOR_DESIGNS, designFor } from "./storefront-designs";
import { DESIGN_COPY } from "./i18n/app/designs";
import { INDUSTRY_SECTORS } from "./verticals";

describe("dispositions de vitrine", () => {
  it("donne 3 designs à chaque type de commerce, de 3 ou 4 images", () => {
    for (const sector of Object.keys(INDUSTRY_SECTORS)) {
      expect(SECTOR_DESIGNS[sector], sector).toHaveLength(3);
      for (const spec of SECTOR_DESIGNS[sector]) expect([3, 4]).toContain(spec.slots);
      for (const lang of ["fr", "ht", "en"] as const) expect(DESIGN_COPY[lang][sector], `${lang} ${sector}`).toHaveLength(3);
    }
  });

  it("donne trois formes différentes dans chaque secteur", () => {
    for (const [sector, specs] of Object.entries(SECTOR_DESIGNS)) {
      expect(new Set(specs.map((s) => s.shape)).size, sector).toBe(3);
    }
  });

  it("met la Vedette en design Pro du commerce", () => {
    expect(designFor("commerce_vente", "design2").shape).toBe("hero3");
    expect(designFor("secteur inconnu", "design1")).toEqual(designFor("commerce_vente", "design1"));
  });

  it("ramène une ancienne valeur ou une valeur inconnue à la grille", () => {
    expect(resolveLayout("auto", "premium")).toBe("design1");
    expect(resolveLayout(null, "pro")).toBe("design1");
    expect(resolveLayout("n'importe quoi", "premium")).toBe("design1");
  });

  it("respecte le plan du marchand", () => {
    expect(resolveLayout("design2", "gratis")).toBe("design1");
    expect(resolveLayout("design2", "pro")).toBe("design2");
    expect(resolveLayout("design3", "pro")).toBe("design1");
    expect(resolveLayout("design3", "premium")).toBe("design3");
  });

  it("suit la configuration de la console super-admin", () => {
    const config = [
      { key: "design2" as const, name: "", tag: "", minPlanRequired: "gratis" as const, enabled: true },
      { key: "design3" as const, name: "", tag: "", minPlanRequired: "gratis" as const, enabled: false },
    ];
    expect(layoutAllowed("design2", "gratis", config)).toBe(true);
    expect(layoutAllowed("design3", "premium", config)).toBe(false);
  });

  it("garde toujours la grille disponible", () => {
    const config = [{ key: "design1" as const, name: "", tag: "", minPlanRequired: "premium" as const, enabled: false }];
    expect(resolveLayout("design1", "gratis", config)).toBe("design1");
  });
});
