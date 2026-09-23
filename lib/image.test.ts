import { describe, expect, it } from "vitest";
import { coverPlan, fitPlan, scalePlan } from "./image";

// La géométrie des images envoyées par le marchand.
//
// Le pipeline recadrait tout : un logo carré envoyé dans un cadre portrait
// perdait un tiers de sa largeur, et un QR code de paiement amputé de ses
// bords ne se scanne plus. Ces cas sont fixés ici.

describe("image posée entière dans un cadre (logo, QR code)", () => {
  it("ne coupe jamais la source", () => {
    for (const [w, h] of [[1000, 1000], [1600, 400], [400, 1600], [37, 900]]) {
      const { draw } = fitPlan(w, h, 800, 800);
      expect(draw.sw, `${w}x${h}`).toBe(w);
      expect(draw.sh, `${w}x${h}`).toBe(h);
    }
  });

  it("garde le format d'origine et centre l'image", () => {
    const { draw } = fitPlan(1600, 400, 800, 800);
    expect(draw.dw / draw.dh).toBeCloseTo(4, 5);
    expect(draw.dx).toBe(0);
    expect(draw.dy).toBe(300); // (800 − 200) / 2
  });

  it("laisse un QR code carré intact", () => {
    // Un QR amputé d'un bord devient illisible : le client ne peut plus payer.
    const { width, height, draw } = fitPlan(1200, 1200, 800, 800);
    expect([width, height]).toEqual([800, 800]);
    expect([draw.dx, draw.dy, draw.dw, draw.dh]).toEqual([0, 0, 800, 800]);
  });
});

describe("photo de produit réduite sans recadrage", () => {
  it("garde le format d'origine", () => {
    const { width, height } = scalePlan(3000, 4000, 1200);
    expect([width, height]).toEqual([900, 1200]);
  });

  it("n'agrandit pas une petite image", () => {
    const { width, height, draw } = scalePlan(320, 240, 1200);
    expect([width, height]).toEqual([320, 240]);
    expect(draw.dw).toBe(320);
  });

  it("limite le côté le plus long, portrait comme paysage", () => {
    expect(scalePlan(6000, 2000, 1200).width).toBe(1200);
    expect(scalePlan(2000, 6000, 1200).height).toBe(1200);
  });
});

describe("bannière recadrée", () => {
  it("remplit exactement le bandeau", () => {
    const { width, height } = coverPlan(2000, 2000, 1200, 400);
    expect([width, height]).toEqual([1200, 400]);
  });

  it("prend une bande centrée dans une image trop haute", () => {
    const { draw } = coverPlan(1200, 1200, 1200, 400);
    expect(draw.sw).toBe(1200);
    expect(draw.sh).toBe(400);
    expect(draw.sy).toBe(400); // bande du milieu
  });

  it("prend une colonne centrée dans une image trop large", () => {
    const { draw } = coverPlan(4000, 1000, 1000, 1000);
    expect(draw.sw).toBe(1000);
    expect(draw.sx).toBe(1500);
  });
});
