import { describe, expect, it } from "vitest";
import { translations, LANGUAGE_OPTIONS, type Language } from "./translations";
import { LANDING_COPY } from "./landing";
import { STOREFRONT_COPY } from "./storefront";
import { COMMON_COPY } from "./app/common";
import { DASHBOARD_COPY } from "./app/dashboard";
import { ORDERS_COPY } from "./app/orders";
import { MESSAGE_COPY } from "./app/messages";
import { CATALOG_COPY } from "./app/catalog";
import { STOCK_COPY } from "./app/stock";
import { CUSTOMERS_COPY } from "./app/customers";
import { TEAM_COPY } from "./app/team";
import { SETTINGS_COPY } from "./app/settings";
import { INVOICE_COPY } from "./app/invoice";
import { REPORT_COPY } from "./app/reports";
import { ADMIN_COPY } from "./app/admin";
import { PHONE_COPY } from "./app/phone";
import { DESIGN_COPY } from "./app/designs";
import { POSTER_COPY } from "./app/poster";
import { KES_COPY } from "./app/kes";
import { TRACKING_COPY } from "./tracking";
import { LEGAL_COPY } from "./legal";

// Dictionnaires des écrans de l'application marchand : chaque nouvel écran
// traduit s'ajoute ici pour hériter des contrôles de parité.
const APP_DICTS: Record<string, Record<Language, object>> = {
  common: COMMON_COPY,
  dashboard: DASHBOARD_COPY,
  orders: ORDERS_COPY,
  messages: MESSAGE_COPY,
  catalog: CATALOG_COPY,
  stock: STOCK_COPY,
  customers: CUSTOMERS_COPY,
  team: TEAM_COPY,
  settings: SETTINGS_COPY,
  invoice: INVOICE_COPY,
  reports: REPORT_COPY,
  admin: ADMIN_COPY,
  phone: PHONE_COPY,
  designs: DESIGN_COPY,
  poster: POSTER_COPY,
  kes: KES_COPY,
  tracking: TRACKING_COPY,
  legal: LEGAL_COPY,
};

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

describe.each(Object.entries(APP_DICTS))("écran %s de l'application", (_name, dict) => {
  const frPaths = leafPaths(dict.fr);

  it.each(["ht", "en"] as const)("%s a exactement les clés du français", (lang) => {
    const missing = frPaths.filter((p) => leafAt(dict[lang], p) === undefined);
    const extra = leafPaths(dict[lang]).filter((p) => leafAt(dict.fr, p) === undefined);
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it.each(LANGS)("%s n'a aucune valeur vide et garde les mêmes types", (lang) => {
    const problems = frPaths.filter((p) => {
      const v = leafAt(dict[lang], p);
      if (typeof v !== typeof leafAt(dict.fr, p)) return true;
      return typeof v === "string" && v.trim() === "";
    });
    expect(problems).toEqual([]);
  });
});

describe("textes de la vitrine publique", () => {
  const frPaths = leafPaths(STOREFRONT_COPY.fr);

  it.each(["ht", "en"] as const)("%s couvre toutes les clés du français", (lang) => {
    const missing = frPaths.filter((p) => leafAt(STOREFRONT_COPY[lang], p) === undefined);
    expect(missing, `clés absentes en ${lang}`).toEqual([]);
  });

  it.each(["fr", "ht", "en"] as const)("%s ne contient aucun libellé de maquette", (lang) => {
    // Garde-fou contre le retour des libellés de conception vus par les clients.
    const text = JSON.stringify(STOREFRONT_COPY[lang]);
    expect(text).not.toMatch(/rectangle|héros|capsule|square|full-width|design \d/i);
  });

  it.each(["fr", "ht", "en"] as const)("%s produit un message de commande complet", (lang) => {
    const m = STOREFRONT_COPY[lang].message;
    expect(m.greeting("Ti Boutik")).toContain("Ti Boutik");
    expect(m.interested("Ti Boutik")).toContain("Ti Boutik");
    expect(m.table("5")).toContain("5");
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
