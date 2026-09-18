import { describe, expect, it } from "vitest";
import { periodStart } from "./kes-period";

describe("périodes de la Kès (heure d'Haïti)", () => {
  it("commence la journée à minuit à Port-au-Prince, heure d'été", () => {
    // 18 sept. 2026, 02:30 UTC = 17 sept., 22:30 à Port-au-Prince (UTC-4).
    const { iso, date } = periodStart("day", new Date("2026-09-18T02:30:00Z"));
    expect(date).toBe("2026-09-17");
    expect(iso).toBe("2026-09-17T00:00:00-04:00");
  });

  it("utilise UTC-5 en hiver", () => {
    const { iso } = periodStart("day", new Date("2026-01-15T15:00:00Z"));
    expect(iso).toBe("2026-01-15T00:00:00-05:00");
  });

  it("fait commencer la semaine le lundi", () => {
    // Vendredi 18 sept. 2026 → lundi 14 sept.
    expect(periodStart("week", new Date("2026-09-18T15:00:00Z")).date).toBe("2026-09-14");
    // Un lundi reste lui-même.
    expect(periodStart("week", new Date("2026-09-14T15:00:00Z")).date).toBe("2026-09-14");
    // Un dimanche remonte au lundi précédent.
    expect(periodStart("week", new Date("2026-09-20T15:00:00Z")).date).toBe("2026-09-14");
  });

  it("fait commencer le mois le 1er", () => {
    expect(periodStart("month", new Date("2026-09-18T15:00:00Z")).date).toBe("2026-09-01");
  });
});
