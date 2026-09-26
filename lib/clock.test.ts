import { describe, expect, it } from "vitest";
import { DASHBOARD_COPY } from "./i18n/app/dashboard";
import type { Language } from "./i18n/translations";

const LANGUES: Language[] = ["fr", "ht", "en"];

describe("date et heure du tableau de bord", () => {
  it("chaque langue nomme ses sept jours et ses douze mois", () => {
    // Intl ne connaît pas le créole : un trou ici afficherait « undefined »
    // au marchand, ou un nom anglais sur une application en créole.
    for (const l of LANGUES) {
      const k = DASHBOARD_COPY[l].clock;
      expect(k.weekdays, l).toHaveLength(7);
      expect(k.months, l).toHaveLength(12);
      expect(k.weekdays.every((j) => j.trim().length > 0), l).toBe(true);
      expect(k.months.every((m) => m.trim().length > 0), l).toBe(true);
    }
  });

  it("les jours suivent l'ordre de Date.getDay(), dimanche en premier", () => {
    // Un décalage d'un cran afficherait « mardi » un lundi — l'application
    // garde ailleurs un tableau qui commence le lundi, d'où le risque.
    const dimanche = new Date(2026, 8, 27); // 27 septembre 2026
    expect(dimanche.getDay()).toBe(0);
    expect(DASHBOARD_COPY.fr.clock.weekdays[dimanche.getDay()]).toBe("dimanche");
    expect(DASHBOARD_COPY.ht.clock.weekdays[dimanche.getDay()]).toBe("dimanch");
    expect(DASHBOARD_COPY.en.clock.weekdays[dimanche.getDay()]).toBe("Sunday");
  });

  it("l'heure est toujours sur deux chiffres pour les minutes et les secondes", () => {
    // Sans remplissage, l'horloge changeait de largeur à chaque passage sous
    // dix et faisait sauter tout ce qui la suit.
    for (const l of LANGUES) {
      const t = DASHBOARD_COPY[l].clock.time({ h: 9, m: 5, s: 3 });
      expect(t, l).toContain(":05:03");
    }
  });

  it("le français écrit « 1er » le premier du mois, et seulement lui", () => {
    const k = DASHBOARD_COPY.fr.clock;
    expect(k.date({ weekday: "jeudi", day: 1, month: "octobre", year: 2026 })).toBe("jeudi 1er octobre 2026");
    expect(k.date({ weekday: "jeudi", day: 21, month: "octobre", year: 2026 })).toBe("jeudi 21 octobre 2026");
  });

  it("l'anglais compte les heures sur douze, minuit et midi compris", () => {
    const k = DASHBOARD_COPY.en.clock;
    expect(k.time({ h: 0, m: 0, s: 0 })).toBe("12:00:00 AM");
    expect(k.time({ h: 12, m: 0, s: 0 })).toBe("12:00:00 PM");
    expect(k.time({ h: 13, m: 7, s: 9 })).toBe("1:07:09 PM");
    expect(k.time({ h: 23, m: 59, s: 59 })).toBe("11:59:59 PM");
  });

  it("le français et le créole gardent les vingt-quatre heures", () => {
    for (const l of ["fr", "ht"] as Language[]) {
      expect(DASHBOARD_COPY[l].clock.time({ h: 0, m: 0, s: 0 }), l).toBe("00:00:00");
      expect(DASHBOARD_COPY[l].clock.time({ h: 23, m: 59, s: 59 }), l).toBe("23:59:59");
    }
  });
});
