// Préparation des images avant l'envoi vers le stockage.
//
// Trois besoins différents, longtemps traités de la même façon — par un
// recadrage. Ce qu'un recadrage enlève ne revient jamais : un logo carré
// envoyé dans un cadre portrait perdait un tiers de sa largeur, et un QR code
// de paiement amputé de ses bords ne se scanne plus.
//
// Désormais, seule la bannière est recadrée : c'est un bandeau, le marchand
// s'attend à ce qu'on en garde une bande. Tout le reste est conservé entier.

export type Draw = { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number };
export type Plan = { width: number; height: number; draw: Draw };

/* ─────────── Géométrie ───────────
   Séparée du dessin pour être vérifiable : c'est ici qu'un QR code perdait
   ses bords. */

/** Cadrage qui remplit le cadre en coupant ce qui dépasse. */
export function coverPlan(iw: number, ih: number, targetWidth: number, targetHeight: number): Plan {
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = iw / ih;
  let sw = iw;
  let sh = ih;
  let sx = 0;
  let sy = 0;
  if (sourceRatio > targetRatio) {
    sw = ih * targetRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / targetRatio;
    sy = (ih - sh) / 2;
  }
  return { width: targetWidth, height: targetHeight, draw: { sx, sy, sw, sh, dx: 0, dy: 0, dw: targetWidth, dh: targetHeight } };
}

/** Réduction qui garde le format d'origine, sans jamais agrandir. */
export function scalePlan(iw: number, ih: number, longestSide: number): Plan {
  const factor = Math.min(1, longestSide / Math.max(iw, ih));
  const width = Math.max(1, Math.round(iw * factor));
  const height = Math.max(1, Math.round(ih * factor));
  return { width, height, draw: { sx: 0, sy: 0, sw: iw, sh: ih, dx: 0, dy: 0, dw: width, dh: height } };
}

/** Image entière, centrée dans le cadre, rien de coupé. */
export function fitPlan(iw: number, ih: number, frameWidth: number, frameHeight: number): Plan {
  const factor = Math.min(frameWidth / iw, frameHeight / ih);
  const dw = Math.max(1, Math.round(iw * factor));
  const dh = Math.max(1, Math.round(ih * factor));
  return {
    width: frameWidth,
    height: frameHeight,
    draw: { sx: 0, sy: 0, sw: iw, sh: ih, dx: Math.round((frameWidth - dw) / 2), dy: Math.round((frameHeight - dh) / 2), dw, dh },
  };
}

function encode(canvas: HTMLCanvasElement, file: File, label: string, onWhite: () => void): Promise<File> {
  return new Promise((resolve) => {
    const done = (blob: Blob | null, type: string, fallback: () => void) => {
      if (!blob) return fallback();
      const ext = type === "image/webp" ? "webp" : "jpg";
      resolve(new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}_${label}.${ext}`, { type, lastModified: Date.now() }));
    };
    // WebP plutôt que PNG : le PNG est sans perte, donc une photo de produit y
    // pèse plusieurs mégaoctets. Sur une connexion mobile haïtienne, c'est la
    // vitrine du marchand qui devient lente et le forfait de son client qui se
    // vide. Le WebP garde aussi la transparence d'un logo.
    canvas.toBlob(
      (webp) =>
        done(webp, "image/webp", () => {
          // Le JPEG ignore la transparence et la rendrait noire : on repose
          // l'image sur du blanc avant de réessayer.
          onWhite();
          canvas.toBlob((jpg) => done(jpg, "image/jpeg", () => resolve(file)), "image/jpeg", 0.85);
        }),
      "image/webp",
      0.82,
    );
  });
}

function process(file: File, plan: (w: number, h: number) => Plan): Promise<File> {
  if (typeof window === "undefined") return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return resolve(file);
      img.src = e.target.result as string;
    };

    img.onload = async () => {
      try {
        const { width, height, draw } = plan(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const paint = () => ctx.drawImage(img, draw.sx, draw.sy, draw.sw, draw.sh, draw.dx, draw.dy, draw.dw, draw.dh);
        paint();

        resolve(
          await encode(canvas, file, `${width}x${height}`, () => {
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = "source-over";
          }),
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Recadre l'image pour remplir exactement les dimensions demandées.
 * Réservé aux bannières : le cadrage enlève une partie de l'image.
 */
export function cropImage(file: File, targetWidth: number, targetHeight: number): Promise<File> {
  return process(file, (iw, ih) => coverPlan(iw, ih, targetWidth, targetHeight));
}

/**
 * Garde l'image entière et son format d'origine, en limitant le côté le plus
 * long. Une image déjà plus petite n'est pas agrandie.
 */
export function scaleImage(file: File, longestSide: number): Promise<File> {
  return process(file, (iw, ih) => scalePlan(iw, ih, longestSide));
}

/**
 * Pose l'image entière, centrée, dans un cadre aux dimensions demandées.
 * Rien n'est coupé ni déformé : le pourtour reste transparent.
 * C'est ce qu'il faut pour un logo, et c'est vital pour un QR code de
 * paiement, qu'un recadrage rendrait illisible.
 */
export function fitImage(file: File, frameWidth: number, frameHeight: number): Promise<File> {
  return process(file, (iw, ih) => fitPlan(iw, ih, frameWidth, frameHeight));
}

/** Bannière panoramique 1200 x 400 (3:1). */
export function resizeImageTo1200x400(file: File): Promise<File> {
  return cropImage(file, 1200, 400);
}
