"use client";

import { useState, useRef, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export function AIPosterGeneratorModal({
  products,
  storeSlug,
  storeName,
  logoUrl,
  onClose,
}: {
  products: Product[];
  storeSlug: string;
  storeName: string;
  logoUrl?: string | null;
  onClose: () => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // ==========================================
  // DIRECTIVE #3 : TEXTES ÉDITABLES PAR LE MARCHAND + DEVISE HTG/USD
  // ==========================================
  const [headline, setHeadline] = useState<string>("VANT FLACH -15%");
  const [productName, setProductName] = useState<string>(selectedProduct?.name || "Robe de Soirée");
  const [currency, setCurrency] = useState<"HTG" | "USD">((selectedProduct?.currency as "HTG" | "USD") || "HTG");
  const [priceText, setPriceText] = useState<string>(
    selectedProduct?.currency === "USD" ? `$${selectedProduct.price_cents / 100}` : formatMoney(selectedProduct?.price_cents || 240000)
  );
  const [ctaText, setCtaText] = useState<string>("Kòmande an 1-click sou WhatsApp");
  const [customStoreLink, setCustomStoreLink] = useState<string>(`converza.app/b/${storeSlug}`);

  const [styleTheme, setStyleTheme] = useState<"tiktok" | "luxe" | "whatsapp" | "facebook">("tiktok");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeUrl = `https://converza.app/b/${storeSlug}`;

  // Mise à jour synchrone si changement de produit
  useEffect(() => {
    if (selectedProduct) {
      setProductName(selectedProduct.name);
      const curr = (selectedProduct.currency as "HTG" | "USD") || "HTG";
      setCurrency(curr);
      setPriceText(curr === "USD" ? `$${selectedProduct.price_cents / 100}` : formatMoney(selectedProduct.price_cents));
    }
  }, [selectedProductId]);

  const themeStyles = {
    tiktok: {
      bg: "bg-gradient-to-b from-amber-600 via-rose-600 to-purple-950 text-white",
      badge: "bg-yellow-400 text-black font-black",
      priceTag: "bg-white text-rose-700 font-black",
      border: "border-yellow-400/50",
    },
    luxe: {
      bg: "bg-gradient-to-b from-slate-900 via-neutral-900 to-black text-white",
      badge: "bg-amber-400 text-black font-black",
      priceTag: "bg-amber-500 text-slate-950 font-black",
      border: "border-amber-400/40",
    },
    whatsapp: {
      bg: "bg-gradient-to-b from-emerald-700 via-teal-800 to-slate-950 text-white",
      badge: "bg-emerald-300 text-slate-950 font-black",
      priceTag: "bg-white text-emerald-900 font-black",
      border: "border-emerald-400/40",
    },
    facebook: {
      bg: "bg-gradient-to-b from-blue-700 via-indigo-900 to-slate-950 text-white",
      badge: "bg-blue-300 text-slate-950 font-black",
      priceTag: "bg-white text-blue-900 font-black",
      border: "border-blue-400/40",
    },
  };

  const currentTheme = themeStyles[styleTheme];

  // ==========================================
  // DIRECTIVE #4 : GÉNÉRATION VÉRITABLE IMAGE CANVAS HD 9:16 + NATIVE SHARE
  // ==========================================
  async function generatePosterFile(): Promise<File | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Dimensions 9:16 HD (1080 x 1920 px)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background Gradient according to theme
    let gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    if (styleTheme === "tiktok") {
      gradient.addColorStop(0, "#d97706");
      gradient.addColorStop(0.5, "#e11d48");
      gradient.addColorStop(1, "#3b0764");
    } else if (styleTheme === "luxe") {
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(0.5, "#171717");
      gradient.addColorStop(1, "#000000");
    } else if (styleTheme === "whatsapp") {
      gradient.addColorStop(0, "#047857");
      gradient.addColorStop(0.5, "#115e59");
      gradient.addColorStop(1, "#020617");
    } else {
      gradient.addColorStop(0, "#1d4ed8");
      gradient.addColorStop(0.5, "#312e81");
      gradient.addColorStop(1, "#020617");
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Header : Store Name & Logo
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(storeName, 120, 140);

    // Headline Badge
    ctx.fillStyle = styleTheme === "luxe" ? "#fbbf24" : "#facc15";
    ctx.beginPath();
    ctx.roundRect(120, 200, 840, 100, 50);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "black 44px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(headline, 540, 265);

    // Product Photo Frame 3:4 aspect ratio (450px x 600px 300DPI equivalent in canvas: 675px x 900px)
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(202, 360, 675, 900, 48);
    ctx.fill();

    // Draw Product Image
    const imgUrl = selectedProduct?.photo_url || selectedProduct?.photos?.[0];
    if (imgUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(202, 360, 675, 900, 48);
          ctx.clip();
          ctx.drawImage(img, 202, 360, 675, 900);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imgUrl;
      });
    }

    // Editable Product Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(productName, 540, 1340);

    // Editable Price Badge
    ctx.fillStyle = styleTheme === "luxe" ? "#f59e0b" : "#ffffff";
    ctx.beginPath();
    ctx.roundRect(340, 1390, 400, 90, 45);
    ctx.fill();

    ctx.fillStyle = styleTheme === "luxe" ? "#020617" : "#be123c";
    ctx.font = "black 50px system-ui, sans-serif";
    ctx.fillText(priceText, 540, 1452);

    // Call to Action Box & Storefront Link
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(120, 1530, 840, 240, 36);
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 38px system-ui, sans-serif";
    ctx.fillText(ctaText, 540, 1610);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 44px monospace";
    ctx.fillText(customStoreLink, 540, 1690);

    // Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillText("✨ Kreye sou CONVERZA (converza.app)", 540, 1850);

    // Convert Canvas to File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `afich-9x16-${storeSlug}.png`, { type: "image/png" });
        resolve(file);
      }, "image/png");
    });
  }

  // Telechaje Direct HD PNG
  async function downloadHDPoster() {
    setIsGenerating(true);
    const file = await generatePosterFile();
    setIsGenerating(false);
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `afich-pub-9x16-${storeSlug}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg("✓ Afich Imaj HD 9:16 an telechaje avèk siksè !");
    setTimeout(() => setStatusMsg(null), 4000);
  }

  // Partage de l'image sans message texte superflu : uniquement "Kòmande sou :" avec le lien de la vitrine + l'image
  async function shareWithImageAndLink(targetSocial: string) {
    setIsGenerating(true);
    const file = await generatePosterFile();
    setIsGenerating(false);

    // Texte épuré à 100% selon la demande explicite de l'utilisateur
    const captionText = `Kòmande sou : ${storeUrl}`;

    // Si le navigateur supporte Web Share API avec fichier image (Mobile / Chrome)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          text: captionText,
          files: [file],
        });
        setStatusMsg("✓ Afich imaj ak lyen vitrin pibliye !");
        setTimeout(() => setStatusMsg(null), 4000);
        return;
      } catch (e) {
        // Fallback si annulé ou non supporté
      }
    }

    // Fallback standard : Télécharge l'image + copie uniquement le lien de la vitrine et ouvre le réseau social
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `afich-pub-9x16-${storeSlug}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }

    navigator.clipboard.writeText(captionText).then(() => {
      if (targetSocial === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(captionText)}`, "_blank");
        setStatusMsg("✓ Afich telechaje & lyen vitrin kopye pou WhatsApp!");
      } else if (targetSocial === "tiktok") {
        window.open("https://www.tiktok.com", "_blank");
        setStatusMsg("✓ Afich telechaje & lyen vitrin kopye pou TikTok!");
      } else if (targetSocial === "instagram") {
        window.open("https://www.instagram.com", "_blank");
        setStatusMsg("✓ Afich telechaje & lyen vitrin kopye pou Instagram!");
      } else {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`, "_blank");
        setStatusMsg("✓ Afich telechaje & partage Facebook ouvè!");
      }
      setTimeout(() => setStatusMsg(null), 5000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex w-full max-w-5xl flex-col md:flex-row gap-6 rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Colonne Gauche : Formulaire de Personnalisation & Textes Éditables (Directive #3) */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 font-black text-lg">
                ✨
              </span>
              <div className="flex flex-col">
                <h2 className="text-base font-extrabold text-ink">Générateur d'Affiche Pub IA (9:16)</h2>
                <span className="text-xs text-ink-muted">Format 9:16 • Photo 450x600 px • Textes 100% Édition</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 font-bold hover:text-ink cursor-pointer">✕</button>
          </div>

          {statusMsg && (
            <div className="rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-900 border border-emerald-300 animate-in fade-in">
              {statusMsg}
            </div>
          )}

          {/* Sélecteur de Produit - Liste Propre Katalòg */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-extrabold text-ink">1. Chwazi Pwodwi nan Katalòg la :</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-3 text-xs font-bold text-ink outline-none cursor-pointer focus:border-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  📌 {p.name} — {p.currency === "USD" ? `$${p.price_cents / 100}` : formatMoney(p.price_cents)}
                </option>
              ))}
            </select>
          </label>

          {/* DIRECTIVE #3 : TEXTES ÉDITABLES PAR LE MARCHAND + DEVISE HTG/USD */}
          <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>✏️ Modifye Tèks Afich la ak Deviz (Édition Directe) :</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-ink-muted">Slogan / Mesaj Rabè (Ou ekri l) :</span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Eg: Vant Flach -20% oswa Rabi Spécial"
                  className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-ink outline-none focus:border-amber-500"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-ink-muted">Titre Pwodwi :</span>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-ink outline-none focus:border-amber-500"
                />
              </label>

              <div className="grid grid-cols-3 gap-1">
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-[11px] font-bold text-ink-muted">Pri Afich :</span>
                  <input
                    type="text"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    className="h-9 rounded-lg border border-line bg-white px-2 text-xs font-bold text-ink outline-none focus:border-amber-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-ink-muted">Deviz :</span>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurr = e.target.value as "HTG" | "USD";
                      setCurrency(newCurr);
                      if (newCurr === "USD" && !priceText.includes("$")) {
                        setPriceText(`$${selectedProduct.price_cents / 100}`);
                      } else if (newCurr === "HTG" && priceText.includes("$")) {
                        setPriceText(formatMoney(selectedProduct.price_cents));
                      }
                    }}
                    className="h-9 rounded-lg border border-line bg-white px-1 text-xs font-bold text-ink outline-none cursor-pointer"
                  >
                    <option value="HTG">HTG</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-ink-muted">Texte Bouton CTA :</span>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-ink outline-none focus:border-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Style Visuel */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ink">Thème Visuel 9:16 :</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStyleTheme("tiktok")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  styleTheme === "tiktok" ? "bg-rose-600 text-white border-rose-600" : "bg-[#F8FAFC] text-ink border-line"
                }`}
              >
                <span>🎵 TikTok / Reels</span>
              </button>
              <button
                onClick={() => setStyleTheme("luxe")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  styleTheme === "luxe" ? "bg-slate-900 text-white border-slate-900" : "bg-[#F8FAFC] text-ink border-line"
                }`}
              >
                <span>✨ Luxe & Premium</span>
              </button>
              <button
                onClick={() => setStyleTheme("whatsapp")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  styleTheme === "whatsapp" ? "bg-emerald-600 text-white border-emerald-600" : "bg-[#F8FAFC] text-ink border-line"
                }`}
              >
                <span>💬 WhatsApp Status</span>
              </button>
              <button
                onClick={() => setStyleTheme("facebook")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  styleTheme === "facebook" ? "bg-blue-600 text-white border-blue-600" : "bg-[#F8FAFC] text-ink border-line"
                }`}
              >
                <span>📘 Facebook Story</span>
              </button>
            </div>
          </div>

          {/* DIRECTIVE #4 : BOUTONS DE PARTAGE (AFICH IMAJ + LYEN AN ANNDAN) */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-extrabold text-ink">Partage Imaj Afich HD + Lyen Vitrin en dessous :</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => shareWithImageAndLink("tiktok")}
                disabled={isGenerating}
                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-black text-xs font-black text-white shadow-sm hover:bg-neutral-800 cursor-pointer transition-all active:scale-95 border border-neutral-700"
              >
                <span>🎵 TikTok</span>
              </button>

              <button
                onClick={() => shareWithImageAndLink("instagram")}
                disabled={isGenerating}
                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-xs font-black text-white shadow-sm hover:opacity-95 cursor-pointer transition-all active:scale-95"
              >
                <span>📸 Instagram</span>
              </button>

              <button
                onClick={() => shareWithImageAndLink("facebook")}
                disabled={isGenerating}
                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all active:scale-95"
              >
                <span>📘 Facebook</span>
              </button>

              <button
                onClick={() => shareWithImageAndLink("whatsapp")}
                disabled={isGenerating}
                className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-all active:scale-95"
              >
                <span>💬 WhatsApp Status</span>
              </button>
            </div>

            <button
              onClick={downloadHDPoster}
              disabled={isGenerating}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-xs font-black text-white shadow-md hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
            >
              <span>📥 Telechaje Imaj Afich HD (PNG 9:16 300DPI)</span>
            </button>
          </div>
        </div>

        {/* Colonne Droite : Canvas Visuel Format Exact 9:16 (Photo 450x600 px 300DPI) */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-ink-muted">Aperçu Canva 9:16 Live</span>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-700 border border-rose-500/20">
              📐 9:16 (Photo 450x600 px 300DPI)
            </span>
          </div>

          {/* Container Format 9:16 (324px x 576px aspect ratio 9:16) */}
          <div
            className={`relative flex flex-col justify-between overflow-hidden rounded-[36px] p-5 shadow-2xl transition-all duration-300 ${currentTheme.bg}`}
            style={{ width: "324px", height: "576px" }}
          >
            {/* Header : Logo & Store Name */}
            <div className="flex items-center justify-between z-10 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={storeName} className="h-8 w-8 rounded-xl object-cover border border-white/40 shadow-sm" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white font-black text-xs border border-white/30">
                    🏬
                  </div>
                )}
                <span className="text-xs font-black tracking-tight text-white leading-none">
                  {storeName}
                </span>
              </div>

              <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider ${currentTheme.badge}`}>
                {headline}
              </span>
            </div>

            {/* DIRECTIVE #2 : Frame Photo Produit 450x600 px 300DPI (Aspect Ratio 3:4) */}
            <div className="relative my-auto flex flex-col items-center justify-center">
              <div className={`relative h-60 w-44 overflow-hidden rounded-3xl border-2 shadow-2xl ${currentTheme.border}`}>
                {selectedProduct?.photo_url || (selectedProduct?.photos && selectedProduct.photos[0]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProduct.photo_url || selectedProduct.photos?.[0]}
                    alt={productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 font-black text-3xl">
                    🛍️
                  </div>
                )}
              </div>
              <span className="mt-1 text-[9px] font-bold text-white/60">Photo HD (450x600 px 300DPI)</span>
            </div>

            {/* DIRECTIVE #3 : Textes Éditables en Rendu Live */}
            <div className="flex flex-col gap-2 text-center z-10">
              <h3 className="text-sm font-black leading-snug tracking-tight text-white drop-shadow-md truncate">
                {productName}
              </h3>

              <div className="mx-auto flex items-center justify-center">
                <span className={`rounded-2xl px-4 py-1 text-sm shadow-lg ${currentTheme.priceTag}`}>
                  {priceText}
                </span>
              </div>

              {/* Banner CTA & Link */}
              <div className="mt-1 flex flex-col gap-0.5 rounded-2xl bg-black/50 p-2 backdrop-blur-md border border-white/20">
                <span className="text-[9.5px] font-black uppercase text-yellow-300 tracking-wider">
                  {ctaText}
                </span>
                <span className="text-[10px] font-mono font-bold text-white tracking-wide truncate">
                  {customStoreLink}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
