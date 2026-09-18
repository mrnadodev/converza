import { describe, expect, it } from "vitest";
import { layoutAllowed, layoutSlots, resolveLayout } from "./storefront-layouts";

describe("dispositions de vitrine", () => {
  it("fixe 3 ou 4 images par disposition", () => {
    expect(layoutSlots("design1")).toBe(4);
    expect(layoutSlots("design2")).toBe(3);
    expect(layoutSlots("design3")).toBe(4);
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
