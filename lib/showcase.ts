// Boutiques présentées sur la page d'accueil, section « Ils vendent déjà ».
//
// La section affichait cinq cases « [LOGO] » vides : une promesse de preuve
// sans preuve. Elle montre maintenant de vraies boutiques, choisies seules.
//
// Une boutique n'y figure que si sa vitrine a au moins un produit en ligne :
// le visiteur qui clique doit tomber sur une boutique qui vend, pas sur une
// vitrine vide. Parmi elles, celles qui ont un logo passent d'abord, puis les
// catalogues les plus fournis, puis les plus anciennes.

export const SHOWCASE_LIMIT = 4;

export interface ShowcaseMerchant {
  name: string;
  slug: string;
  logoUrl: string | null;
  sector: string | null;
}

export interface ShowcaseCandidate extends ShowcaseMerchant {
  activeProducts: number;
  createdAt: string;
}

export function pickShowcase(candidates: ShowcaseCandidate[], limit = SHOWCASE_LIMIT): ShowcaseMerchant[] {
  return candidates
    .filter((c) => c.activeProducts > 0 && c.name.trim() && c.slug.trim())
    .sort((a, b) => {
      const logo = Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl));
      if (logo !== 0) return logo;
      if (b.activeProducts !== a.activeProducts) return b.activeProducts - a.activeProducts;
      return a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, Math.max(0, limit))
    .map(({ name, slug, logoUrl, sector }) => ({ name: name.trim(), slug, logoUrl, sector }));
}

/** Initiales affichées quand une boutique n'a pas de logo. */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter((w) => /\p{L}|\p{N}/u.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}
