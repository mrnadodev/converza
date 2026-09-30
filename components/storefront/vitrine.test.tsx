import { readFileSync } from "node:fs";
import { join } from "node:path";
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

describe("galerie photo", () => {
  it("n'est écrite qu'une fois", () => {
    // Elle ne vivait que dans la carte du catalogue : les seize designs de
    // vitrine n'affichaient que la première des trois photos du marchand.
    // Qu'elle reste dans product.tsx, et que personne n'en récrive une.
    const source = (f: string) => readFileSync(join(__dirname, f), "utf8");
    expect(source("product.tsx")).toContain("export function ProductGallery");
    for (const fichier of ["cards.tsx", "designs.tsx"]) {
      expect(source(fichier), `${fichier} réimplémente le défilement des photos`).not.toMatch(
        /useState\(0\)[\s\S]{0,400}?photos\.length/,
      );
    }
  });

  it("est branchée sur les cartes de vitrine, pas seulement sur le catalogue", () => {
    const designs = readFileSync(join(__dirname, "designs.tsx"), "utf8");
    expect(designs, "les cartes de vitrine doivent montrer les trois photos").toContain("<ProductGallery");
  });
});

describe("la taille s affiche partout ou la categorie s affiche", () => {
  // La correction de la categorie avait ete faite dans les cartes du catalogue
  // et oubliee dans les seize designs. La taille passe par le meme composant,
  // a un seul endroit — ce test verifie qu aucune vitrine ne la perde.
  const rendre = (p: Product, verticalId: string, layout: LayoutKey) =>
    renderToStaticMarkup(
      <LanguageProvider>
        <FeaturedSection
          layout={layout}
          verticalId={verticalId}
          featured={[p]}
          cart={{}}
          ops={{ add: () => {}, sub: () => {} }}
          onZoom={() => {}}
          visitHref={() => "#"}
          palette={{ strong: "#0F766E", soft: "#CCFBF1" }}
        />
      </LanguageProvider>,
    );

  const chaussure: Product = { ...product(1, "Homme · Chaussures"), size: "38 à 42" };

  for (const verticalId of Object.keys(INDUSTRY_SECTORS)) {
    for (const layout of LAYOUTS) {
      it(`${verticalId} / ${layout} montre la taille`, () => {
        expect(rendre(chaussure, verticalId, layout)).toContain("38 à 42");
      });
    }
  }

  it("sans taille, la categorie reste seule, sans separateur orphelin", () => {
    const html = rendre(product(2, "Homme · Chaussures"), "commerce_vente", "design1");
    expect(html).toContain("Homme · Chaussures");
    // Un « · » colle a une balise trahirait un separateur sans rien apres.
    expect(html).not.toMatch(/Chaussures\s*·\s*</);
  });
});

