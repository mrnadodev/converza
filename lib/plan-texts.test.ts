import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN_TEXTS, MAX_FEATURES, MAX_TEXT_LENGTH, planTexts, sanitizePlanText } from "./plan-texts";
import type { Plan } from "./plans";

const plan = (over: Partial<Plan> = {}): Plan => ({
  key: "pro",
  name: "Pro",
  priceGdes: 2500,
  tagline: "Pou biznis k ap grandi",
  features: ["Tout sa ki nan Gratis", "Pipeline + relans otomatik"],
  ...over,
});

describe("textes d'une offre par langue", () => {
  it("prend d'abord ce que la console a saisi pour cette langue", () => {
    const p = plan({ i18n: { fr: { name: "Pro+", tagline: "Pour grandir", features: ["Suivi des commandes"] } } });
    expect(planTexts(p, "fr")).toEqual({ name: "Pro+", tagline: "Pour grandir", features: ["Suivi des commandes"] });
  });

  it("retombe sur les textes du code quand la langue n'est pas saisie", () => {
    expect(planTexts(plan(), "en")).toEqual(DEFAULT_PLAN_TEXTS.en.pro);
  });

  it("garde les anciens champs comme version créole", () => {
    // Ils ont été écrits en créole avant que la console sépare les langues.
    const t = planTexts(plan(), "ht");
    expect(t.tagline).toBe("Pou biznis k ap grandi");
    expect(t.features).toEqual(["Tout sa ki nan Gratis", "Pipeline + relans otomatik"]);
  });

  it("n'utilise jamais les anciens champs pour le français ou l'anglais", () => {
    const t = planTexts(plan(), "fr");
    expect(t.tagline).toBe(DEFAULT_PLAN_TEXTS.fr.pro.tagline);
    expect(t.features).toEqual(DEFAULT_PLAN_TEXTS.fr.pro.features);
  });

  it("complète champ par champ : une accroche saisie n'efface pas les avantages", () => {
    const t = planTexts(plan({ i18n: { fr: { tagline: "Pour vendre plus" } } }), "fr");
    expect(t.tagline).toBe("Pour vendre plus");
    expect(t.features).toEqual(DEFAULT_PLAN_TEXTS.fr.pro.features);
    expect(t.name).toBe("Pro");
  });

  it("ignore une saisie vide plutôt que d'afficher un blanc", () => {
    const t = planTexts(plan({ i18n: { fr: { tagline: "   ", features: ["", "  "] } } }), "fr");
    expect(t.tagline).toBe(DEFAULT_PLAN_TEXTS.fr.pro.tagline);
    expect(t.features).toEqual(DEFAULT_PLAN_TEXTS.fr.pro.features);
  });

  it("se débrouille avec une offre inconnue du code", () => {
    const t = planTexts(plan({ key: "entreprise", name: "Entreprise", tagline: "Sur mesure", features: ["Tout"] }), "fr");
    expect(t.name).toBe("Entreprise");
  });
});

describe("saisie des textes dans la console", () => {
  it("découpe les avantages par ligne, pas par virgule", () => {
    // « Notes pour la cuisine, sans piment » est un seul avantage.
    const out = sanitizePlanText({ features: "Menu visuel\nNotes pour la cuisine, sans piment\n\n  " });
    expect(out.features).toEqual(["Menu visuel", "Notes pour la cuisine, sans piment"]);
  });

  it("accepte aussi une liste déjà découpée", () => {
    expect(sanitizePlanText({ features: ["A", " B ", ""] }).features).toEqual(["A", "B"]);
  });

  it("limite le nombre d'avantages et la longueur", () => {
    const out = sanitizePlanText({
      tagline: "t".repeat(MAX_TEXT_LENGTH + 40),
      features: Array.from({ length: MAX_FEATURES + 5 }, (_, i) => "avantage " + i),
    });
    expect(out.tagline).toHaveLength(MAX_TEXT_LENGTH);
    expect(out.features).toHaveLength(MAX_FEATURES);
  });

  it("n'enregistre que ce qui est rempli", () => {
    expect(sanitizePlanText({ name: "  ", tagline: "", features: "" })).toEqual({});
  });
});
