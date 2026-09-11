import { describe, expect, it } from "vitest";
import { translations, LANGUAGE_OPTIONS, type Language } from "./translations";
import { LANDING_COPY } from "./landing";

const LANGS: Language[] = ["fr", "ht", "en"];

/** Chemins de toutes les feuilles d'un objet, ex. "hero.badge" ou "how.steps.0.title". */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => leafPaths(item, prefix ? `${prefix}.${i}` : String(i)));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

function leafAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc === undefined || acc === null) return undefined;
    return (acc as Record<string, unknown>)[part];
  }, root);
}

describe("dictionnaire de l'application", () => {
  const frPaths = leafPaths(translations.fr);

  it("expose les trois langues annoncées dans le sélecteur", () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.code).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) expect(translations[lang]).toBeDefined();
  });

  it.each(["ht", "en"] as const)("%s couvre toutes les clés du français", (lang) => {
    const missing = frPaths.filter((p) => leafAt(translations[lang], p) === undefined);
    expect(missing, `clés absentes en ${lang}`).toEqual([]);
  });

  it.each(["ht", "en"] as const)("%s n'ajoute aucune clé inconnue du français", (lang) => {
    const extra = leafPaths(translations[lang]).filter((p) => leafAt(translations.fr, p) === undefined);
    expect(extra, `clés en trop en ${lang}`).toEqual([]);
  });

  it.each(LANGS)("%s n'a aucune valeur vide", (lang) => {
    const empty = leafPaths(translations[lang]).filter((p) => {
      const v = leafAt(translations[lang], p);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `valeurs vides en ${lang}`).toEqual([]);
  });
});

describe("textes des pages publiques", () => {
  const frPaths = leafPaths(LANDING_COPY.fr);

  it.each(["ht", "en"] as const)("%s couvre toutes les clés du français", (lang) => {
    const missing = frPaths.filter((p) => leafAt(LANDING_COPY[lang], p) === undefined);
    expect(missing, `clés absentes en ${lang}`).toEqual([]);
  });

  it.each(["ht", "en"] as const)("%s a des listes de même longueur que le français", (lang) => {
    const fr = LANDING_COPY.fr;
    const other = LANDING_COPY[lang];
    expect(other.hero.trust).toHaveLength(fr.hero.trust.length);
    expect(other.how.steps).toHaveLength(fr.how.steps.length);
    expect(other.pipeline.columns).toHaveLength(fr.pipeline.columns.length);
    expect(other.message.points).toHaveLength(fr.message.points.length);
    expect(other.features.items).toHaveLength(fr.features.items.length);
    expect(other.faq.items).toHaveLength(fr.faq.items.length);
    expect(other.pricing.plans).toHaveLength(fr.pricing.plans.length);
    other.pricing.plans.forEach((plan, i) => {
      expect(plan.features, `plan ${i} en ${lang}`).toHaveLength(fr.pricing.plans[i].features.length);
    });
    expect(other.footer.productLinks).toHaveLength(fr.footer.productLinks.length);
    expect(other.footer.companyLinks).toHaveLength(fr.footer.companyLinks.length);
  });

  it.each(LANGS)("%s n'a aucune valeur vide", (lang) => {
    const empty = leafPaths(LANDING_COPY[lang]).filter((p) => {
      const v = leafAt(LANDING_COPY[lang], p);
      return typeof v === "string" && v.trim() === "";
    });
    expect(empty, `valeurs vides en ${lang}`).toEqual([]);
  });

  it.each(LANGS)("%s annonce les mêmes tarifs que les autres langues", (lang) => {
    // Les prix sont des faits, pas de la traduction : ils doivent être
    // identiques d'une langue à l'autre, sinon la page promet deux montants.
    const prices = LANDING_COPY[lang].pricing.plans.map((p) => p.price.replace(/\s| | /g, ""));
    const reference = LANDING_COPY.fr.pricing.plans.map((p) => p.price.replace(/\s| | /g, ""));
    expect(prices).toEqual(reference);
  });

  it.each(LANGS)("%s garde le message WhatsApp aligné sur le total affiché", (lang) => {
    // Le message reproduit ce que le produit génère : les lignes doivent
    // s'additionner au total annoncé, dans chaque langue.
    const text = LANDING_COPY[lang].message.text;
    const amounts = [...text.matchAll(/(\d[\d\s  ]*)\s*HTG/g)].map((m) =>
      parseInt(m[1].replace(/[\s  ]/g, ""), 10),
    );
    expect(amounts.length, `montants trouvés en ${lang}`).toBe(4);
    const [a, b, delivery, total] = amounts;
    expect(a + b + delivery, `somme en ${lang}`).toBe(total);
  });
});