describe("la pastille Nouveau apparait sur toutes les vitrines", () => {
  // Meme lecon que la taille : une pastille cablee dans deux designs sur seize
  // ne se voit pas, et personne ne s en apercoit avant un marchand.
  const rendre = (p: Product, verticalId: string, layout: LayoutKey) =>
    renderToStaticMarkup(
      <LanguageProvider>
        <FeaturedSection
          layout={layout}
          verticalId={verticalId}
          featured={[p]}
          cart={{}}
          ops={{ add: () => {}, sub: () => {} }}
          onZoom={() => {}}
          visitHref={() => "#"}
          palette={{ strong: "#0F766E", soft: "#CCFBF1" }}
        />
      </LanguageProvider>,
    );

  const recent: Product = { ...product(1, "Homme · Chaussures"), created_at: new Date().toISOString() };
  const ancien: Product = { ...product(2, "Homme · Chaussures"), created_at: new Date(Date.now() - 60 * 86400000).toISOString() };

  for (const verticalId of Object.keys(INDUSTRY_SECTORS)) {
    for (const layout of LAYOUTS) {
      it(`${verticalId} / ${layout} marque le produit recent`, () => {
        expect(rendre(recent, verticalId, layout)).toContain("Nouveau");
      });
    }
  }

  it("ne marque pas un produit ancien", () => {
    // Une pastille qui ment partout ne vaut rien nulle part.
    expect(rendre(ancien, "commerce_vente", "design1")).not.toContain("Nouveau");
  });

  it("ne marque pas un produit sans date", () => {
    expect(rendre(product(3, "Homme · Chaussures"), "commerce_vente", "design1")).not.toContain("Nouveau");
  });
});
describe("les pastilles de photo ne se recouvrent pas", () => {
  // « 2 vendus » se pose en haut a gauche, « epuise » en haut a droite. La
  // pastille Nouveau et la taille visent les memes coins : superposees, aucune
  // des deux ne se lit, et le marchand voit une bouillie sur sa plus belle
  // photo. Chaque cote descend d une rangee quand son coin est occupe.
  const rendre = (p: Product) =>
    renderToStaticMarkup(
      <LanguageProvider>
        <FeaturedSection
          layout="design1"
          verticalId="commerce_vente"
          featured={[p]}
          cart={{}}
          ops={{ add: () => {}, sub: () => {} }}
          onZoom={() => {}}
          visitHref={() => "#"}
          palette={{ strong: "#0F766E", soft: "#CCFBF1" }}
        />
      </LanguageProvider>,
    );

  const neuf = (): Product => ({
    ...product(0, "Homme · Chaussures"),
    created_at: new Date().toISOString(),
    size: "40",
  });

  // La classe de position de chaque pastille, retrouvee par son texte. La
  // pastille peut porter sa position elle-meme (la taille, a droite) ou la
  // tenir de sa colonne (a gauche, ou plusieurs pastilles s empilent) : on
  // prend la derniere position declaree avant le texte cherche.
  const rangee = (html: string, texte: string): string => {
    const i = html.indexOf(`>${texte}</span>`);
    expect(i, `pastille « ${texte} » absente du rendu`).toBeGreaterThan(-1);
    const avant = html.slice(0, i).match(/top-[\d.]+/g);
    expect(avant, `pastille « ${texte} » sans position verticale`).not.toBeNull();
    return avant![avant!.length - 1];
  };

  it("Nouveau reste en haut quand rien n occupe le coin gauche", () => {
    expect(rangee(rendre({ ...neuf(), sold_count: 0 }), "Nouveau")).toBe("top-1.5");
  });

  it("Nouveau descend sous « vendus »", () => {
    const html = rendre({ ...neuf(), sold_count: 2 });
    expect(html).toContain("2 vendus");
    expect(rangee(html, "Nouveau")).toBe("top-9");
  });

  it("la taille reste en haut quand le produit est en stock", () => {
    expect(rangee(rendre(neuf()), "40")).toBe("top-1.5");
  });

  it("la taille descend quand « epuise » occupe le coin droit", () => {
    expect(rangee(rendre({ ...neuf(), stock_state: "fini" }), "40")).toBe("top-9");
  });

  it("un produit neuf et deja vendu montre bien les trois pastilles", () => {
    const html = rendre({ ...neuf(), sold_count: 2 });
    expect(html).toContain("2 vendus");
    expect(html).toContain("Nouveau");
    expect(html).toContain("40");
    // Et pas a la meme hauteur que le badge des ventes.
    expect(rangee(html, "Nouveau")).not.toBe("top-1.5");
  });
});

