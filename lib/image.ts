/**
 * Redimensionne automatiquement n'importe quelle image importée aux dimensions exactes spécifiées en haute qualité.
 * Effectue un cadrage propre (cover) sans déformer l'image d'origine.
 */
export async function resizeImage(file: File, targetWidth: number, targetHeight: number): Promise<File> {
  if (typeof window === "undefined") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return resolve(file);
      img.src = e.target.result as string;
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const targetRatio = targetWidth / targetHeight;
        const sourceRatio = img.width / img.height;

        let sw = img.width;
        let sh = img.height;
        let sx = 0;
        let sy = 0;

        if (sourceRatio > targetRatio) {
          // Image trop large -> couper les côtés gauche/droite
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // Image trop haute -> couper le haut/bas
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        // WebP plutôt que PNG : le PNG est sans perte, donc une photo de
        // produit y pèse plusieurs mégaoctets. Sur une connexion mobile
        // haïtienne, c'est la vitrine du marchand qui devient lente et le
        // forfait de son client qui se vide. Repli sur JPEG si le navigateur
        // ne sait pas encoder en WebP.
        const encode = (type: string, quality: number, onFail: () => void) =>
          canvas.toBlob(
            (blob) => {
              if (!blob) return onFail();
              const ext = type === "image/webp" ? "webp" : "jpg";
              resolve(
                new File(
                  [blob],
                  `${file.name.replace(/\.[^/.]+$/, "")}_${targetWidth}x${targetHeight}.${ext}`,
                  { type, lastModified: Date.now() },
                ),
              );
            },
            type,
            quality,
          );

        encode("image/webp", 0.82, () => encode("image/jpeg", 0.85, () => resolve(file)));
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/** Redimensionne aux dimensions 600 x 900 pixels (format vertical portrait 2:3). */
export async function resizeImageTo600x900(file: File): Promise<File> {
  return resizeImage(file, 600, 900);
}

/** Redimensionne aux dimensions 450 x 750 pixels (format vitrine 3:5). */
export async function resizeImageTo450x750(file: File): Promise<File> {
  return resizeImage(file, 450, 750);
}

/** Redimensionne aux dimensions 1200 x 400 pixels (format banner panoramique 3:1). */
export async function resizeImageTo1200x400(file: File): Promise<File> {
  return resizeImage(file, 1200, 400);
}
