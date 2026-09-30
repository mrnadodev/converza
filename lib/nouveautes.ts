// Ce qui vient d'arriver en boutique.
//
// Un client qui revient sur une vitrine ne relit pas trente produits : il
// cherche ce qui a changé depuis la dernière fois. Sans repère, il ne voit
// rien de neuf et s'en va — alors que le marchand vient justement de recevoir.
//
// Pas de clignotement. Un contenu qui clignote peut déclencher une crise chez
// un épileptique — c'est une règle d'accessibilité, pas une préférence — et se
// lit comme une bannière publicitaire des années 2000. Un repère calme, qui
// apparaît une fois, attire autant et n'agresse personne.

import type { Product } from "./types";

/**
 * Au-delà, ce n'est plus une nouveauté.
 *
 * Sept jours : assez long pour qu'un client qui passe une fois par semaine le
 * voie, assez court pour que la mention garde son sens. À trente jours, la
 * moitié du catalogue serait « nouveau », et plus rien ne le serait.
 */
export const NOUVEAU_JOURS = 7;

const JOUR = 86_400_000;

export function isNew(p: Pick<Product, "created_at">, maintenant: Date = new Date(), jours = NOUVEAU_JOURS): boolean {
  if (!p.created_at) return false;
  const pose = Date.parse(p.created_at);
  if (!Number.isFinite(pose)) return false;
  const age = maintenant.getTime() - pose;
  // Une date dans l'avenir — horloge mal réglée, import daté à la main — ne
  // fait pas d'un produit une nouveauté éternelle.
  if (age < 0) return false;
  return age < jours * JOUR;
}

/** Combien de nouveautés visibles, pour le bandeau de la vitrine. */
export function countNew(products: Product[], maintenant: Date = new Date(), jours = NOUVEAU_JOURS): number {
  return products.filter((p) => p.is_active && isNew(p, maintenant, jours)).length;
}