describe("le prix barre apparait sur toutes les vitrines", () => {
  // La taille avait ete oubliee sur dix designs sur trente-trois parce qu elle
  // dependait d une ligne que ces mises en page n affichent pas. Un prix barre
  // qui manque est pire : le client voit le tarif plein et passe son chemin,
  // alors que le marchand croit sa promo visible.
  const rendre = (p: Product, verticalId: string, layout: LayoutKey) =>
    renderToStaticMarkup(
      <LanguageProvider>
        <FeaturedSection
          layout={layout}
          verticalId={verticalId}
          featured={[p]}
          cart={{}}
          ops={{ add: () => {}, sub: () => {} }}
          onZoom={() => {}}
          visitHref={() => "#"}
          palette={{ strong: "#0F766E", soft: "#CCFBF1" }}
        />
      </LanguageProvider>,
    );

  // Les montants sont formates a la francaise (« 2 000 HTG »), avec une
  // espace qui peut etre fine ou insecable selon la plateforme.
  const montant = (gourdes: number) =>
    new RegExp(String(gourdes).replace(/\B(?=(\d{3})+(?!\d))/g, "[\s\u00a0\u202f]"));

  // 2 000 HTG barre, 1 500 HTG a payer, soit −25 %.
  const enPromo: Product = { ...product(0, "Homme · Chaussures"), price_cents: 200000, promo_price_cents: 150000 };

  for (const verticalId of Object.keys(INDUSTRY_SECTORS)) {
    for (const layout of LAYOUTS) {
      it(`${verticalId} / ${layout} barre l ancien prix`, () => {
        const html = rendre(enPromo, verticalId, layout);
        expect(html, "l ancien prix doit etre barre").toContain("<s ");
        expect(html, "le prix a payer").toMatch(montant(1500));
        expect(html, "l ancien prix").toMatch(montant(2000));
      });
    }
  }

  it("hors promo, rien n est barre", () => {
    // Un barre orphelin ferait croire a un rabais qui n existe pas.
    const html = rendre({ ...product(0, "Homme · Chaussures"), price_cents: 200000 }, "commerce_vente", "design1");
    expect(html).not.toContain("<s ");
    expect(html).toMatch(montant(2000));
  });

  it("un faux rabais n est pas affiche comme un rabais", () => {
    const html = rendre(
      { ...product(0, "Homme · Chaussures"), price_cents: 200000, promo_price_cents: 250000 },
      "commerce_vente",
      "design1",
    );
    expect(html).not.toContain("<s ");
    expect(html).not.toMatch(montant(2500));
  });

  it("une promo terminee ne barre plus rien", () => {
    const html = rendre(
      {
        ...product(0, "Homme · Chaussures"),
        price_cents: 200000,
        promo_price_cents: 150000,
        promo_ends_at: new Date(Date.now() - 3600000).toISOString(),
      },
      "commerce_vente",
      "design1",
    );
    expect(html).not.toContain("<s ");
    expect(html).toMatch(montant(2000));
  });

  it("la remise s annonce en pourcentage sur la photo", () => {
    expect(rendre(enPromo, "commerce_vente", "design1")).toContain("25 %");
  });

  it("l ancien prix n est pas affadi au point d etre illisible", () => {
    // Mesure faite a l ecran : `opacity-60` sur le vert du theme donnait
    // 2,56:1 a 11,2 px, sous le minimum de 4,5:1. En heritant de la couleur du
    // prix, l ancien prix est exactement aussi lisible que lui, sur les seize
    // fonds. Ce test empeche de remettre une opacite « pour faire discret ».
    const html = rendre(enPromo, "commerce_vente", "design1");
    const barre = html.match(/<s class="([^"]*)"/g) ?? [];
    expect(barre.length, "l ancien prix doit etre barre").toBeGreaterThan(0);
    for (const b of barre) {
      expect(b, "pas d opacite sur l ancien prix").not.toMatch(/opacity-\d/);
      expect(b, "pas de gris trop pale sur l ancien prix").not.toContain("ink-faint");
    }
  });

  it("le prix barre est etiquete pour les lecteurs d ecran", () => {
    // Sans etiquette, un lecteur d ecran annonce deux prix a payer.
    expect(rendre(enPromo, "commerce_vente", "design1")).toContain("Ancien prix");
  });
});
