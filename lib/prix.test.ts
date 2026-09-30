import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compterPromos, prixEffectif } from "./prix";
import type { Product } from "./types";

// Un prix barré qui ne correspond pas à ce qui sera facturé est un mensonge
// imprimé sur la vitrine du marchand. Ces tests gardent la règle unique.

const MAINTENANT = new Date("2026-09-30T12:00:00Z");
const dans = (heures: number) => new Date(MAINTENANT.getTime() + heures * 3_600_000).toISOString();

const produit = (p: Partial<Product>): Product => ({
  id: "p",
  business_id: "b",
  name: "Article",
  category: null,
  price_cents: 200000,
  currency: "HTG",
  unit: null,
  stock_qty: 3,
  stock_state: "en_stok",
  photo_url: null,
  photos: [],
  sold_count: 0,
  is_active: true,
  ...p,
});

describe("le prix qu'on affiche et qu'on facture", () => {
  it("sans promo, le prix normal, et rien à barrer", () => {
    const r = prixEffectif(produit({}), MAINTENANT);
    expect(r).toEqual({ cents: 200000, enPromo: false, ancienCents: null, remisePourcent: 0 });
  });

  it("avec une promo en cours, le nouveau prix et l'ancien barré", () => {
    const r = prixEffectif(produit({ promo_price_cents: 150000 }), MAINTENANT);
    expect(r.cents).toBe(150000);
    expect(r.enPromo).toBe(true);
    expect(r.ancienCents).toBe(200000);
    expect(r.remisePourcent).toBe(25);
  });

  it("une promo au même prix, ou plus chère, n'en est pas une", () => {
    // Le piège classique : gonfler l'« ancien prix » pour inventer un rabais.
    // Le client ne verra rien de barré plutôt qu'un faux rabais.
    expect(prixEffectif(produit({ promo_price_cents: 200000 }), MAINTENANT).enPromo).toBe(false);
    expect(prixEffectif(produit({ promo_price_cents: 250000 }), MAINTENANT).enPromo).toBe(false);
    expect(prixEffectif(produit({ promo_price_cents: 250000 }), MAINTENANT).cents).toBe(200000);
  });

  it("une valeur absurde est ignorée, le prix normal tient", () => {
    // Rien ne doit pouvoir faire tomber un produit à zéro par accident.
    for (const v of [null, undefined, -100, NaN, Infinity] as unknown[]) {
      const r = prixEffectif(produit({ promo_price_cents: v as number }), MAINTENANT);
      expect(r.cents, `valeur ${String(v)}`).toBe(200000);
      expect(r.enPromo).toBe(false);
    }
  });

  it("les colonnes absentes ne cassent rien", () => {
    // Tant que la migration 15 n'est pas jouée, les champs n'existent pas.
    const r = prixEffectif({ price_cents: 200000 }, MAINTENANT);
    expect(r.cents).toBe(200000);
    expect(r.enPromo).toBe(false);
  });
});

describe("la fin d'une promo", () => {
  it("sans date de fin, elle court jusqu'à ce que le marchand l'enlève", () => {
    expect(prixEffectif(produit({ promo_price_cents: 150000, promo_ends_at: null }), MAINTENANT).enPromo).toBe(true);
  });

  it("une date passée rend le prix normal", () => {
    const r = prixEffectif(produit({ promo_price_cents: 150000, promo_ends_at: dans(-1) }), MAINTENANT);
    expect(r.cents).toBe(200000);
    expect(r.enPromo).toBe(false);
    expect(r.ancienCents).toBeNull();
  });

  it("une date encore à venir la laisse courir", () => {
    expect(prixEffectif(produit({ promo_price_cents: 150000, promo_ends_at: dans(1) }), MAINTENANT).enPromo).toBe(true);
  });

  it("une date illisible arrête la promo au lieu de la laisser courir", () => {
    // Une remise qui ne s'éteint jamais coûte de l'argent réel au marchand ;
    // une remise arrêtée trop tôt se remet en un clic.
    expect(prixEffectif(produit({ promo_price_cents: 150000, promo_ends_at: "demain" }), MAINTENANT).enPromo).toBe(false);
  });
});

describe("l'arrondi de la remise affichée", () => {
  it("annonce un pourcentage juste", () => {
    expect(prixEffectif(produit({ price_cents: 100000, promo_price_cents: 90000 }), MAINTENANT).remisePourcent).toBe(10);
    expect(prixEffectif(produit({ price_cents: 100000, promo_price_cents: 50000 }), MAINTENANT).remisePourcent).toBe(50);
  });

  it("n'annonce jamais −100 % sur un produit encore payant", () => {
    // 1 centime sur 200 000 arrondirait à 100 % si on arrondissait à l'envers.
    const r = prixEffectif(produit({ price_cents: 200000, promo_price_cents: 1 }), MAINTENANT);
    expect(r.remisePourcent).toBeLessThanOrEqual(100);
    expect(r.cents).toBe(1);
  });
});

describe("le décompte des promos", () => {
  it("compte les produits en promo et visibles", () => {
    const liste = [
      produit({ promo_price_cents: 150000 }),
      produit({ promo_price_cents: 150000, is_active: false }),
      produit({}),
      produit({ promo_price_cents: 150000, promo_ends_at: dans(-1) }),
    ];
    expect(compterPromos(liste, MAINTENANT)).toBe(1);
  });

  it("rend zéro sans se plaindre sur un catalogue vide", () => {
    expect(compterPromos([], MAINTENANT)).toBe(0);
  });
});

describe("le prix facture suit le prix affiche", () => {
  // La vitrine peut afficher ce qu elle veut : ce qui engage le marchand est
  // la ligne de commande ecrite par le serveur. Si elle repart de
  // `price_cents`, le client paie le tarif plein apres avoir vu un rabais, et
  // le marchand decouvre le probleme par une reclamation.
  const source = readFileSync(join(__dirname, "..", "app", "p", "actions.ts"), "utf8");

  it("la ligne de commande passe par prixEffectif", () => {
    expect(source).toContain("unit_price_cents: prixEffectif(p).cents");
  });

  it("aucune ligne de commande ne repart du prix plein", () => {
    expect(source).not.toMatch(/unit_price_cents:\s*p\.price_cents/);
  });

  it("le serveur relit le prix en base, jamais celui envoye par le client", () => {
    // Sans ca, n importe qui pourrait commander a 1 HTG en modifiant la
    // requete. Le commentaire le dit deja ; ce test l empeche de devenir faux.
    expect(source).toMatch(/from\("products"\)[\s\S]{0,200}price_cents/);
  });
});
