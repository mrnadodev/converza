"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { POSTER_COPY } from "@/lib/i18n/app/poster";
import type { Language } from "@/lib/i18n/translations";
import { formatMoney } from "@/lib/money";
import { prixEffectif } from "@/lib/prix";
import { themeOf } from "@/lib/themes";
import { verticalOf } from "@/lib/verticals";
import type { Business, Product } from "@/lib/types";
import { Select } from "@/components/ui/Select";

// Affiche produit 9:16 (1080 × 1920) pour stories, statuts et reels.
//
// L'aperçu EST l'image exportée : on dessine dans un seul canvas, affiché en
// réduction et exporté tel quel. Aucune IA ici : le marchand choisit le
// produit et ajuste les textes.

const W = 1080;
const H = 1920;
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export type Style = "shop" | "dark" | "light";

export interface Palette {
  top: string;
  bottom: string;
  text: string;
  sub: string;
  pillBg: string;
  pillText: string;
  priceBg: string;
  priceText: string;
  panel: string;
}

export function paletteFor(style: Style, accent: string, soft: string): Palette {
  if (style === "dark") {
    return { top: "#111827", bottom: "#000000", text: "#FFFFFF", sub: "rgba(255,255,255,0.72)", pillBg: "#F5B942", pillText: "#1F1300", priceBg: "#F5B942", priceText: "#1F1300", panel: "rgba(255,255,255,0.08)" };
  }
  if (style === "light") {
    return { top: "#FFFFFF", bottom: soft, text: "#111B21", sub: "#3B4A54", pillBg: accent, pillText: "#FFFFFF", priceBg: accent, priceText: "#FFFFFF", panel: "rgba(17,27,33,0.06)" };
  }
  return { top: accent, bottom: "#0B1220", text: "#FFFFFF", sub: "rgba(255,255,255,0.78)", pillBg: soft, pillText: accent, priceBg: "#FFFFFF", priceText: accent, panel: "rgba(0,0,0,0.35)" };
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Plus grande taille de police (≤ size) qui tient dans maxWidth. */
export function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, min = 26): number {
  let s = size;
  while (s > min) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= 2;
  }
  ctx.font = `${weight} ${s}px ${FONT}`;
  return s;
}

/** Coupe le texte en lignes, avec « … » au-delà de maxLines. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

/** Dessine l'image en la recadrant (object-fit: cover), sans la déformer. */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}


/**
 * Mise en page de l'affiche.
 *
 * Une seule existait : accroche, photo, nom, prix, encadré, tout empilé au
 * centre. C'est lisible, mais c'est une fiche produit — et le prix, qu'on
 * cherche d'abord des yeux, s'y trouvait coincé au milieu de la pile.
 *
 * Trois mises en page répondent à trois usages réels :
 *
 * `sheet`  — la fiche d'origine, quand il y a quelque chose à expliquer.
 * `full`   — la photo occupe tout le cadre, le texte passe dessus. C'est ce
 *            qui fonctionne sur un statut : l'image se voit avant le texte.
 * `deal`   — le prix mène, en grand et de travers, pour une promotion.
 */
export type PosterLayout = "sheet" | "full" | "deal";

export interface Draft {
  headline: string;
  name: string;
  price: string;
  cta: string;
  link: string;
  style: Style;
  layout: PosterLayout;
}

interface Shop {
  name: string;
  logo: string | null;
  accent: string;
  soft: string;
}

