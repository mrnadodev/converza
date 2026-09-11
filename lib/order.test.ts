import { describe, expect, it } from "vitest";
import {
  buildDebtReminder,
  generateOrderSecurityCode,
  getOrderSecurityCode,
} from "./order";

describe("code de sécurité de livraison", () => {
  it("tire toujours 4 chiffres", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOrderSecurityCode()).toMatch(/^\d{4}$/);
    }
  });

  it("ne produit pas toujours la même valeur", () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateOrderSecurityCode()));
    expect(seen.size).toBeGreaterThan(50);
  });

  it("préfère le code stocké en base au calcul hérité", () => {
    expect(getOrderSecurityCode("CMD-1042", "7391")).toBe("7391");
  });

  it("ignore un code stocké mal formé", () => {
    expect(getOrderSecurityCode("144", "abc")).toBe(getOrderSecurityCode("144"));
  });
});

describe("relance de dette", () => {
  it("nomme le marchand qui relance, pas la boutique de démo", () => {
    const msg = buildDebtReminder("Wideline", 900000, "HTG", "Boutik Marjorie");
    expect(msg).toContain("Boutik Marjorie");
    expect(msg).not.toContain("Ti Kòk Boutik");
  });
});
