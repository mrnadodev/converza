import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { INDUSTRY_SECTORS } from "@/lib/verticals";
import type { LayoutKey } from "@/lib/storefront-layouts";
import type { Product } from "@/lib/types";
import { LanguageProvider } from "@/components/LanguageContext";
import { FeaturedSection } from "@/components/storefront/designs";

// La section « À la une » existe en trois designs par secteur, soit une
// trentaine de mises en page. Une correction appliquée à une seule d'entre
// elles a déjà laissé les autres en créole sur un site en français.
//
// Ce test les rend toutes, pour de vrai, et vérifie qu'aucune ne laisse passer
// une catégorie non traduite. La langue par défaut du site est le français.

const product = (i: number, category: string): Product => ({
  id: `p${i}`,
  business_id: "b1",
  name: `Produit ${i}`,
  category,
  price_cents: 100000 + i,
  currency: "HTG",
  unit: null,
  stock_qty: 5,
  stock_state: "en_stok",
  photo_url: null,
  photos: [],
  sold_count: i,
  is_active: true,
});

// Catégories telles qu'elles sont en base chez les marchands historiques, avec
// la traduction française attendue.
const CREOLE = [
  ["Pwomo Flach", "Promotions"],
  ["Rad & Soulye", "Vêtements & chaussures"],
  ["Gason · Soulye", "Homme · Chaussures"],
  ["Bwason", "Boissons"],
] as const;

const items = CREOLE.map(([creole], i) => product(i + 1, creole));
const LAYOUTS: LayoutKey[] = ["design1", "design2", "design3"];

function render(verticalId: string, layout: LayoutKey): string {
  return renderToStaticMarkup(
    <LanguageProvider>
      <FeaturedSection
        layout={layout}
        verticalId={verticalId}
        featured={items}
        cart={{}}
        ops={{ add: () => {}, sub: () => {} }}
        onZoom={() => {}}
        visitHref={() => "#"}
        palette={{ strong: "#0F766E", soft: "#CCFBF1" }}
      />
    </LanguageProvider>,
  );
}

describe("section « À la une » de la vitrine", () => {
  const cases = Object.keys(INDUSTRY_SECTORS).flatMap((id) => LAYOUTS.map((l) => [id, l] as const));

  it.each(cases)("%s / %s affiche les produits", (verticalId, layout) => {
    const html = render(verticalId, layout);
    expect(html).toContain("Produit 1");
  });

  it.each(cases)("%s / %s n'affiche aucune catégorie en créole", (verticalId, layout) => {
    const html = render(verticalId, layout);
    for (const [creole] of CREOLE) {
      expect(html, `${verticalId}/${layout} laisse passer « ${creole} »`).not.toContain(creole);
    }
  });

  it("traduit la catégorie là où le design l'affiche", () => {
    // Au moins un design montre la catégorie : sinon le test ci-dessus
    // passerait pour de mauvaises raisons.
    const shown = cases.some(([id, layout]) => {
      const html = render(id, layout);
      return CREOLE.some(([, french]) => html.includes(french));
    });
    expect(shown).toBe(true);
  });
});
