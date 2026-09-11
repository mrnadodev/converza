"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ImageUpload } from "@/components/ImageUpload";
import { BulkExcelManager } from "@/components/BulkExcelManager";
import { formatMoney } from "@/lib/money";
import { verticalOf } from "@/lib/verticals";
import { saveProduct, deleteProduct, type ProductInput } from "@/app/katalog/actions";
import { StorefrontPreviewModal } from "@/components/StorefrontPreviewModal";
import type { Business, Product, StockState } from "@/lib/types";
import type { UserSession } from "@/lib/rbac";
import { useTranslation } from "@/components/LanguageContext";

const STOCK_LABEL: Record<StockState, string> = {
  en_stok: "En stòk",
  ba_stok: "Ba stòk",
  fini: "Fini",
};

const EMPTY = (currency: "HTG" | "USD"): ProductInput => ({
  name: "",
  category: "",
  priceGdes: "",
  currency,
  unit: "",
  stockQty: "",
  stockState: "en_stok",
  photoUrl: null,
  photoUrl2: null,
  isActive: true,
});

export function CatalogManager({ business, initial, userSession }: { business: Business; initial: Product[]; userSession?: UserSession }) {
  const { t } = useTranslation();
  const router = useRouter();
  const vertical = verticalOf(business.business_type);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setError(null);
    setForm(EMPTY(business.default_currency));
  }

  function openEdit(p: Product) {
    setError(null);
    const pPhotos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
    setForm({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      priceGdes: String(p.price_cents / 100),
      currency: p.currency,
      unit: p.unit ?? "",
      stockQty: p.stock_qty == null ? "" : String(p.stock_qty),
      stockState: p.stock_state,
      photoUrl: pPhotos[0] ?? null,
      photoUrl2: pPhotos[1] ?? null,
      isActive: p.is_active,
    });
  }

  function submit() {
    if (!form) return;
    setError(null);
    start(async () => {
      const res = await saveProduct(form);
      if (res.ok) {
        setForm(null);
        router.refresh();
      } else {
        setError(res.error ?? "Erè");
      }
    });
  }

  function remove(p: Product) {
    if (!confirm(`Efase "${p.name}" ?`)) return;
    start(async () => {
      await deleteProduct(p.id);
      router.refresh();
    });
  }

  const set = (patch: Partial<ProductInput>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-[#F7F8F9] pb-[110px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <span className="text-[21px] font-extrabold tracking-tight text-white">{t("catalog", "title")}</span>
        <button
          onClick={() => setShowPreviewModal(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>👁️ {t("nav", "viewStorefront")}</span>
        </button>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {initial.length}
        </span>
      </header>

      {/* Banner Dwa Aksè Katalòg */}
      {userSession && userSession.role !== "owner" && (
        <div className="bg-amber-100 border-b border-amber-300 p-3.5 text-xs font-bold text-amber-950 flex items-center justify-between">
          <span>🔒 Katalòg nan mòd Lekti sèlman. Sèl Mèt Antrepriz la (Fondateur) ki gen dwa ajoute oswa modifye pwodwi ak pwomosyon yo.</span>
        </div>
      )}

      {userSession?.role === "owner" && (
        <div className="p-4">
          <BulkExcelManager business={business} />
        </div>
      )}

      {/* Barre de Bascule de Vue : Vue Grille (450×750) vs Vue Liste */}
      {initial.length > 0 && (
        <div className="flex items-center justify-between bg-slate-100 px-4 py-3 border-b border-line">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Mòd Afichaj Katalòg:
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>📱 Vue Grille (450×750)</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                viewMode === "list" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>📋 Vue Liste</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === "grid" && initial.length > 0 ? (
        /* VUE GRILLE : Cartes avec dimension stricte ratio 450×750 px (3:5) */
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
          {initial.map((p) => {
            const allPhotos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
            return (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xs hover:shadow-xs transition-all">
                {/* Conteneur d'image à dimension uniforme 450x750 px (Ratio 3:5) */}
                <div className="relative aspect-[3/5] max-h-[300px] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  {allPhotos.length > 0 ? (
                    <img src={allPhotos[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">📷 Pa gen foto</span>
                  )}

                  {/* Badge 450×750 */}
                  <span className="absolute top-2 left-2 rounded-md bg-emerald-700/90 px-2 py-0.5 text-[9px] font-black text-white shadow-2xs">
                    450×750 px
                  </span>

                  {/* Badge nombre de photos (up to 2 photos) */}
                  {allPhotos.length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/85 px-2 py-0.5 text-[9px] font-black text-white shadow-2xs">
                      📷 2 Imaj
                    </span>
                  )}
                </div>

                <div className="flex flex-col p-3 gap-1 flex-1 justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                    <span className="text-xs font-black text-emerald-700">{formatMoney(p.price_cents, p.currency)}</span>
                    <div className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                      {p.category || "Jeneral"} · {p.stock_qty ?? "—"} {STOCK_LABEL[p.stock_state].toLowerCase()}
                    </div>
                  </div>

                  {(!userSession || userSession.role === "owner") && (
                    <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex-1 py-1.5 rounded-xl bg-[#E7F7F1] text-[11px] font-extrabold text-brand text-center hover:bg-emerald-200 transition-colors cursor-pointer"
                      >
                        ✏️ Modifye
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FCE4E4] text-[#C0392B] hover:bg-red-200 transition-colors cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VUE LISTE : Lignes horizontales */
        <div className="flex flex-col divide-y divide-[#F0F2F3]">
          {initial.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{p.name}</span>
                  {!p.is_active && <span className="rounded bg-[#EFF2F3] px-1.5 text-[10px] font-semibold text-ink-faint">Kache</span>}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-ink-faint">
                  <span className="font-semibold text-ink">{formatMoney(p.price_cents, p.currency)}</span>
                  {p.category && <span>· {p.category}</span>}
                  <span>· {p.stock_qty ?? "—"} {STOCK_LABEL[p.stock_state].toLowerCase()}</span>
                </div>
              </div>
              {(!userSession || userSession.role === "owner") && (
                <>
                  <button onClick={() => openEdit(p)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F7F1]" aria-label="Modifye">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </button>
                  <button onClick={() => remove(p)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCE4E4]" aria-label="Efase">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {initial.length === 0 && (
        <div className="mx-4 my-6 flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center border border-line shadow-2xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700 mb-3">
            🛍️
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Katalòg antrepriz la vid pou kounye a</h3>
          <p className="mt-1 max-w-[380px] text-xs text-slate-500">
            Katalòg <strong className="text-slate-800">{business.name}</strong> a poko gen pwodwi. Ou kapab gade yon **Aperçu sou vitrin nan** pa kalite biznis anvan ou ajoute pwòp pwodwi pa w yo !
          </p>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <span>👁️ Wè Aperçu Vitrine an pa Kalite Biznis</span>
          </button>
        </div>
      )}

      <StorefrontPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        businessName={business.name}
        businessType={business.business_type}
        logoUrl={business.logo_url}
        coverUrl={business.cover_url}
        realProducts={initial}
        isAdmin={!userSession || userSession.role === "owner"}
      />

      {/* FAB ajouter - Réserve uniquement au Fondateur / Owner */}
      {(!userSession || userSession.role === "owner") && (
        <button
          onClick={openNew}
          className="fixed bottom-[92px] right-4 z-20 flex h-14 items-center gap-2 rounded-2xl bg-brand-green px-5 shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-95 cursor-pointer"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          <span className="text-[15px] font-bold text-white">Ajoute Pwodwi</span>
        </button>
      )}

      {/* Formulaire (bottom sheet) */}
      {form && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[480px] flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
          <div className="relative max-h-[90dvh] overflow-y-auto rounded-t-[24px] bg-white px-5 pb-8 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{form.id ? "Modifye pwodwi" : "Nouvo pwodwi"}</h2>
              <button onClick={() => setForm(null)} className="text-sm font-semibold text-ink-muted">Anile</button>
            </div>

            {error && <div className="mt-3 rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</div>}

            <div className="mt-4 flex flex-col gap-3.5">
              {/* Formulaire Upload 2 Photos par Produit (Target size 450x750) */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Foto 1 (Prensipal 450x750)">
                  <ImageUpload value={form.photoUrl} folder="products" onChange={(url) => set({ photoUrl: url })} label="Ajoute foto 1" targetWidth={450} targetHeight={750} />
                </Field>
                <Field label="Foto 2 (Segondè 450x750)">
                  <ImageUpload value={form.photoUrl2 ?? null} folder="products" onChange={(url) => set({ photoUrl2: url })} label="Ajoute 2èm foto" targetWidth={450} targetHeight={750} />
                </Field>
              </div>

              <Field label="Non pwodwi">
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Ze fre" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Pri (${form.currency})`}>
                  <input value={form.priceGdes} onChange={(e) => set({ priceGdes: e.target.value })} inputMode="decimal" className={inputCls} placeholder="180" />
                </Field>
                <Field label="Inite">
                  <input value={form.unit} onChange={(e) => set({ unit: e.target.value })} className={inputCls} placeholder="douzèn" />
                </Field>
              </div>

              <Field label="Kategori">
                <input value={form.category} onChange={(e) => set({ category: e.target.value })} list="cats" className={inputCls} placeholder="Manje" />
                <datalist id="cats">
                  {vertical.defaultCategories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kantite stòk">
                  <input value={form.stockQty} onChange={(e) => set({ stockQty: e.target.value })} inputMode="numeric" className={inputCls} placeholder="42" />
                </Field>
                <Field label="Eta stòk">
                  <select value={form.stockState} onChange={(e) => set({ stockState: e.target.value as StockState })} className={inputCls}>
                    <option value="en_stok">En stòk</option>
                    <option value="ba_stok">Ba stòk</option>
                    <option value="fini">Fini</option>
                  </select>
                </Field>
              </div>

              <label className="flex items-center gap-3 pt-1">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-5 w-5 accent-[#008069]" />
                <span className="text-sm font-medium text-ink-soft">Vizib sou vitrin lan</span>
              </label>

              <button
                onClick={submit}
                disabled={pending}
                className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {pending ? "N ap sove…" : form.id ? "Sove chanjman" : "Ajoute pwodwi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="katalog" userSession={userSession} />
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
