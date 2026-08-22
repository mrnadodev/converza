import { describe, it, expect } from "vitest";
import { formatMoney, toCents, orderTotalCents } from "./money";

describe("formatMoney", () => {
  it("formate des centimes HTG", () => {
    expect(formatMoney(59000)).toBe("590 HTG");
  });
  it("gère les décimales", () => {
    expect(formatMoney(59050)).toBe("590,5 HTG");
  });
});

describe("toCents", () => {
  it("convertit gourdes -> centimes", () => {
    expect(toCents("590")).toBe(59000);
    expect(toCents("590,50")).toBe(59050);
  });
});

describe("orderTotalCents", () => {
  it("somme les items + livraison", () => {
    const total = orderTotalCents(
      [
        { unitPriceCents: 18000, qty: 3 }, // 540 HTG
        { unitPriceCents: 15500, qty: 2 }, // 310 HTG
      ],
      5000, // livraison 50 HTG
    );
    expect(total).toBe(90000); // 900 HTG
  });
});
