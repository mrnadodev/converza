import type { Product } from "./types";

/**
 * Le prix qu'un client paie, et celui qu'on lui montre barré.
 *
 * Un prix barré est une promesse écrite. S'il ne correspond pas à ce que le
 * marchand facturera, la promesse est rompue sur chaque commande — et c'est
 * le marchand qui en répond, pas le code. Cette fonction est donc le seul
 * endroit où la question « combien ça coûte » est tranchée : la vitrine
 * l'appelle pour afficher, et le serveur l'appelle pour facturer. Deux
 * lectures séparées finiraient par diverger, et la divergence se paierait en
 * clients perdus.
 */
export interface PrixAffiche {
  /** Ce que le client paie réellement. */
  cents: number;
  enPromo: boolean;
  /** Le prix barré, seulement s'il y a vraiment une remise. */
  ancienCents: number | null;
  /** Remise arrondie, pour la pastille « −25 % ». Zéro hors promo. */
  remisePourcent: number;
}

type ProduitAvecPromo = Pick<Product, "price_cents"> &
  Partial<Pick<Product, "promo_price_cents" | "promo_ends_at">>;

function entierPositif(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/**
 * `maintenant` est un paramètre et non `new Date()` en dur : sans ça, la règle
 * ne serait testable qu'en attendant la fin d'une promo.
 */
export function prixEffectif(p: ProduitAvecPromo, maintenant: Date = new Date()): PrixAffiche {
  const base = entierPositif(p.price_cents) ?? 0;
  const normal: PrixAffiche = { cents: base, enPromo: false, ancienCents: null, remisePourcent: 0 };

  const promo = entierPositif(p.promo_price_cents);
  if (promo === null) return normal;

  // Un « ancien prix » qui n'est pas plus haut que le nouveau est un faux
  // rabais. Affiché, il trompe le client ; ici, il est simplement ignoré.
  if (promo >= base) return normal;

  if (!estEnCours(p.promo_ends_at, maintenant)) return normal;

  return {
    cents: promo,
    enPromo: true,
    ancienCents: base,
    remisePourcent: Math.round(((base - promo) / base) * 100),
  };
}

/**
 * Pas de date de fin veut dire « jusqu'à ce que le marchand l'enlève ». Une
 * date illisible arrête la promo plutôt que de la laisser courir : une remise
 * qui ne s'éteint jamais à cause d'une date mal saisie coûte de l'argent réel
 * au marchand, alors qu'une remise qui s'arrête trop tôt se remet en un clic.
 */
function estEnCours(fin: string | null | undefined, maintenant: Date): boolean {
  if (fin === null || fin === undefined || fin === "") return true;
  const t = new Date(fin).getTime();
  if (Number.isNaN(t)) return false;
  return t > maintenant.getTime();
}

/** Vrai si le marchand a une promo en cours sur au moins un produit visible. */
export function compterPromos(products: Product[], maintenant: Date = new Date()): number {
  return products.filter((p) => p.is_active && prixEffectif(p, maintenant).enPromo).length;
}
