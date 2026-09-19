import { describe, expect, it } from "vitest";
import { PLAN_GRACE_DAYS, effectivePlan, memberSeatsFor } from "./plans";

// Le plan écrit en base ne disparaît pas à l'échéance : sans ce calcul, un seul
// mois payé ouvre les fonctions payantes pour toujours.
describe("effectivePlan", () => {
  const now = new Date("2026-09-18T12:00:00Z");
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();

  it("garde le plan tant que l'échéance n'est pas passée", () => {
    expect(effectivePlan("premium", days(10), now)).toBe("premium");
    expect(effectivePlan("pro", days(1), now)).toBe("pro");
  });

  it("tolère quelques jours après l'échéance, le temps de vérifier un paiement", () => {
    expect(effectivePlan("pro", days(-1), now)).toBe("pro");
    expect(effectivePlan("pro", days(-PLAN_GRACE_DAYS + 0.5), now)).toBe("pro");
  });

  it("retombe en gratuit une fois la tolérance dépassée", () => {
    expect(effectivePlan("pro", days(-PLAN_GRACE_DAYS - 1), now)).toBe("gratis");
    expect(effectivePlan("premium", days(-40), now)).toBe("gratis");
  });

  it("laisse actif un plan accordé sans échéance depuis la console", () => {
    expect(effectivePlan("premium", null, now)).toBe("premium");
    expect(effectivePlan("pro", undefined, now)).toBe("pro");
  });

  it("ne se laisse pas troubler par une date illisible ou une casse inattendue", () => {
    expect(effectivePlan("PREMIUM", "pas une date", now)).toBe("premium");
    expect(effectivePlan(null, days(-99), now)).toBe("gratis");
    expect(effectivePlan("gratis", days(-99), now)).toBe("gratis");
  });

  it("referme les sièges d'agents avec le plan", () => {
    expect(memberSeatsFor(effectivePlan("premium", days(-40), now))).toBe(1);
    expect(memberSeatsFor(effectivePlan("pro", days(5), now))).toBe(4);
    expect(memberSeatsFor(effectivePlan("premium", days(5), now))).toBeNull();
  });
});