/** Marque PASRÈL en pied d'affiche, avec le Z dans le vert de la marque. */
function drawSignature(ctx: CanvasRenderingContext2D, couleur: string) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 26px ${FONT}`;
  // L'accent est la seule lettre colorée : c'est lui qui dit que le mot est
  // créole, et c'est la signature de la marque.
  const avant = "PASR";
  const accent = "È";
  const apres = "L";
  const total = ctx.measureText(avant + accent + apres).width;
  let x = W / 2 - total / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = couleur;
  ctx.fillText(avant, x, H - 62);
  x += ctx.measureText(avant).width;
  ctx.fillStyle = "#25D366";
  ctx.fillText(accent, x, H - 62);
  x += ctx.measureText(accent).width;
  ctx.fillStyle = couleur;
  ctx.fillText(apres, x, H - 62);

  // La promesse sous le nom. Ces affiches partent sur WhatsApp et Facebook,
  // vues par des gens qui ne connaissent pas encore le produit : c'est la
  // surface de diffusion la plus large, et elle ne coûte rien.
  ctx.textAlign = "center";
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = couleur;
  ctx.globalAlpha = 0.78;
  ctx.fillText("Where conversations become customers", W / 2, H - 38);
  ctx.globalAlpha = 1;
}

/** En-tête logo + nom, commun aux trois mises en page. */
function drawHeader(ctx: CanvasRenderingContext2D, shop: Shop, logo: HTMLImageElement | null, couleur: string) {
  let x = 90;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(90, 90, 110, 110, 30);
    ctx.clip();
    drawCover(ctx, logo, 90, 90, 110, 110);
    ctx.restore();
    x = 230;
  }
  ctx.fillStyle = couleur;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  fit(ctx, shop.name, 800, 54, W - x - 90);
  ctx.fillText(shop.name, x, 145);
}

async function drawPoster(
  canvas: HTMLCanvasElement,
  d: Draft,
  shop: Shop,
  photo: string | null,
  noPhoto: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;
  const p = paletteFor(d.style, shop.accent, shop.soft);
  const [logo, img] = await Promise.all([shop.logo ? loadImage(shop.logo) : null, photo ? loadImage(photo) : null]);

  if (d.layout === "full") return drawFull(ctx, d, shop, p, logo, img, noPhoto);
  if (d.layout === "deal") return drawDeal(ctx, d, shop, p, logo, img, noPhoto);
  return drawSheet(ctx, d, shop, p, logo, img, noPhoto);
}

/** Photo sur tout le cadre, texte par-dessus. La mise en page des statuts. */
function drawFull(
  ctx: CanvasRenderingContext2D,
  d: Draft,
  shop: Shop,
  p: Palette,
  logo: HTMLImageElement | null,
  img: HTMLImageElement | null,
  noPhoto: string,
) {
  if (img) {
    drawCover(ctx, img, 0, 0, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, p.top);
    bg.addColorStop(1, p.bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.sub;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(noPhoto, W / 2, H / 2);
  }

  // Deux voiles : un en haut pour que le nom de la boutique se détache, un en
  // bas, plus épais, pour porter le nom et le prix. Sans eux, un texte blanc
  // sur une photo claire devient illisible — et on ne choisit pas les photos.
  const haut = ctx.createLinearGradient(0, 0, 0, 340);
  haut.addColorStop(0, "rgba(0,0,0,0.62)");
  haut.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haut;
  ctx.fillRect(0, 0, W, 340);

  const bas = ctx.createLinearGradient(0, H - 900, 0, H);
  bas.addColorStop(0, "rgba(0,0,0,0)");
  bas.addColorStop(0.45, "rgba(0,0,0,0.70)");
  bas.addColorStop(1, "rgba(0,0,0,0.94)");
  ctx.fillStyle = bas;
  ctx.fillRect(0, H - 900, W, 900);

  drawHeader(ctx, shop, logo, "#FFFFFF");

  let y = H - 300;

  // Lien puis appel à l'action, remontés depuis le bas.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  fit(ctx, d.link.trim(), 700, 38, W - 200, 22);
  ctx.fillText(d.link.trim(), W / 2, H - 130);

  if (d.cta.trim()) {
    ctx.fillStyle = p.pillBg;
    fit(ctx, d.cta.trim(), 800, 40, W - 300);
    const tw = ctx.measureText(d.cta.trim()).width;
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - 44, H - 244, tw + 88, 76, 38);
    ctx.fill();
    ctx.fillStyle = p.pillText;
    ctx.fillText(d.cta.trim(), W / 2, H - 244 + 40);
    y = H - 300;
  }

  // Prix : le plus gros élément après la photo.
  if (d.price.trim()) {
    ctx.fillStyle = "#FFFFFF";
    fit(ctx, d.price.trim(), 900, 96, W - 200);
    ctx.fillText(d.price.trim(), W / 2, y);
    y -= 110;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 64px ${FONT}`;
  const lignes = wrap(ctx, d.name.trim(), W - 180, 2);
  for (let i = lignes.length - 1; i >= 0; i--) {
    ctx.fillText(lignes[i], W / 2, y);
    y -= 78;
  }

  if (d.headline.trim()) {
    ctx.fillStyle = p.pillBg;
    const s = fit(ctx, d.headline.trim(), 800, 42, W - 300);
    const tw = ctx.measureText(d.headline.trim()).width;
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - 40, y - s / 2 - 22, tw + 80, s + 44, (s + 44) / 2);
    ctx.fill();
    ctx.fillStyle = p.pillText;
    ctx.fillText(d.headline.trim(), W / 2, y);
  }

  drawSignature(ctx, "rgba(255,255,255,0.72)");
}

