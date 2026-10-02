import { describe, expect, it, vi } from "vitest";
import { drawReelFrame, pickMimeType, REEL_H, REEL_W, SLIDE_MS, type ReelBrand, type ReelSlide } from "./reel";

// Un diaporama se casse sans bruit : une diapositive sautée, un fondu qui ne
// revient pas au début, une police qui déborde. Rien de tout cela ne lève
// d'erreur — le marchand découvre seulement une vidéo ratée après l'avoir
// publiée.

/** Contexte de dessin factice, qui note ce qu'on lui demande. */
function contexteEspion() {
  const appels: { methode: string; args: unknown[] }[] = [];
  const noter = (methode: string) => (...args: unknown[]) => {
    appels.push({ methode, args });
  };
  const ctx = {
    canvas: { width: REEL_W, height: REEL_H },
    globalAlpha: 1,
    fillStyle: "",
    font: "",
    textAlign: "",
    save: noter("save"),
    restore: noter("restore"),
    beginPath: noter("beginPath"),
    roundRect: noter("roundRect"),
    clip: noter("clip"),
    fill: noter("fill"),
    fillRect: noter("fillRect"),
    clearRect: noter("clearRect"),
    drawImage: noter("drawImage"),
    fillText: noter("fillText"),
    measureText: (t: string) => ({ width: t.length * 18 }),
    createLinearGradient: () => ({ addColorStop: noter("addColorStop") }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, appels };
}

const brand: ReelBrand = {
  shopName: "N&J LUXURY",
  logo: null,
  link: "pasrel.ht/b/nj",
  top: "#008069",
  bottom: "#0B1220",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.78)",
  pillBg: "#FFFFFF",
  pillText: "#008069",
};

const slides: ReelSlide[] = [
  { name: "Tennis Nike", price: "7 000 HTG", detail: "Homme · 38 à 42", image: null },
  { name: "Sandale", price: "3 000 HTG", detail: null, image: null },
  { name: "Chemiz gason", price: "18 000 HTG", detail: "Homme · M", image: null },
];

const textesDe = (appels: { methode: string; args: unknown[] }[]) =>
  appels.filter((a) => a.methode === "fillText").map((a) => String(a.args[0]));

describe("image du diaporama", () => {
  it("montre la diapositive qui correspond à l'instant", () => {
    for (const [i, attendu] of ["Tennis Nike", "Sandale", "Chemiz gason"].entries()) {
      const { ctx, appels } = contexteEspion();
      // Milieu de la diapositive : hors de tout fondu.
      drawReelFrame(ctx, slides, brand, i * SLIDE_MS + SLIDE_MS / 2, "sans-serif");
      expect(textesDe(appels), attendu).toContain(attendu);
    }
  });

  it("superpose deux diapositives pendant le fondu", () => {
    const { ctx, appels } = contexteEspion();
    // Juste avant la bascule : l'ancienne s'efface, la suivante apparaît.
    drawReelFrame(ctx, slides, brand, SLIDE_MS - 100, "sans-serif");
    const textes = textesDe(appels);
    expect(textes).toContain("Tennis Nike");
    expect(textes).toContain("Sandale");
  });

  it("boucle : la fin du diaporama revient sur la première", () => {
    // Sans cela, la dernière diapositive se fondrait dans du vide.
    const { ctx, appels } = contexteEspion();
    drawReelFrame(ctx, slides, brand, slides.length * SLIDE_MS - 100, "sans-serif");
    const textes = textesDe(appels);
    expect(textes).toContain("Chemiz gason");
    expect(textes).toContain("Tennis Nike");
  });

  it("porte le nom de la boutique et le lien sur chaque image", () => {
    // Une vidéo repartagée sans légende doit encore dire d'où elle vient.
    for (const ms of [0, SLIDE_MS, SLIDE_MS * 2.5]) {
      const { ctx, appels } = contexteEspion();
      drawReelFrame(ctx, slides, brand, ms, "sans-serif");
      const textes = textesDe(appels);
      expect(textes, `à ${ms} ms`).toContain("N&J LUXURY");
      expect(textes, `à ${ms} ms`).toContain("pasrel.ht/b/nj");
    }
  });

  it("affiche le prix de chaque produit", () => {
    const { ctx, appels } = contexteEspion();
    drawReelFrame(ctx, slides, brand, SLIDE_MS / 2, "sans-serif");
    expect(textesDe(appels)).toContain("7 000 HTG");
  });

  it("omet la ligne de détail quand il n'y en a pas", () => {
    const { ctx, appels } = contexteEspion();
    drawReelFrame(ctx, slides, brand, SLIDE_MS * 1.5, "sans-serif");
    const textes = textesDe(appels);
    expect(textes).toContain("Sandale");
    expect(textes).not.toContain("null");
    expect(textes).not.toContain("undefined");
  });

  it("supporte une seule diapositive sans chercher de suivante", () => {
    const { ctx, appels } = contexteEspion();
    expect(() => drawReelFrame(ctx, [slides[0]], brand, SLIDE_MS - 50, "sans-serif")).not.toThrow();
    expect(textesDe(appels)).toContain("Tennis Nike");
  });

  it("supporte un instant négatif ou très grand", () => {
    // La prévisualisation part parfois d'un compteur remis à zéro.
    for (const ms of [-1200, 10 * SLIDE_MS + 37]) {
      const { ctx } = contexteEspion();
      expect(() => drawReelFrame(ctx, slides, brand, ms, "sans-serif"), String(ms)).not.toThrow();
    }
  });
});

describe("choix du format vidéo", () => {
  it("préfère le MP4, que toutes les messageries acceptent", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => true });
    expect(pickMimeType()?.ext).toBe("mp4");
    vi.unstubAllGlobals();
  });

  it("retombe sur WebM quand le MP4 n'est pas disponible", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: (m: string) => m.startsWith("video/webm") });
    expect(pickMimeType()?.ext).toBe("webm");
    vi.unstubAllGlobals();
  });

  it("rend null quand le navigateur ne sait rien enregistrer", () => {
    // Le bouton doit alors se taire plutôt que d'échouer au clic.
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => false });
    expect(pickMimeType()).toBeNull();
    vi.unstubAllGlobals();
  });
});
