import { describe, expect, it } from "vitest";
import { PLAN_GRACE_DAYS, effectivePlan, memberSeatsFor, nextPlanUntil } from "./plans";

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

describe("nextPlanUntil", () => {
  const now = new Date("2026-09-28T12:00:00Z");

  it("ajoute un mois à la fin en cours quand le même plan est renouvelé en avance", () => {
    // Pro jusqu'au 5 octobre, renouvelé le 28 septembre : 5 novembre, pas 28 octobre.
    const until = nextPlanUntil("pro", "2026-10-05T12:00:00Z", "pro", now);
    expect(until.toISOString().slice(0, 10)).toBe("2026-11-05");
  });

  it("repart d'aujourd'hui quand le plan est déjà échu", () => {
    const until = nextPlanUntil("pro", "2026-09-01T12:00:00Z", "pro", now);
    expect(until.toISOString().slice(0, 10)).toBe("2026-10-28");
  });

  it("repart d'aujourd'hui quand le marchand change de plan", () => {
    const until = nextPlanUntil("pro", "2026-10-05T12:00:00Z", "premium", now);
    expect(until.toISOString().slice(0, 10)).toBe("2026-10-28");
  });

  it("repart d'aujourd'hui pour un premier abonnement", () => {
    expect(nextPlanUntil("gratis", null, "pro", now).toISOString().slice(0, 10)).toBe("2026-10-28");
  });

  it("accepte plusieurs mois d'un coup", () => {
    expect(nextPlanUntil("pro", "2026-10-05T12:00:00Z", "pro", now, 3).toISOString().slice(0, 10)).toBe("2027-01-05");
  });
});

describe("nextPlanUntil ne dépend pas de l'heure d'été", () => {
  it("garde l'heure exacte en traversant le changement d'heure de novembre", () => {
    const until = nextPlanUntil("pro", "2026-10-05T13:59:16Z", "pro", new Date("2026-09-19T12:00:00Z"));
    expect(until.toISOString()).toBe("2026-11-05T13:59:16.000Z");
  });
});
