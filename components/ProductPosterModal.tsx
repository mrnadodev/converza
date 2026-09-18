"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { POSTER_COPY } from "@/lib/i18n/app/poster";
import type { Language } from "@/lib/i18n/translations";
import { formatMoney } from "@/lib/money";
import { themeOf } from "@/lib/themes";
import { verticalOf } from "@/lib/verticals";
import type { Business, Product } from "@/lib/types";

// Affiche produit 9:16 (1080 × 1920) pour stories, statuts et reels.
//
// L'aperçu EST l'image exportée : on dessine dans un seul canvas, affiché en
// réduction et exporté tel quel. Aucune IA ici : le marchand choisit le
// produit et ajuste les textes.

const W = 1080;
const H = 1920;
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

type Style = "shop" | "dark" | "light";

interface Palette {
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

function paletteFor(style: Style, accent: string, soft: string): Palette {
  if (style === "dark") {
    return { top: "#111827", bottom: "#000000", text: "#FFFFFF", sub: "rgba(255,255,255,0.72)", pillBg: "#F5B942", pillText: "#1F1300", priceBg: "#F5B942", priceText: "#1F1300", panel: "rgba(255,255,255,0.08)" };
  }
  if (style === "light") {
    return { top: "#FFFFFF", bottom: soft, text: "#111B21", sub: "#3B4A54", pillBg: accent, pillText: "#FFFFFF", priceBg: accent, priceText: "#FFFFFF", panel: "rgba(17,27,33,0.06)" };
  }
  return { top: accent, bottom: "#0B1220", text: "#FFFFFF", sub: "rgba(255,255,255,0.78)", pillBg: soft, pillText: accent, priceBg: "#FFFFFF", priceText: accent, panel: "rgba(0,0,0,0.35)" };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Plus grande taille de police (≤ size) qui tient dans maxWidth. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, min = 26): number {
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
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
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
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

interface Draft {
  headline: string;
  name: string;
  price: string;
  cta: string;
  link: string;
  style: Style;
}

async function drawPoster(
  canvas: HTMLCanvasElement,
  d: Draft,
  shop: { name: string; logo: string | null; accent: string; soft: string },
  photo: string | null,
  noPhoto: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;
  const p = paletteFor(d.style, shop.accent, shop.soft);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.top);
  bg.addColorStop(1, p.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const [logo, img] = await Promise.all([shop.logo ? loadImage(shop.logo) : null, photo ? loadImage(photo) : null]);

  // En-tête : logo et nom de la boutique.
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
  ctx.fillStyle = p.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  fit(ctx, shop.name, 800, 54, W - x - 90);
  ctx.fillText(shop.name, x, 145);

  // Accroche : seulement si le marchand en a écrit une.
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

  // Mise en page du bas vers le haut : encadré du lien, prix, nom, puis la
  // photo prend l'espace restant. Un nom sur deux lignes réduit la photo au
  // lieu de chevaucher le prix.
  const boxY = H - 280;
  const priceH = d.price.trim() ? 104 : 0;
  const priceTop = boxY - 40 - priceH;
  ctx.font = `800 62px ${FONT}`;
  const lines = wrap(ctx, d.name.trim(), W - 180, 2);
  const nameTop = priceTop - (priceH ? 30 : 0) - lines.length * 74;

  // Photo du produit, recadrée sans déformation.
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

  // Nom du produit (2 lignes au plus).
  ctx.fillStyle = p.text;
  ctx.textAlign = "center";
  ctx.font = `800 62px ${FONT}`;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, nameTop + 37 + i * 74));

  // Prix.
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

  // Appel à l'action et lien de la vitrine.
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

  ctx.fillStyle = p.sub;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText("CONVERZA", W / 2, H - 50);
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
    price: product ? formatMoney(product.price_cents, product.currency) : "",
    cta: t.ctaDefault,
    link: storeUrl.replace(/^https?:\/\//, ""),
    style: "shop",
  }));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Nouveau produit : on reprend son nom et son prix réels.
  useEffect(() => {
    if (product) set({ name: product.name, price: formatMoney(product.price_cents, product.currency) });
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex min-h-[100dvh] w-full max-w-5xl flex-col bg-white text-ink shadow-2xl sm:min-h-0 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3.5 sm:rounded-t-3xl sm:px-6">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold">{t.title}</h2>
            <p className="text-[12px] text-ink-muted">{t.subtitle}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="h-9 w-9 shrink-0 cursor-pointer rounded-full bg-[#F3F6F4] font-bold text-ink-soft">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row-reverse">
          {/* Aperçu : le canvas exporté, affiché en réduction. */}
          <div className="flex flex-col items-center gap-2 md:w-[320px] md:shrink-0">
            <span className="text-[12px] font-bold text-ink-muted">{t.preview}</span>
            <canvas ref={canvasRef} width={W} height={H} className="aspect-[9/16] w-full max-w-[300px] rounded-[28px] shadow-xl ring-1 ring-line" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {status && <p className="rounded-xl bg-[#E7F7F1] px-3 py-2.5 text-[13px] font-bold text-brand">{status}</p>}

            <label className="flex flex-col gap-1.5">
              <span className={label}>{t.product}</span>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={field}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.price_cents, p.currency)}
                  </option>
                ))}
              </select>
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
