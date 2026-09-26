import { describe, expect, it } from "vitest";
import { etatBoutique, formatHeure, minutesDe, type Horaires } from "./horaires";

// Les horaires sont le genre de calcul où l'on se trompe sur les bords : la
// minute de fermeture, le passage de minuit, le dimanche. Un client à qui l'on
// annonce une mauvaise heure de réouverture est plus mal servi que celui à qui
// l'on ne dit rien.

const LUNDI_AU_SAMEDI = [1, 2, 3, 4, 5, 6];
/** 2026-09-28 est un lundi. */
const lundi = (h: number, m = 0) => new Date(2026, 8, 28, h, m);
const dimanche = (h: number, m = 0) => new Date(2026, 8, 27, h, m);

const JOURNEE: Horaires = { opensAt: "07:00:00", closesAt: "19:00:00", openDays: LUNDI_AU_SAMEDI };

describe("lecture des heures", () => {
  it("accepte les deux formats que renvoie PostgreSQL", () => {
    expect(minutesDe("07:30:00")).toBe(450);
    expect(minutesDe("07:30")).toBe(450);
  });

  it("refuse ce qui n'est pas une heure", () => {
    for (const brut of ["", null, undefined, "matin", "25:00", "07:99", "sept heures"]) {
      expect(minutesDe(brut), String(brut)).toBeNull();
    }
  });

  it("réécrit une heure sur deux chiffres", () => {
    expect(formatHeure(450)).toBe("07:30");
    expect(formatHeure(0)).toBe("00:00");
    expect(formatHeure(1439)).toBe("23:59");
  });
});

describe("ouvert ou fermé", () => {
  it("ne dit rien tant que les heures ne sont pas renseignées", () => {
    // Affirmer « ouvert » sans le savoir serait pire que se taire.
    expect(etatBoutique({}, lundi(10))).toEqual({ connu: false });
    expect(etatBoutique({ opensAt: "07:00" }, lundi(10))).toEqual({ connu: false });
    expect(etatBoutique({ ...JOURNEE, openDays: [] }, lundi(10))).toEqual({ connu: false });
  });

  it("ouvert pendant les heures, fermé en dehors", () => {
    expect(etatBoutique(JOURNEE, lundi(10))).toEqual({ connu: true, ouvert: true });
    expect(etatBoutique(JOURNEE, lundi(7, 0))).toEqual({ connu: true, ouvert: true });
    expect(etatBoutique(JOURNEE, lundi(18, 59))).toEqual({ connu: true, ouvert: true });
  });

  it("la minute de fermeture ferme déjà", () => {
    // 19 h pile n'est pas « encore ouvert » : c'est l'heure où l'on ferme.
    expect(etatBoutique(JOURNEE, lundi(19, 0))).toMatchObject({ ouvert: false });
  });

  it("annonce la réouverture du jour même quand il est trop tôt", () => {
    expect(etatBoutique(JOURNEE, lundi(5, 30))).toEqual({ connu: true, ouvert: false, reouvreA: "07:00", jours: 0 });
  });

  it("annonce le lendemain quand la journée est finie", () => {
    expect(etatBoutique(JOURNEE, lundi(21))).toEqual({ connu: true, ouvert: false, reouvreA: "07:00", jours: 1 });
  });

  it("saute le jour de fermeture", () => {
    // Samedi soir, fermé le dimanche : la réponse viendra lundi, dans deux jours.
    const samedi = new Date(2026, 9, 3, 20, 0);
    expect(samedi.getDay()).toBe(6);
    expect(etatBoutique(JOURNEE, samedi)).toEqual({ connu: true, ouvert: false, reouvreA: "07:00", jours: 2 });
  });

  it("un dimanche fermé renvoie au lendemain", () => {
    expect(dimanche(12).getDay()).toBe(0);
    expect(etatBoutique(JOURNEE, dimanche(12))).toEqual({ connu: true, ouvert: false, reouvreA: "07:00", jours: 1 });
  });
});

describe("une fermeture après minuit", () => {
  // 18 h → 2 h du matin. Sans traitement, un bar aurait été « fermé » en plein
  // service, et aurait annoncé une réouverture à 18 h alors qu'il servait.
  const NUIT: Horaires = { opensAt: "18:00", closesAt: "02:00", openDays: [4, 5, 6] };

  it("ouvert le soir même", () => {
    const vendredi = new Date(2026, 9, 2, 23, 0);
    expect(vendredi.getDay()).toBe(5);
    expect(etatBoutique(NUIT, vendredi)).toEqual({ connu: true, ouvert: true });
  });

  it("encore ouvert après minuit, au compte de la veille", () => {
    const samediNuit = new Date(2026, 9, 3, 1, 0);
    expect(samediNuit.getDay()).toBe(6);
    expect(etatBoutique(NUIT, samediNuit)).toEqual({ connu: true, ouvert: true });
  });

  it("fermé une fois l'heure passée", () => {
    const samediTot = new Date(2026, 9, 3, 3, 0);
    expect(etatBoutique(NUIT, samediTot)).toMatchObject({ ouvert: false, reouvreA: "18:00", jours: 0 });
  });

  it("le lundi, qui n'ouvre pas, renvoie au jeudi", () => {
    const lundiSoir = new Date(2026, 8, 28, 20, 0);
    expect(lundiSoir.getDay()).toBe(1);
    expect(etatBoutique(NUIT, lundiSoir)).toEqual({ connu: true, ouvert: false, reouvreA: "18:00", jours: 3 });
  });
});