/** Le prix mène, en grand et de travers. Pour une promotion. */
function drawDeal(
  ctx: CanvasRenderingContext2D,
  d: Draft,
  shop: Shop,
  p: Palette,
  logo: HTMLImageElement | null,
  img: HTMLImageElement | null,
  noPhoto: string,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.top);
  bg.addColorStop(1, p.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, shop, logo, p.text);

  // Photo carrée, haute : elle laisse la moitié basse au prix.
  const ph = 820;
  const top = 250;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(90, top, W - 180, ph, 56);
  ctx.clip();
  if (img) drawCover(ctx, img, 90, top, W - 180, ph);
  else {
    ctx.fillStyle = p.panel;
    ctx.fillRect(90, top, W - 180, ph);
    ctx.fillStyle = p.sub;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(noPhoto, W / 2, top + ph / 2);
  }
  ctx.restore();

  // Bandeau incliné : c'est lui qui fait « promotion » d'un coup d'œil, sans
  // qu'on ait besoin d'écrire le mot.
  if (d.price.trim()) {
    ctx.save();
    ctx.translate(W / 2, top + ph - 30);
    ctx.rotate(-0.07);
    ctx.fillStyle = p.priceBg;
    ctx.beginPath();
    ctx.roundRect(-(W / 2) - 40, -86, W + 80, 172, 24);
    ctx.fill();
    ctx.fillStyle = p.priceText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fit(ctx, d.price.trim(), 900, 116, W - 220);
    ctx.fillText(d.price.trim(), 0, 4);
    ctx.restore();
  }

  let y = top + ph + 190;

  if (d.headline.trim()) {
    ctx.fillStyle = p.pillBg;
    const s = fit(ctx, d.headline.trim(), 800, 44, W - 300);
    const tw = ctx.measureText(d.headline.trim()).width;
    ctx.textAlign = "center";
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - 44, y - s / 2 - 24, tw + 88, s + 48, (s + 48) / 2);
    ctx.fill();
    ctx.fillStyle = p.pillText;
    ctx.fillText(d.headline.trim(), W / 2, y);
    y += 110;
  }

  ctx.fillStyle = p.text;
  ctx.textAlign = "center";
  ctx.font = `800 58px ${FONT}`;
  for (const l of wrap(ctx, d.name.trim(), W - 180, 2)) {
    ctx.fillText(l, W / 2, y);
    y += 70;
  }

  ctx.fillStyle = p.sub;
  fit(ctx, d.cta.trim(), 800, 40, W - 260);
  ctx.fillText(d.cta.trim(), W / 2, H - 190);
  ctx.fillStyle = p.text;
  fit(ctx, d.link.trim(), 700, 38, W - 260, 22);
  ctx.fillText(d.link.trim(), W / 2, H - 130);

  drawSignature(ctx, p.sub);
}

