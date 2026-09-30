"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDict } from "@/components/LanguageContext";
import { REEL_COPY } from "@/lib/i18n/app/reel";
import { formatMoney } from "@/lib/money";
import { prixEffectif } from "@/lib/prix";
import { themeOf } from "@/lib/themes";
import { categoryLabel } from "@/lib/categories";
import { useLanguage } from "@/components/LanguageContext";
import { loadImage, paletteFor, type Style } from "@/components/ProductPosterModal";
import {
  drawReelFrame,
  pickMimeType,
  recordReel,
  REEL_H,
  REEL_W,
  SLIDE_MS,
  type ReelBrand,
  type ReelSlide,
} from "@/lib/reel";
import type { Business, Product } from "@/lib/types";
import { Select } from "@/components/ui/Select";

// Diaporama animé de quelques produits, exporté en vidéo.
//
// Un statut WhatsApp qui bouge se regarde ; une photo se dépasse. L'affiche
// fixe existait déjà — il manquait le format qui retient trois secondes.
//
// L'aperçu EST la vidéo : le même canvas est animé à l'écran puis filmé. Ce
// que le marchand voit est ce qu'il publiera, sans surprise au montage.

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const MAX_SLIDES = 6;

export function ProductReelModal({
  business,
  products,
  onClose,
}: {
  business: Business;
  products: Product[];
  onClose: () => void;
}) {
  const r = useDict(REEL_COPY);
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const disponibles = useMemo(() => products.filter((p) => p.is_active), [products]);
  const [choisis, setChoisis] = useState<string[]>(() => disponibles.slice(0, 3).map((p) => p.id));
  const [style, setStyle] = useState<Style>("shop");
  const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({});
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Le format est décidé une fois : le bouton doit savoir dès l'ouverture s'il
  // a quelque chose à proposer, plutôt que d'échouer au clic.
  const format = useMemo(() => (typeof window === "undefined" ? null : pickMimeType()), []);

  const theme = themeOf(business.theme);
  const palette = paletteFor(style, theme.accent, theme.accentSoft);
  const lien = typeof window === "undefined" ? "" : `${window.location.host}/b/${business.slug}`;

  const slides: ReelSlide[] = useMemo(
    () =>
      choisis
        .map((id) => disponibles.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .map((p) => ({
          name: p.name,
          price: formatMoney(prixEffectif(p).cents, p.currency),
          // La taille d'abord : c'est ce qui décide un achat de vêtement.
          detail: [categoryLabel(p.category, language), p.size?.trim()].filter(Boolean).join(" · ") || null,
          image: images[p.id] ?? null,
        })),
    [choisis, disponibles, images, language],
  );

  const brand: ReelBrand = useMemo(
    () => ({
      shopName: business.name,
      logo,
      link: lien,
      top: palette.top,
      bottom: palette.bottom,
      text: palette.text,
      sub: palette.sub,
      pillBg: palette.pillBg,
      pillText: palette.pillText,
    }),
    [business.name, logo, lien, palette],
  );

  // Les photos sont chargées une fois, pas à chaque image : trente fois par
  // seconde, un rechargement ferait clignoter la vidéo.
  useEffect(() => {
    let vivant = true;
    (async () => {
      const aCharger = choisis.filter((id) => !(id in images));
      if (aCharger.length === 0) return;
      const paires = await Promise.all(
        aCharger.map(async (id) => {
          const p = disponibles.find((x) => x.id === id);
          const src = p?.photos?.[0] ?? p?.photo_url ?? null;
          return [id, src ? await loadImage(src) : null] as const;
        }),
      );
      if (vivant) setImages((cur) => ({ ...cur, ...Object.fromEntries(paires) }));
    })();
    return () => {
      vivant = false;
    };
  }, [choisis, disponibles, images]);

  useEffect(() => {
    if (!business.logo_url) return;
    let vivant = true;
    loadImage(business.logo_url).then((img) => vivant && setLogo(img));
    return () => {
      vivant = false;
    };
  }, [business.logo_url]);

  // Aperçu animé. Il tourne tant que la fenêtre est ouverte ; l'export rejoue
  // la même fonction de dessin, sur le même canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slides.length === 0 || enCours) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = REEL_W;
    canvas.height = REEL_H;

    const depart = performance.now();
    let frame = 0;
    const boucle = () => {
      drawReelFrame(ctx, slides, brand, performance.now() - depart, FONT);
      frame = requestAnimationFrame(boucle);
    };
    boucle();
    return () => cancelAnimationFrame(frame);
  }, [slides, brand, enCours]);

  function basculer(id: string) {
    setChoisis((l) => {
      if (l.includes(id)) return l.filter((x) => x !== id);
      if (l.length >= MAX_SLIDES) return l;
      return [...l, id];
    });
  }

  async function exporter() {
    const canvas = canvasRef.current;
    if (!canvas || !format || slides.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setErreur(null);
    setEnCours(true);
    try {
      const duree = slides.length * SLIDE_MS;
      const blob = await recordReel(canvas, (ms) => drawReelFrame(ctx, slides, brand, ms, FONT), duree, format.mime);
      const nom = `${business.name.replace(/\s+/g, "-").toLowerCase()}.${format.ext}`;
      const fichier = new File([blob], nom, { type: format.mime });

      // Le partage natif envoie la vidéo directement dans WhatsApp, sans
      // passer par le dossier Téléchargements. C'est le chemin court sur
      // téléphone, et le seul qui évite au marchand de chercher son fichier.
      if (navigator.canShare?.({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier], title: business.name });
          return;
        } catch {
          /* partage refusé : on retombe sur le téléchargement */
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setErreur(r.failed);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-[15px] font-extrabold text-ink">{r.title}</h2>
            <p className="truncate text-[11.5px] text-ink-muted">{r.subtitle(slides.length, Math.round((slides.length * SLIDE_MS) / 1000))}</p>
          </div>
          <button onClick={onClose} aria-label={r.close} className="h-9 w-9 shrink-0 cursor-pointer rounded-full text-lg text-ink-muted hover:bg-[#F3F6F4]">
            ✕
          </button>
        </header>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[260px_1fr]">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{r.style}</span>
              <Select
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
                options={[
                  { value: "shop", label: r.styles.shop },
                  { value: "dark", label: r.styles.dark },
                  { value: "light", label: r.styles.light },
                ]}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-bold text-ink-muted">{r.pick(MAX_SLIDES)}</span>
              <ul className="flex max-h-[38vh] flex-col divide-y divide-line/60 overflow-y-auto rounded-xl border border-line">
                {disponibles.map((p) => {
                  const actif = choisis.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2">
                        <input
                          type="checkbox"
                          checked={actif}
                          onChange={() => basculer(p.id)}
                          disabled={!actif && choisis.length >= MAX_SLIDES}
                          className="h-4 w-4 shrink-0 accent-[#008069]"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[12.5px] font-bold text-ink">{p.name}</span>
                          <span className="text-[11px] text-ink-muted">{formatMoney(p.price_cents, p.currency)}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {/* L'aperçu est le canvas lui-même, réduit. Ce qui tourne ici est
                exactement ce qui sera filmé. */}
            <canvas
              ref={canvasRef}
              className="w-full max-w-[260px] rounded-2xl bg-slate-900 shadow-lg"
              style={{ aspectRatio: `${REEL_W} / ${REEL_H}` }}
            />
            {slides.length === 0 && <p className="text-[12.5px] text-ink-muted">{r.empty}</p>}
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-line px-4 py-3">
          {erreur && <p className="text-[12px] font-semibold text-[#C0392B]">{erreur}</p>}
          {!format ? (
            <p className="text-[12px] text-ink-muted">{r.unsupported}</p>
          ) : (
            <>
              <button
                onClick={exporter}
                disabled={enCours || slides.length === 0}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-[15px] font-extrabold text-white disabled:opacity-50 active:scale-[0.98]"
              >
                {enCours ? r.recording : r.export}
              </button>
              {/* Dit franchement ce que le navigateur sait produire : un WebM
                  envoyé à un iPhone arrive comme un fichier mort. */}
              <p className="text-center text-[11px] leading-snug text-ink-muted">
                {format.ext === "mp4" ? r.formatMp4 : r.formatWebm}
              </p>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
