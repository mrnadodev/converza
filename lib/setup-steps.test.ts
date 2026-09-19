import { describe, expect, it } from "vitest";
import { canSell, isFreshShop, setupProgress, setupSteps, type SetupInput } from "./setup-steps";

const shop = (over: Partial<SetupInput> = {}): SetupInput => ({
  activeProducts: 0,
  coverUrl: null,
  logoUrl: null,
  hasPayMethod: false,
  deliveryZones: 0,
  orders: 0,
  ...over,
});

describe("premiers pas d'une boutique", () => {
  it("ne coche rien sur une boutique qui vient d'être créée", () => {
    const steps = setupSteps(shop());
    expect(isFreshShop(steps)).toBe(true);
    expect(setupProgress(steps)).toMatchObject({ done: 0, total: 5 });
    expect(setupProgress(steps).next?.key).toBe("products");
  });

  it("propose d'abord ce qui empêche de vendre", () => {
    // Le catalogue est fait, mais aucun moyen de paiement : c'est le blocage.
    const steps = setupSteps(shop({ activeProducts: 3, deliveryZones: 0 }));
    expect(setupProgress(steps).next?.key).toBe("payments");
  });

  it("garde le partage pour la fin, une fois la boutique prête", () => {
    const steps = setupSteps(shop({ activeProducts: 3, hasPayMethod: true }));
    expect(setupProgress(steps).next?.key).toBe("share");
    expect(canSell(steps)).toBe(true);
  });

  it("compte une photo de couverture ou un logo, pas les deux", () => {
    expect(setupSteps(shop({ logoUrl: "logo.png" })).find((s) => s.key === "image")?.done).toBe(true);
    expect(setupSteps(shop({ coverUrl: "cover.png" })).find((s) => s.key === "image")?.done).toBe(true);
  });

  it("considère le lien partagé dès la première commande reçue", () => {
    const steps = setupSteps(shop({ orders: 1 }));
    expect(steps.find((s) => s.key === "share")?.done).toBe(true);
    expect(isFreshShop(steps)).toBe(false);
  });

  it("ne dit pas qu'une boutique peut vendre tant qu'il manque l'essentiel", () => {
    expect(canSell(setupSteps(shop({ activeProducts: 3 })))).toBe(false);
    expect(canSell(setupSteps(shop({ hasPayMethod: true })))).toBe(false);
  });

  it("boutique complète : plus rien à proposer", () => {
    const steps = setupSteps(shop({ activeProducts: 4, coverUrl: "c.png", hasPayMethod: true, deliveryZones: 2, orders: 6 }));
    const progress = setupProgress(steps);
    expect(progress).toMatchObject({ done: 5, total: 5, next: null });
    expect(canSell(steps)).toBe(true);
  });
});