/** La fiche d'origine : photo encadrée, nom, prix, encadré du lien. */
function drawSheet(
  ctx: CanvasRenderingContext2D,
  d: Draft,
  shop: Shop,
  p: Palette,
  logo: HTMLImageElement | null,
  img: HTMLImageElement | null,
  noPhoto: string,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.top);
  bg.addColorStop(1, p.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawHeader(ctx, shop, logo, p.text);

  let top = 250;
  if (d.headline.trim()) {
    const s = fit(ctx, d.headline.trim(), 800, 46, W - 260);
    const tw = ctx.measureText(d.headline.trim()).width;
    ctx.fillStyle = p.pillBg;
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - 50, top, tw + 100, s + 44, (s + 44) / 2);
    ctx.fill();
    ctx.fillStyle = p.pillText;
    ctx.textAlign = "center";
    ctx.fillText(d.headline.trim(), W / 2, top + (s + 44) / 2 + 2);
    top += s + 90;
  } else {
    top += 20;
  }

  const boxY = H - 280;
  const priceH = d.price.trim() ? 104 : 0;
  const priceTop = boxY - 40 - priceH;
  ctx.font = `800 62px ${FONT}`;
  const lines = wrap(ctx, d.name.trim(), W - 180, 2);
  const nameTop = priceTop - (priceH ? 30 : 0) - lines.length * 74;

  const ph = Math.max(360, nameTop - 40 - top);
  const pw = 860;
  const px = (W - pw) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, top, pw, ph, 56);
  ctx.clip();
  if (img) drawCover(ctx, img, px, top, pw, ph);
  else {
    ctx.fillStyle = p.panel;
    ctx.fillRect(px, top, pw, ph);
    ctx.fillStyle = p.sub;
    ctx.textAlign = "center";
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(noPhoto, W / 2, top + ph / 2);
  }
  ctx.restore();

  ctx.fillStyle = p.text;
  ctx.textAlign = "center";
  ctx.font = `800 62px ${FONT}`;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, nameTop + 37 + i * 74));

  if (priceH) {
    fit(ctx, d.price.trim(), 900, 60, W - 360);
    const tw = ctx.measureText(d.price.trim()).width;
    ctx.fillStyle = p.priceBg;
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2 - 56, priceTop, tw + 112, priceH, priceH / 2);
    ctx.fill();
    ctx.fillStyle = p.priceText;
    ctx.fillText(d.price.trim(), W / 2, priceTop + priceH / 2 + 2);
  }

  ctx.fillStyle = p.panel;
  ctx.beginPath();
  ctx.roundRect(90, boxY, W - 180, 180, 40);
  ctx.fill();
  ctx.fillStyle = d.style === "light" ? shop.accent : p.pillBg;
  fit(ctx, d.cta.trim(), 800, 44, W - 260);
  ctx.fillText(d.cta.trim(), W / 2, boxY + 62);
  ctx.fillStyle = p.text;
  fit(ctx, d.link.trim(), 700, 40, W - 260, 22);
  ctx.fillText(d.link.trim(), W / 2, boxY + 126);

  drawSignature(ctx, p.sub);
}

