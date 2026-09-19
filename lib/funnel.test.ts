import { describe, expect, it } from "vitest";
import { buildFunnel, type FunnelInput } from "./funnel";

const now = new Date("2026-09-19T12:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();

const merchant = (over: Partial<FunnelInput> = {}): FunnelInput => ({
  createdAt: day(-30),
  lastSignInAt: day(-29),
  products: 4,
  orders: 3,
  paidCents: 50_000,
  plan: "pro",
  planUntil: day(20),
  firstOrderAt: day(-25),
  ...over,
});

describe("entonnoir des marchands", () => {
  it("compte chaque étape et ce qu'elle coûte", () => {
    const f = buildFunnel(
      [
        merchant(),
        merchant({ plan: "gratis", planUntil: null }), // n'a jamais payé
        merchant({ orders: 0, paidCents: 0, plan: "gratis", planUntil: null, firstOrderAt: null }), // catalogue, aucune commande
        merchant({ products: 0, orders: 0, paidCents: 0, plan: "gratis", planUntil: null, firstOrderAt: null }), // connecté, rien publié
        merchant({ lastSignInAt: null, products: 0, orders: 0, paidCents: 0, plan: "gratis", planUntil: null, firstOrderAt: null }),
      ],
      now,
    );

    expect(f.total).toBe(5);
    expect(f.steps.map((s) => [s.key, s.count])).toEqual([
      ["signup", 5],
      ["signedIn", 4],
      ["catalog", 3],
      ["firstOrder", 2],
      ["cash", 2],
      ["paying", 1],
    ]);
    expect(f.steps[2]).toMatchObject({ lost: 1, pctOfPrevious: 75, pctOfTotal: 60 });
  });

  it("désigne l'étape qui coûte le plus de marchands", () => {
    const rows = [
      merchant(),
      ...Array.from({ length: 4 }, () =>
        merchant({ products: 0, orders: 0, paidCents: 0, plan: "gratis", planUntil: null, firstOrderAt: null }),
      ),
    ];
    expect(buildFunnel(rows, now).worstStep).toBe("catalog");
  });

  it("ne laisse pas une étape être plus large que la précédente", () => {
    // Boutique qui a encaissé, mais dont le catalogue a été vidé depuis.
    const f = buildFunnel([merchant({ products: 0 })], now);
    expect(f.steps.map((s) => s.count)).toEqual([1, 1, 0, 0, 0, 0]);
  });

  it("referme l'étape payante quand l'abonnement est échu", () => {
    const f = buildFunnel([merchant({ plan: "premium", planUntil: day(-40) })], now);
    expect(f.steps[5].count).toBe(0);
    expect(f.steps[4].count).toBe(1);
  });

  it("donne le délai médian jusqu'à la première commande", () => {
    const f = buildFunnel(
      [
        merchant({ createdAt: day(-30), firstOrderAt: day(-28) }), // 2 jours
        merchant({ createdAt: day(-30), firstOrderAt: day(-20) }), // 10 jours
        merchant({ createdAt: day(-30), firstOrderAt: day(-24) }), // 6 jours
        merchant({ orders: 0, firstOrderAt: null }),
      ],
      now,
    );
    expect(f.medianDaysToFirstOrder).toBe(6);
  });

  it("groupe les inscriptions par mois, du plus récent au plus ancien", () => {
    const f = buildFunnel(
      [
        merchant({ createdAt: "2026-09-02T10:00:00Z" }),
        merchant({ createdAt: "2026-09-15T10:00:00Z", orders: 0, paidCents: 0, plan: "gratis", planUntil: null, firstOrderAt: null }),
        merchant({ createdAt: "2026-08-20T10:00:00Z" }),
      ],
      now,
    );
    expect(f.cohorts.map((c) => [c.month, c.signups, c.firstOrder])).toEqual([
      ["2026-09", 2, 1],
      ["2026-08", 1, 1],
    ]);
  });

  it("ne divise pas par zéro sur une base vide", () => {
    const f = buildFunnel([], now);
    expect(f.total).toBe(0);
    expect(f.steps.every((s) => s.count === 0 && s.pctOfTotal === 0 && s.pctOfPrevious === 0)).toBe(true);
    expect(f.medianDaysToFirstOrder).toBeNull();
    expect(f.worstStep).toBeNull();
    expect(f.cohorts).toEqual([]);
  });
});

describe("abonnés bloqués", () => {
  it("compte les abonnés qui paient sans franchir toutes les étapes", () => {
    const f = buildFunnel(
      [
        merchant({ products: 0, orders: 0, paidCents: 0, firstOrderAt: null }), // paie, boutique vide
        merchant(), // parcours complet
      ],
      now,
    );
    expect(f.steps[5].count).toBe(1);
    expect(f.payingButStalled).toBe(1);
  });

  it("ne signale personne quand chaque abonné va au bout", () => {
    expect(buildFunnel([merchant(), merchant()], now).payingButStalled).toBe(0);
  });
});

describe("délai jusqu'à la première commande", () => {
  it("compte une commande antérieure de quelques heures comme un délai nul", () => {
    const f = buildFunnel([merchant({ createdAt: day(-10), firstOrderAt: day(-10.1) })], now);
    expect(f.medianDaysToFirstOrder).toBe(0);
  });

  it("écarte un historique importé, daté bien avant l'inscription", () => {
    const f = buildFunnel([merchant({ createdAt: day(-10), firstOrderAt: day(-200) })], now);
    expect(f.medianDaysToFirstOrder).toBeNull();
  });
});
