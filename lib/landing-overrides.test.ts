import { describe, expect, it } from "vitest";
import { LANDING_COPY } from "./i18n/landing";
import { MAX_FIELD_LENGTH, applyOverrides, editableFields, editableSections, sanitizeOverrides } from "./landing-overrides";

const fr = LANDING_COPY.fr;

describe("textes modifiables de la page d'accueil", () => {
  it("expose tous les textes de la page, sauf les écrans de connexion", () => {
    const fields = editableFields(fr);
    expect(fields.length).toBeGreaterThan(100);
    expect(fields.some((f) => f.section === "auth")).toBe(false);
    expect(fields.find((f) => f.path === "hero.titleLead")?.value).toBe(fr.hero.titleLead);
    expect(fields.find((f) => f.path === "faq.items.0.q")?.value).toBe(fr.faq.items[0].q);
  });

  it("n'expose aucun texte d'offre : ils se modifient dans les abonnements", () => {
    // Prix, noms et avantages des offres viennent de la console (lib/plan-texts.ts).
    const paths = editableFields(fr).map((f) => f.path);
    expect(paths.some((path) => path.startsWith("pricing.plans"))).toBe(false);
    expect(paths).toContain("pricing.note");
  });

  it("présente les sections dans l'ordre de la page", () => {
    const sections = editableSections(fr);
    expect(sections[0]).toBe("nav");
    expect(sections).toContain("hero");
    expect(sections.indexOf("hero")).toBeLessThan(sections.indexOf("footer"));
  });

  it("n'enregistre que ce qui diffère du texte d'origine", () => {
    const clean = sanitizeOverrides(
      {
        "hero.titleLead": "Vendez plus sur WhatsApp",
        "hero.subtitle": fr.hero.subtitle, // inchangé
        "hero.badge": "   ", // vidé : retour au texte d'origine
      },
      fr,
    );
    expect(clean).toEqual({ "hero.titleLead": "Vendez plus sur WhatsApp" });
  });

  it("refuse tout ce qui n'est pas un texte existant", () => {
    const clean = sanitizeOverrides(
      {
        "hero.inexistant": "x",
        "auth.signInTitle": "Pirate", // hors page d'accueil
        "pricing.plans.0.name": "Offre pirate", // les offres se règlent ailleurs
        "hero.titleLead": 42,
        "__proto__.polluted": "oui",
      } as Record<string, unknown>,
      fr,
    );
    expect(clean).toEqual({});
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("coupe un texte trop long", () => {
    const clean = sanitizeOverrides({ "hero.subtitle": "a".repeat(MAX_FIELD_LENGTH + 50) }, fr);
    expect(clean["hero.subtitle"]).toHaveLength(MAX_FIELD_LENGTH);
  });

  it("applique les écarts sans toucher au texte d'origine", () => {
    const out = applyOverrides(fr, { "hero.titleLead": "Nouveau titre", "faq.items.1.a": "Nouvelle réponse" });
    expect(out.hero.titleLead).toBe("Nouveau titre");
    expect(out.faq.items[1].a).toBe("Nouvelle réponse");
    expect(out.hero.subtitle).toBe(fr.hero.subtitle);
    // Le dictionnaire du code reste intact : il sert à toutes les requêtes.
    expect(fr.hero.titleLead).not.toBe("Nouveau titre");
  });

  it("ignore à l'affichage un écart devenu invalide", () => {
    const out = applyOverrides(fr, { "section.supprimee": "x", "hero.titleLead": "" });
    expect(out.hero.titleLead).toBe(fr.hero.titleLead);
  });

  it("rend le texte d'origine quand rien n'est enregistré", () => {
    expect(applyOverrides(fr, undefined)).toBe(fr);
    expect(applyOverrides(fr, {})).toBe(fr);
  });
});