export function ProductPosterModal({ business, products, onClose }: { business: Business; products: Product[]; onClose: () => void }) {
  const t = useDict(POSTER_COPY);
  const { language } = useLanguage();
  const theme = themeOf(business.theme, verticalOf(business.business_type).id);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const storeUrl = `${origin}/b/${business.slug}`;

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = products.find((p) => p.id === productId) ?? products[0];
  const photo = product ? (product.photos?.find(Boolean) ?? product.photo_url ?? null) : null;

  const [draft, setDraft] = useState<Draft>(() => ({
    headline: "",
    name: product?.name ?? "",
    // Le prix de l affiche est celui que le client paiera : annoncer le
    // tarif plein pendant une promo ferait de l affiche un contre-argument.
    price: product ? formatMoney(prixEffectif(product).cents, product.currency) : "",
    cta: t.ctaDefault,
    link: storeUrl.replace(/^https?:\/\//, ""),
    style: "shop",
    // « Plein cadre » par défaut : c'est la mise en page qui fonctionne sur un
    // statut, où l'image se voit avant le texte.
    layout: "full",
  }));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Nouveau produit : on reprend son nom et son prix réels.
  useEffect(() => {
    if (product) set({ name: product.name, price: formatMoney(prixEffectif(product).cents, product.currency) });
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [captionLang, setCaptionLang] = useState<Language>(language);
  const autoCaption = useMemo(
    () =>
      POSTER_COPY[captionLang].captionText({
        shop: business.name,
        product: draft.name.trim(),
        price: draft.price.trim(),
        link: storeUrl,
        headline: draft.headline.trim(),
      }),
    [captionLang, business.name, draft.name, draft.price, draft.headline, storeUrl],
  );
  const [caption, setCaption] = useState(autoCaption);
  const [captionEdited, setCaptionEdited] = useState(false);
  useEffect(() => {
    if (!captionEdited) setCaption(autoCaption);
  }, [autoCaption, captionEdited]);

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 4000);
  };

  // Redessine l'aperçu à chaque modification (le dernier dessin l'emporte).
  const drawId = useRef(0);
  useEffect(() => {
    const id = ++drawId.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const run = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (id !== drawId.current) return;
      await drawPoster(canvas, draft, { name: business.name, logo: business.logo_url, accent: theme.accent, soft: theme.accentSoft }, photo, t.noPhoto);
    };
    const timer = window.setTimeout(run, 120);
    return () => window.clearTimeout(timer);
  }, [draft, photo, business.name, business.logo_url, theme.accent, theme.accentSoft, t.noPhoto]);

  async function posterFile(): Promise<File | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      return blob ? new File([blob], `affiche-${business.slug}.png`, { type: "image/png" }) : null;
    } catch {
      // Photo servie sans en-têtes CORS : le canvas refuse l'export.
      flash(t.photoBlocked);
      return null;
    }
  }

  function saveFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function download() {
    setBusy(true);
    const file = await posterFile();
    setBusy(false);
    if (!file) return;
    saveFile(file);
    flash(t.downloaded);
  }

  async function share() {
    setBusy(true);
    const file = await posterFile();
    setBusy(false);
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        flash(t.shared);
        return;
      } catch {
        return; // partage annulé
      }
    }
    // Ordinateur : pas de partage de fichier, on télécharge.
    saveFile(file);
    flash(t.downloaded);
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      flash(t.copied);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  const networks = [
    { url: business.social_instagram, label: t.openInstagram },
    { url: business.social_facebook, label: t.openFacebook },
    { url: business.social_tiktok, label: t.openTiktok },
  ].filter((n): n is { url: string; label: string } => !!n.url);

  const field = "h-10 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[13.5px] font-semibold text-ink outline-none focus:border-brand focus:bg-white";
  const label = "text-[12px] font-bold text-ink-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white text-ink shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-white px-4 py-3.5 sm:rounded-t-3xl sm:px-6">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold">{t.title}</h2>
            <p className="text-[12px] text-ink-muted">{t.subtitle}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="h-9 w-9 shrink-0 cursor-pointer rounded-full bg-[#F3F6F4] font-bold text-ink-soft">
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 md:flex-row-reverse">
          {/* Aperçu : le canvas exporté, affiché en réduction. */}
          <div className="flex flex-col items-center gap-2 md:w-[320px] md:shrink-0">
            <span className="text-[12px] font-bold text-ink-muted">{t.preview}</span>
            <canvas ref={canvasRef} width={W} height={H} className="aspect-[9/16] w-full max-w-[300px] rounded-[28px] shadow-xl ring-1 ring-line" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {status && <p className="rounded-xl bg-[#E7F7F1] px-3 py-2.5 text-[13px] font-bold text-brand">{status}</p>}

            <label className="flex flex-col gap-1.5">
              <span className={label}>{t.product}</span>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)} triggerClassName={field}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(prixEffectif(p).cents, p.currency)}
                  </option>
                ))}
              </Select>
            </label>

            <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-3.5">
              <legend className="px-1 text-[13px] font-extrabold">{t.texts}</legend>
              <label className="flex flex-col gap-1.5">
                <span className={label}>{t.headline}</span>
                <input value={draft.headline} onChange={(e) => set({ headline: e.target.value })} maxLength={40} placeholder={t.headlinePlaceholder} className={field} />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={label}>{t.name}</span>
                  <input value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} className={field} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>{t.price}</span>
                  <input value={draft.price} onChange={(e) => set({ price: e.target.value })} maxLength={30} className={field} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>{t.cta}</span>
                  <input value={draft.cta} onChange={(e) => set({ cta: e.target.value })} maxLength={40} className={field} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>{t.link}</span>
                  <input value={draft.link} onChange={(e) => set({ link: e.target.value })} maxLength={80} className={field} />
                </label>
              </div>
            </fieldset>

            {/* La mise en page d'abord : elle change ce que l'affiche
                raconte, là où le style ne change que ses couleurs. */}
            <div className="flex flex-col gap-1.5">
              <span className={label}>{t.layout}</span>
              <div className="grid grid-cols-3 gap-2">
                {(["full", "sheet", "deal"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => set({ layout: l })}
                    aria-pressed={draft.layout === l}
                    className={`flex h-auto cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[12px] font-bold ${draft.layout === l ? "border-brand bg-[#F3F8F6] text-brand" : "border-line bg-white text-ink-soft"}`}
                  >
                    <LayoutSketch layout={l} accent={theme.accent} />
                    <span className="truncate">{t.layouts[l]}</span>
                  </button>
                ))}
              </div>
              <span className="text-[11px] leading-snug text-ink-muted">{t.layoutHints[draft.layout]}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>{t.style}</span>
              <div className="grid grid-cols-3 gap-2">
                {(["shop", "dark", "light"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ style: s })}
                    aria-pressed={draft.style === s}
                    className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-[12.5px] font-bold ${draft.style === s ? "border-brand bg-[#F3F8F6] text-brand" : "border-line bg-white text-ink-soft"}`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ background: s === "shop" ? theme.accent : s === "dark" ? "#111827" : "#FFFFFF" }}
                    />
                    <span className="truncate">{t.styles[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={label}>{t.caption}</span>
                <div className="flex items-center gap-1" aria-label={t.captionLanguage}>
                  {(["fr", "ht", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setCaptionLang(l);
                        setCaptionEdited(false);
                      }}
                      className={`h-7 cursor-pointer rounded-lg px-2.5 text-[11.5px] font-bold ${captionLang === l ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-soft"}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setCaptionEdited(true);
                }}
                rows={5}
                className="rounded-xl border border-line bg-[#F7F8F9] px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none focus:border-brand focus:bg-white"
              />
              <span className="text-[11.5px] text-ink-muted">{t.captionHint}</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={share}
                disabled={busy}
                className="flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-[15px] font-extrabold text-white shadow-sm disabled:opacity-60"
              >
                {t.share}
              </button>
              <span className="text-[11.5px] text-ink-muted">{t.shareHint}</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" onClick={download} disabled={busy} className="h-11 cursor-pointer rounded-xl bg-ink text-[13px] font-bold text-white disabled:opacity-60">
                  {t.download}
                </button>
                <button type="button" onClick={copyCaption} className="h-11 cursor-pointer rounded-xl border border-line bg-white text-[13px] font-bold text-ink">
                  {t.copyCaption}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center rounded-xl bg-[#25D366] text-[13px] font-bold text-white"
                >
                  {t.whatsapp}
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center rounded-xl bg-[#1877F2] text-[13px] font-bold text-white"
                >
                  {t.facebook}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-[#F7F8F9] p-3.5">
              <span className="text-[13px] font-extrabold">{t.myNetworks}</span>
              {networks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {networks.map((n) => (
                    <a key={n.url} href={n.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-bold text-ink">
                      {n.label} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-ink-muted">{t.noNetworks}</span>
              )}
              <span className="text-[11.5px] leading-snug text-ink-muted">{t.myNetworksHint}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Miniature d une mise en page : trois rectangles valent mieux qu un nom.
 *
 * Un marchand qui lit « Plein cadre » ne sait pas ce qu il va obtenir ; un
 * marchand qui voit la photo occuper toute la vignette le sait d un coup.
 */
function LayoutSketch({ layout, accent }: { layout: PosterLayout; accent: string }) {
  const cadre = "h-10 w-7 shrink-0 overflow-hidden rounded-[5px] ring-1 ring-black/10";
  if (layout === "full") {
    return (
      <span className={`${cadre} relative`} style={{ background: accent }} aria-hidden="true">
        <span className="absolute inset-x-0 bottom-0 h-3.5 bg-black/55" />
        <span className="absolute inset-x-1 bottom-2 h-[3px] rounded-full bg-white/90" />
        <span className="absolute inset-x-1 bottom-0.5 h-[2px] rounded-full bg-white/60" />
      </span>
    );
  }
  if (layout === "deal") {
    return (
      <span className={`${cadre} relative bg-slate-100`} aria-hidden="true">
        <span className="absolute inset-x-1 top-1 h-4 rounded-[3px]" style={{ background: accent }} />
        <span className="absolute inset-x-0 top-[18px] h-2.5 -rotate-6 bg-slate-800" />
        <span className="absolute inset-x-1 bottom-1 h-[2px] rounded-full bg-slate-400" />
      </span>
    );
  }
  return (
    <span className={`${cadre} relative bg-slate-100`} aria-hidden="true">
      <span className="absolute inset-x-1 top-1 h-5 rounded-[3px]" style={{ background: accent }} />
      <span className="absolute inset-x-1 top-[26px] h-[2px] rounded-full bg-slate-500" />
      <span className="absolute inset-x-2 bottom-1.5 h-2 rounded-[3px] bg-slate-300" />
    </span>
  );
}