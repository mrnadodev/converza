// Diaporama animé d'une poignée de produits, enregistré en vidéo.
//
// Un statut WhatsApp qui bouge se regarde ; une photo se dépasse. Le marchand
// avait l'affiche fixe, il lui manquait le format qui retient trois secondes.
//
// TOUT SE PASSE DANS LE NAVIGATEUR. Aucun service d'encodage, aucune clé, rien
// qui se facture au marchand ni qui envoie ses photos ailleurs : on dessine
// chaque image sur un canvas et `MediaRecorder` filme ce canvas. C'est
// exactement ce pour quoi il existe.
//
// 720 × 1280 et non 1080 × 1920 : WhatsApp recompresse de toute façon, et
// trente images par seconde en pleine résolution font saccader un téléphone
// d'entrée de gamme — c'est-à-dire la plupart de ceux qui comptent ici.

export const REEL_W = 720;
export const REEL_H = 1280;
export const REEL_FPS = 30;

/** Durée d'une diapositive, et du fondu entre deux. */
export const SLIDE_MS = 2500;
export const FADE_MS = 450;

export interface ReelSlide {
  name: string;
  price: string;
  /** Taille, catégorie, ou ce que le marchand veut dire en une ligne. */
  detail?: string | null;
  image: HTMLImageElement | null;
}

export interface ReelBrand {
  shopName: string;
  logo: HTMLImageElement | null;
  link: string;
  top: string;
  bottom: string;
  text: string;
  sub: string;
  pillBg: string;
  pillText: string;
}

/**
 * Le format vidéo que ce navigateur sait produire.
 *
 * L'ordre compte : MP4 d'abord, parce que c'est le seul que toutes les
 * applications de messagerie acceptent sans discuter. WebM passe sur Android
 * mais un iPhone qui le reçoit affiche un fichier mort — il faut donc le dire
 * au marchand plutôt que de le laisser envoyer quelque chose d'illisible.
 */
export function pickMimeType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidats: { mime: string; ext: "mp4" | "webm" }[] = [
    { mime: "video/mp4;codecs=avc1.42E01E", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  return candidats.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? null;
}

const lisser = (t: number) => t * t * (3 - 2 * t);

/**
 * Dessine l'état du diaporama à l'instant `ms`.
 *
 * Deux mouvements seulement : un fondu entre diapositives, et un lent
 * rapprochement sur la photo. Assez pour que l'œil s'arrête, assez peu pour
 * que le produit reste lisible — une animation qui s'admire elle-même fait
 * oublier ce qu'elle vend.
 */
export function drawReelFrame(
  ctx: CanvasRenderingContext2D,
  slides: ReelSlide[],
  brand: ReelBrand,
  ms: number,
  font: string,
) {
  const total = slides.length * SLIDE_MS;
  const t = ((ms % total) + total) % total;
  const index = Math.min(Math.floor(t / SLIDE_MS), slides.length - 1);
  const dansLaDiapo = t - index * SLIDE_MS;

  ctx.clearRect(0, 0, REEL_W, REEL_H);

  const fond = ctx.createLinearGradient(0, 0, 0, REEL_H);
  fond.addColorStop(0, brand.top);
  fond.addColorStop(1, brand.bottom);
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, REEL_W, REEL_H);

  // Le fondu se joue à la fin d'une diapositive, avec la suivante par-dessus.
  const reste = SLIDE_MS - dansLaDiapo;
  const enFondu = reste < FADE_MS && slides.length > 1;
  const avancement = enFondu ? lisser(1 - reste / FADE_MS) : 0;

  dessinerDiapo(ctx, slides[index], brand, dansLaDiapo / SLIDE_MS, 1 - avancement, font);
  if (enFondu) {
    const suivante = slides[(index + 1) % slides.length];
    dessinerDiapo(ctx, suivante, brand, 0, avancement, font);
  }

  dessinerBandeau(ctx, brand, font);
}

