import { describe, expect, it } from "vitest";
import { initialsOf, pickShowcase, type ShowcaseCandidate } from "./showcase";

const shop = (over: Partial<ShowcaseCandidate> = {}): ShowcaseCandidate => ({
  name: "Boutique",
  slug: "boutique",
  logoUrl: null,
  sector: "commerce_vente",
  activeProducts: 3,
  createdAt: "2026-08-01T00:00:00Z",
  ...over,
});

describe("boutiques présentées sur la page d'accueil", () => {
  it("écarte une vitrine sans produit en ligne", () => {
    const picked = pickShowcase([shop({ slug: "vide", activeProducts: 0 }), shop({ slug: "pleine" })]);
    expect(picked.map((m) => m.slug)).toEqual(["pleine"]);
  });

  it("en montre quatre au plus", () => {
    const picked = pickShowcase(Array.from({ length: 9 }, (_, i) => shop({ slug: "b" + i })));
    expect(picked).toHaveLength(4);
  });

  it("fait passer les boutiques avec un logo, puis les catalogues les plus fournis", () => {
    const picked = pickShowcase([
      shop({ slug: "sans-logo-gros", activeProducts: 40 }),
      shop({ slug: "logo-petit", logoUrl: "a.png", activeProducts: 2 }),
      shop({ slug: "logo-gros", logoUrl: "b.png", activeProducts: 12 }),
    ]);
    expect(picked.map((m) => m.slug)).toEqual(["logo-gros", "logo-petit", "sans-logo-gros"]);
  });

  it("départage à égalité par ancienneté : les premiers inscrits d'abord", () => {
    const picked = pickShowcase([
      shop({ slug: "recente", createdAt: "2026-09-10T00:00:00Z" }),
      shop({ slug: "ancienne", createdAt: "2026-06-01T00:00:00Z" }),
    ]);
    expect(picked.map((m) => m.slug)).toEqual(["ancienne", "recente"]);
  });

  it("ne renvoie rien quand aucune boutique ne vend encore : la section disparaît", () => {
    expect(pickShowcase([shop({ activeProducts: 0 })])).toEqual([]);
    expect(pickShowcase([])).toEqual([]);
  });

  it("ne sort que ce qu'une vitrine publique montre déjà", () => {
    const [m] = pickShowcase([shop({ name: "  Ti Kòk Boutik ", logoUrl: "l.png" })]);
    expect(m).toEqual({ name: "Ti Kòk Boutik", slug: "boutique", logoUrl: "l.png", sector: "commerce_vente" });
  });
});

describe("initiales d'une boutique sans logo", () => {
  it("prend les deux premiers mots", () => {
    expect(initialsOf("Ti Kòk Boutik")).toBe("TK");
    expect(initialsOf("lyne")).toBe("L");
    expect(initialsOf("  ")).toBe("?");
  });
});
