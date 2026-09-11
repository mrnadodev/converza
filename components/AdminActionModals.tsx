"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { publishPromoAction } from "@/app/katalog/actions";
import { StorefrontPreviewModal } from "@/components/StorefrontPreviewModal";
import { AIPosterGeneratorModal } from "@/components/AIPosterGeneratorModal";
import type { Product } from "@/lib/types";

export interface AuditLog {
  id: string;
  agentName: string;
  role: string;
  action: string;
  time: string;
  badgeColor: string;
}

export function AdminHeaderActions({
  storeSlug,
  storeName = "Ti Kòk Boutik",
  products = [],
  businessType,
  logoUrl,
  coverUrl,
  realProducts,
  isAdmin = true,
}: {
  storeSlug: string;
  storeName?: string;
  products?: Product[];
  businessType?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  realProducts?: any[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  // Formulaire Pwomosyon
  const [selectedProductId, setSelectedProductId] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoCurrency, setPromoCurrency] = useState<"HTG" | "USD">("HTG");
  const [promoBadge, setPromoBadge] = useState("");
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const [promoFilePreview, setPromoFilePreview] = useState<string | null>(null);
  const [promoPublished, setPromoPublished] = useState(false);

  function handleSelectCatalogProduct(prodId: string) {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setPromoTitle(prod.name);
      setPromoPrice((prod.price_cents / 100).toString());
      setPromoCurrency((prod.currency as "HTG" | "USD") || "HTG");
      if (prod.photo_url || prod.photos?.[0]) {
        setPromoFilePreview(prod.photo_url || prod.photos?.[0] || null);
      }
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPromoFile(f);
    setPromoFilePreview(URL.createObjectURL(f));
  }

  async function handlePublishPromo() {
    if (!promoTitle) return;
    const photoUrl = promoFilePreview || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80";
    const formattedBadge = promoBadge.trim() || "-15% Promo";
    const finalPriceText = promoCurrency === "USD" ? `$${promoPrice || "25"}` : `${promoPrice || "2400"} HTG`;
    
    await publishPromoAction({
      title: promoTitle,
      priceGdes: finalPriceText,
      badge: formattedBadge,
      photoUrl,
    });
    setPromoPublished(true);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 md:col-span-2">
      {/* 1. Bouton Unifié : Pibliye Pwomosyon & Afich Pub IA */}
      <button
        onClick={() => setShowPromoModal(true)}
        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 px-4 text-xs font-black text-white shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer border border-amber-400/30"
      >
        <span>📢 Pibliye Pwomosyon & Afich Pub IA (9:16)</span>
      </button>

      {/* 2. Bouton Audit Aktivite Ajan */}
      <a
        href="/audit"
        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3.5 text-xs font-extrabold text-white shadow-2xs hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
      >
        <span>🔍 Audit Aktivite Ajan yo</span>
      </a>

      {/* 3. Bouton Apèsu Vitrin Piblik */}
      <button
        onClick={() => setShowPreviewModal(true)}
        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-extrabold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
      >
        <span>👁️ Apèsu Vitrin Piblik</span>
      </button>

      {/* ========================================== */}
      {/* MODAL UNIFIÉ : PIBLIYE PROMOSYON & STUDIO AFICH IA */}
      {/* ========================================== */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 font-extrabold text-base">
                  📢
                </span>
                <span className="text-base font-extrabold text-ink">Pibliye Pwomosyon & Afich Pub IA</span>
              </div>
              <button onClick={() => { setShowPromoModal(false); setPromoPublished(false); }} className="text-gray-400 font-bold hover:text-ink cursor-pointer">✕</button>
            </div>

            {promoPublished ? (
              <div className="flex flex-col gap-4 text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-2xl">
                  ✓
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-extrabold text-slate-900">Pwomosyon Pibliye sou Vitrin la !</span>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Nouvo pwomosyon <strong>{promoTitle}</strong> ({promoBadge}) an pibliye sou carrousel vitrin piblik la.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowPromoModal(false);
                      setShowPosterModal(true);
                    }}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-purple-600 text-xs font-black text-white shadow-md hover:bg-purple-700 cursor-pointer"
                  >
                    <span>✨ Generer Afich Pub IA 9:16 pou Pwomosyon sa a</span>
                  </button>
                  <button onClick={() => { setShowPromoModal(false); setPromoPublished(false); }} className="h-10 rounded-xl border border-line text-xs font-bold text-ink-muted cursor-pointer">
                    Fèmen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-purple-50 p-3 text-purple-950 border border-purple-200">
                  <span className="text-xs font-bold">💡 Pibliye sou vitrin an epi kreye afich 9:16 rezo sosyo an 1-click !</span>
                  <button
                    onClick={() => {
                      setShowPromoModal(false);
                      setShowPosterModal(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-purple-600 text-[11px] font-black text-white cursor-pointer hover:bg-purple-700"
                  >
                    ✨ Studio Afich Sèlman
                  </button>
                </div>

                {/* 1. Sélecteur Katalòg Pwodwi pwòp */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-ink">1. Chwazi Pwodwi nan Katalòg ou :</span>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                    className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-3 text-xs outline-none focus:border-amber-500 font-medium text-ink cursor-pointer"
                  >
                    <option value="">-- Klike pou chwazi yon pwodwi nan katalòg la --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        📌 {p.name} ({p.currency === "USD" ? `$${p.price_cents / 100}` : formatMoney(p.price_cents)})
                      </option>
                    ))}
                  </select>
                </label>

                {/* 2. Nom Pwodwi / Pwomosyon */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-ink">2. Non Pwodwi / Titre Pwomosyon :</span>
                  <input
                    type="text"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="Eg: Diri Tchako Supérieur (25kg)"
                    className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-3 text-xs outline-none focus:border-amber-500 font-medium text-ink"
                  />
                </label>

                {/* 3. Saisie Libre Mesaj Promo + Choix Monnaie HTG / USD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-ink">3. Mesaj Pwomosyon oswa Rabè :</span>
                    <input
                      type="text"
                      value={promoBadge}
                      onChange={(e) => setPromoBadge(e.target.value)}
                      placeholder="Eg: Vant Flach -20% oswa Rabi Spécial"
                      className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-3 text-xs outline-none focus:border-amber-500 font-medium text-ink"
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-1">
                    <label className="flex flex-col gap-1 col-span-2">
                      <span className="text-xs font-extrabold text-ink">Pri :</span>
                      <input
                        type="number"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        placeholder="2400"
                        className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-2.5 text-xs outline-none focus:border-amber-500 font-medium text-ink"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold text-ink">Deviz :</span>
                      <select
                        value={promoCurrency}
                        onChange={(e) => setPromoCurrency(e.target.value as "HTG" | "USD")}
                        className="h-10 rounded-xl border border-line bg-[#F8FAFC] px-1 text-xs font-bold outline-none cursor-pointer text-ink"
                      >
                        <option value="HTG">HTG</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-ink">Upload Foto Pwodwi HD (Fichye Imaj) :</span>
                  <label className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-900 text-xs font-bold cursor-pointer hover:bg-amber-100 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>{promoFile ? promoFile.name : "📷 Klike pou upload yon foto imaj direct"}</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {promoFilePreview && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-amber-300 bg-gray-100 mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={promoFilePreview} alt="Aperçu foto" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => setShowPromoModal(false)} className="h-10 px-4 rounded-xl border text-xs font-bold text-ink-muted cursor-pointer">Anule</button>
                  <button onClick={handlePublishPromo} className="h-10 px-5 rounded-xl bg-amber-500 text-xs font-black text-white shadow-2xs hover:bg-amber-600 cursor-pointer">
                    📢 Pibliye sou Vitrin & Deplwaye Afich
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2 : APÈSU VITRIN PIBLIK PA KALITE BIZNIS */}
      {/* ========================================== */}
      <StorefrontPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        businessName={storeSlug ? storeSlug.replace(/-/g, " ").toUpperCase() : "Antrepriz Paw la"}
        businessType={businessType}
        logoUrl={logoUrl}
        coverUrl={coverUrl}
        realProducts={realProducts}
        isAdmin={isAdmin}
      />

      {/* ========================================== */}
      {/* MODAL 3 : AFICH PUB IA 450x600 px (TIKTOK, INSTAGRAM, FACEBOOK, WHATSAPP) */}
      {/* ========================================== */}
      {showPosterModal && (
        <AIPosterGeneratorModal
          products={products}
          storeSlug={storeSlug}
          storeName={storeName}
          logoUrl={logoUrl}
          onClose={() => setShowPosterModal(false)}
        />
      )}
    </div>
  );
}