function dessinerDiapo(
  ctx: CanvasRenderingContext2D,
  slide: ReelSlide,
  brand: ReelBrand,
  progression: number,
  opacite: number,
  font: string,
) {
  if (opacite <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacite;

  const cadreY = 170;
  const cadreH = 760;

  // Rapprochement lent : 4 % sur la durée d'une diapositive.
  const zoom = 1 + 0.04 * progression;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(48, cadreY, REEL_W - 96, cadreH, 36);
  ctx.clip();

  if (slide.image) {
    const w = (REEL_W - 96) * zoom;
    const h = cadreH * zoom;
    const x = 48 - (w - (REEL_W - 96)) / 2;
    const y = cadreY - (h - cadreH) / 2;
    const ratio = Math.max(w / slide.image.width, h / slide.image.height);
    const iw = slide.image.width * ratio;
    const ih = slide.image.height * ratio;
    ctx.drawImage(slide.image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(48, cadreY, REEL_W - 96, cadreH);
  }
  ctx.restore();

  // Texte sous la photo.
  ctx.textAlign = "center";
  ctx.fillStyle = brand.text;
  ctx.font = `800 ${tailleQuiTient(ctx, slide.name, 800, 56, REEL_W - 140, font)}px ${font}`;
  ctx.fillText(slide.name, REEL_W / 2, cadreY + cadreH + 96, REEL_W - 140);

  if (slide.detail) {
    ctx.fillStyle = brand.sub;
    ctx.font = `600 30px ${font}`;
    ctx.fillText(slide.detail, REEL_W / 2, cadreY + cadreH + 146, REEL_W - 140);
  }

  // Le prix dans une pastille : c'est ce qu'on cherche des yeux.
  const prix = slide.price;
  ctx.font = `800 44px ${font}`;
  const largeur = ctx.measureText(prix).width + 76;
  const px = (REEL_W - largeur) / 2;
  const py = cadreY + cadreH + 186;
  ctx.fillStyle = brand.pillBg;
  ctx.beginPath();
  ctx.roundRect(px, py, largeur, 84, 42);
  ctx.fill();
  ctx.fillStyle = brand.pillText;
  ctx.fillText(prix, REEL_W / 2, py + 57);

  ctx.restore();
}

/** En-tête (logo, nom) et pied (lien) : ils ne bougent pas d'une diapo à l'autre. */
function dessinerBandeau(ctx: CanvasRenderingContext2D, brand: ReelBrand, font: string) {
  ctx.save();
  ctx.textAlign = "left";

  let x = 56;
  if (brand.logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(56, 56, 76, 76, 22);
    ctx.clip();
    ctx.drawImage(brand.logo, 56, 56, 76, 76);
    ctx.restore();
    x = 152;
  }
  ctx.fillStyle = brand.text;
  ctx.font = `800 36px ${font}`;
  ctx.fillText(brand.shopName, x, 106, REEL_W - x - 56);

  ctx.textAlign = "center";
  ctx.fillStyle = brand.sub;
  ctx.font = `600 26px ${font}`;
  ctx.fillText(brand.link, REEL_W / 2, REEL_H - 64, REEL_W - 96);
  ctx.restore();
}

/** Plus grande taille (≤ max) qui tient dans `largeurMax`. */
function tailleQuiTient(
  ctx: CanvasRenderingContext2D,
  texte: string,
  graisse: number,
  max: number,
  largeurMax: number,
  font: string,
  min = 28,
): number {
  let taille = max;
  while (taille > min) {
    ctx.font = `${graisse} ${taille}px ${font}`;
    if (ctx.measureText(texte).width <= largeurMax) break;
    taille -= 2;
  }
  return taille;
}

/**
 * Filme le canvas pendant un tour complet du diaporama.
 *
 * L'animation est rejouée image par image plutôt que laissée à
 * `requestAnimationFrame` : un onglet en arrière-plan suspend les frames, et
 * le marchand récupérerait une vidéo figée sans comprendre pourquoi. On avance
 * l'horloge nous-mêmes et on force un dessin à chaque pas.
 */
export function recordReel(
  canvas: HTMLCanvasElement,
  dessiner: (ms: number) => void,
  dureeMs: number,
  mime: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // `captureStream(0)` et non `captureStream(30)` : avec une cadence, le
    // flux ne prend une image que lorsque le navigateur peint le canvas. Un
    // onglet en arrière-plan ne peint pas, et l'enregistrement rendait alors
    // un fichier de zéro octet — sans lever la moindre erreur. À zéro, c'est
    // nous qui poussons chaque image, et l'export ne dépend plus du
    // compositeur.
    const flux = canvas.captureStream(0);
    const piste = flux.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    const recorder = new MediaRecorder(flux, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    const morceaux: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) morceaux.push(e.data);
    };
    recorder.onerror = () => reject(new Error("recorder"));
    recorder.onstop = () => resolve(new Blob(morceaux, { type: mime }));

    recorder.start();

    const pas = 1000 / REEL_FPS;
    let ms = 0;
    const avancer = () => {
      if (ms > dureeMs) {
        recorder.stop();
        flux.getTracks().forEach((t) => t.stop());
        return;
      }
      dessiner(ms);
      // Chaque image est poussée explicitement dans le flux. Sans cet appel,
      // en mode manuel, la vidéo resterait vide.
      piste?.requestFrame?.();
      ms += pas;
      setTimeout(avancer, pas);
    };
    avancer();
  });
}
