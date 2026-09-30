import { describe, expect, it } from "vitest";
import { countNew, isNew, NOUVEAU_JOURS } from "./nouveautes";
import type { Product } from "./types";

// Un repère « nouveau » qui se trompe est pire que pas de repère : il fait
// passer pour récent ce qui traîne depuis un mois, et le client cesse d'y
// croire.

const MAINTENANT = new Date("2026-09-30T12:00:00Z");
const ilYA = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

const produit = (created_at: string | undefined, actif = true): Product => ({
  id: "p",
  business_id: "b",
  name: "Article",
  category: null,
  price_cents: 1000,
  currency: "HTG",
  unit: null,
  stock_qty: 3,
  stock_state: "en_stok",
  photo_url: null,
  photos: [],
  sold_count: 0,
  is_active: actif,
  created_at,
});

describe("ce qui compte comme nouveau", () => {
  it("un produit posé aujourd'hui l'est", () => {
    expect(isNew(produit(ilYA(0)), MAINTENANT)).toBe(true);
  });

  it("la veille du septième jour l'est encore, le huitième non", () => {
    // La limite est celle qu'on annonce : sept jours, pas « environ une semaine ».
    expect(isNew(produit(ilYA(NOUVEAU_JOURS - 0.1)), MAINTENANT)).toBe(true);
    expect(isNew(produit(ilYA(NOUVEAU_JOURS + 0.1)), MAINTENANT)).toBe(false);
  });

  it("un produit sans date ne l'est pas", () => {
    // Les produits d'avant la colonne, et ceux importés en masse.
    expect(isNew(produit(undefined), MAINTENANT)).toBe(false);
    expect(isNew(produit(""), MAINTENANT)).toBe(false);
    expect(isNew(produit("pas une date"), MAINTENANT)).toBe(false);
  });

  it("une date dans l'avenir ne l'est pas non plus", () => {
    // Horloge mal réglée ou import daté à la main : sans ce garde-fou, le
    // produit resterait « nouveau » indéfiniment.
    const demain = new Date(MAINTENANT.getTime() + 86_400_000).toISOString();
    expect(isNew(produit(demain), MAINTENANT)).toBe(false);
  });
});

describe("décompte pour le bandeau", () => {
  it("compte les nouveautés visibles", () => {
    const liste = [produit(ilYA(1)), produit(ilYA(3)), produit(ilYA(40))];
    expect(countNew(liste, MAINTENANT)).toBe(2);
  });

  it("ignore un produit retiré de la vitrine", () => {
    // Annoncer une nouveauté que le client ne peut pas voir le ferait chercher
    // pour rien.
    const liste = [produit(ilYA(1)), produit(ilYA(1), false)];
    expect(countNew(liste, MAINTENANT)).toBe(1);
  });

  it("rend zéro sur un catalogue ancien, sans se plaindre", () => {
    expect(countNew([produit(ilYA(90)), produit(undefined)], MAINTENANT)).toBe(0);
    expect(countNew([], MAINTENANT)).toBe(0);
  });
});
