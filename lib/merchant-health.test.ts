import { describe, expect, it } from "vitest";
import { merchantIssues, worstLevel, type HealthInput } from "./merchant-health";

const NOW = Date.UTC(2026, 8, 18);
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

// Boutique en bon état : rien à signaler.
const healthy: HealthInput = {
  products: 12,
  orders: 30,
  lastOrderAt: daysAgo(1),
  createdAt: daysAgo(90),
  plan: "pro",
  planUntil: daysAgo(-20),
  phone: "+50931000000",
  coverUrl: "https://exemple/cover.jpg",
  deliveryZones: [{ name: "Delmas", fee_cents: 5000 }],
  hasPayMethod: true,
  trackedProducts: 12,
  productsWithCost: 12,
  lastSignInAt: daysAgo(1),
};

const codes = (m: Partial<HealthInput>) => merchantIssues({ ...healthy, ...m }, NOW).map((i) => i.code);

describe("diagnostic d'un compte marchand", () => {
  it("ne signale rien sur une boutique saine", () => {
    expect(codes({})).toEqual([]);
    expect(worstLevel(merchantIssues(healthy, NOW))).toBeNull();
  });

  it("signale ce qui empêche de vendre", () => {
    expect(codes({ products: 0 })).toContain("noProducts");
    expect(codes({ hasPayMethod: false })).toContain("noPayMethod");
    expect(codes({ phone: "  " })).toContain("noPhone");
    expect(codes({ planUntil: daysAgo(3) })).toContain("planExpired");
    expect(worstLevel(merchantIssues({ ...healthy, products: 0 }, NOW))).toBe("blocker");
  });

  it("ne signale pas d'abonnement expiré sur le plan gratuit", () => {
    expect(codes({ plan: "gratis", planUntil: daysAgo(3) })).not.toContain("planExpired");
  });

  it("laisse une semaine à une nouvelle boutique avant de parler de commandes", () => {
    expect(codes({ orders: 0, lastOrderAt: null, createdAt: daysAgo(2) })).not.toContain("noOrders");
    expect(codes({ orders: 0, lastOrderAt: null, createdAt: daysAgo(20) })).toContain("noOrders");
  });

  it("repère une boutique qui décroche", () => {
    expect(codes({ lastOrderAt: daysAgo(30) })).toContain("stale");
    expect(codes({ lastSignInAt: daysAgo(40) })).toContain("neverSignedIn");
    expect(codes({ lastSignInAt: null })).not.toContain("neverSignedIn");
  });

  it("signale les chiffres faussés, sans bloquer", () => {
    const stock = merchantIssues({ ...healthy, trackedProducts: 0 }, NOW).find((i) => i.code === "noStock");
    expect(stock?.level).toBe("info");
    expect(codes({ productsWithCost: 0 })).toContain("noCosts");
  });

  it("met la suspension en premier", () => {
    const issues = merchantIssues({ ...healthy, suspendedAt: daysAgo(1) }, NOW);
    expect(issues[0].code).toBe("suspended");
    expect(worstLevel(issues)).toBe("blocker");
  });
});
