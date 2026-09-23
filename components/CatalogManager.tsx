"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { BulkExcelManager } from "@/components/BulkExcelManager";
import { ImageUpload } from "@/components/ImageUpload";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { CATALOG_COPY } from "@/lib/i18n/app/catalog";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { formatMoney } from "@/lib/money";
import { getRolePermissions } from "@/lib/rbac";
import { verticalOf } from "@/lib/verticals";
import { saveProduct, deleteProduct, type ProductInput } from "@/app/katalog/actions";
import type { Business, Product } from "@/lib/types";
import type { UserSession } from "@/lib/rbac";
import { categoriesFor, categoryLabel } from "@/lib/categories";

const EMPTY = (currency: "HTG" | "USD"): ProductInput => ({
  name: "",
  category: "",
  priceGdes: "",
  costGdes: "",
  currency,
  unit: "",
  stockQty: "",
  stockState: "en_stok",
  photoUrl: null,
  photoUrl2: null,
  photoUrl3: null,
  inShowcase: false,
  isActive: true,
});

export function CatalogManager({ business, initial, userSession }: { business: Business; initial: Product[]; userSession?: UserSession }) {
  const k = useDict(CATALOG_COPY);
  const c = useDict(COMMON_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const vertical = verticalOf(business.business_type);
  const canEdit = userSession ? getRolePermissions(userSession).canEditCatalog : true;
  const [form, setForm] = useState<ProductInput | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setError(null);
    setForm(EMPTY(business.default_currency));
  }

  function openEdit(p: Product) {
    setError(null);
    const photos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
    setForm({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      priceGdes: String(p.price_cents / 100),
      costGdes: p.cost_cents == null ? "" : String(p.cost_cents / 100),
      currency: p.currency,
      unit: p.unit ?? "",
      stockQty: p.stock_qty == null ? "" : String(p.stock_qty),
      stockState: p.stock_state,
      photoUrl: photos[0] ?? null,
      photoUrl2: photos[1] ?? null,
      photoUrl3: photos[2] ?? null,
      inShowcase: p.in_showcase === true,
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
        setError(res.error ?? c.actions.retry);
      }
    });
  }

  function remove(p: Product) {
    if (!confirm(k.deleteConfirm(p.name))) return;
    start(async () => {
      await deleteProduct(p.id);
      router.refresh();
    });
  }

  const set = (patch: Partial<ProductInput>) => setForm((f) => (f ? { ...f, ...patch } : f));

  // Marge unitaire affichée sous le prix d'achat dès que les deux sont saisis.
  function marginHint(f: ProductInput): string | null {
    const price = parseFloat(f.priceGdes.replace(",", "."));
    const cost = parseFloat((f.costGdes ?? "").replace(",", "."));
    if (!Number.isFinite(price) || !Number.isFinite(cost) || price <= 0) return null;
    const margin = price - cost;
    return k.form.margin(formatMoney(Math.round(margin * 100), f.currency), Math.round((margin / price) * 100));
  }

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-[#F7F8F9] pb-[110px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <h1 className="text-[21px] font-extrabold tracking-tight text-white">{k.title}</h1>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{k.count(initial.length)}</span>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/b/${business.slug}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 active:scale-95"
          >
            {k.viewStore}
          </a>
          {/* Ordinateur et tablette : le bouton d'ajout vit dans l'en-tête, à
              l'intérieur du cadre de la page. */}
          {canEdit && initial.length > 0 && (
            <button
              onClick={openNew}
              className="hidden cursor-pointer items-center gap-1.5 rounded-xl bg-brand-green px-3 py-1.5 text-xs font-extrabold text-white shadow-sm active:scale-95 md:flex"
            >
              <span aria-hidden="true">+</span>
              {k.addProduct}
            </button>
          )}
          <div className="md:hidden">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {!canEdit && (
        <p className="border-b border-amber-300 bg-amber-100 p-3.5 text-xs font-semibold text-amber-950">{k.readOnly}</p>
      )}

      {initial.length > 0 && (
        <div className="flex items-center justify-end gap-1 px-4 py-3">
          <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === mode ? "bg-brand text-white" : "text-ink-muted hover:bg-gray-50"}`}
              >
                {k.view[mode]}
              </button>
            ))}
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <div className="mx-4 my-6 flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-8 text-center">
          <h2 className="text-base font-extrabold text-ink">{k.empty.title}</h2>
          <p className="mt-2 max-w-[380px] text-[13px] leading-relaxed text-ink-muted">{k.empty.desc}</p>
          {canEdit && (
            <button onClick={openNew} className="mt-4 h-11 cursor-pointer rounded-xl bg-brand-green px-5 text-sm font-bold text-white active:scale-95">
              {k.empty.cta}
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4">
          {initial.map((p) => {
            const photos = p.photos && p.photos.length > 0 ? p.photos : p.photo_url ? [p.photo_url] : [];
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-slate-100">
                  {photos.length > 0 ? (
                    <>
                      {/* La photo entiere, jamais recadree ; le vide autour est
                          comble par la meme photo floutee, comme sur la vitrine. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[0]} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[0]} alt={p.name} className="relative h-full w-full object-contain" />
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">{k.noPhoto}</span>
                  )}
                  {!p.is_active && (
                    <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">{k.hidden}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between gap-1 p-3">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="line-clamp-1 text-xs font-bold text-ink">{p.name}</h3>
                    <span className="text-xs font-extrabold text-brand">{formatMoney(p.price_cents, p.currency)}</span>
                    <span className="text-[10.5px] font-medium text-ink-faint">
                      {categoryLabel(p.category, language) || k.general} · {p.stock_qty ?? "—"} {k.stockState[p.stock_state]}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2">
                      <button onClick={() => openEdit(p)} className="flex-1 cursor-pointer rounded-xl bg-[#E7F7F1] py-1.5 text-[11px] font-extrabold text-brand">
                        {c.actions.edit}
                      </button>
                      <button
                        onClick={() => remove(p)}
                        aria-label={c.actions.delete}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-[#FCE4E4]"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#F0F2F3]">
          {initial.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{p.name}</span>
                  {!p.is_active && <span className="rounded bg-[#EFF2F3] px-1.5 text-[10px] font-semibold text-ink-faint">{k.hidden}</span>}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-ink-faint">
                  <span className="font-semibold text-ink">{formatMoney(p.price_cents, p.currency)}</span>
                  {p.category && <span>· {categoryLabel(p.category, language)}</span>}
                  <span>
                    · {p.stock_qty ?? "—"} {k.stockState[p.stock_state]}
                  </span>
                </div>
              </div>
              {canEdit && (
                <>
                  <button onClick={() => openEdit(p)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#E7F7F1]" aria-label={c.actions.edit}>
                    <PencilIcon />
                  </button>
                  <button onClick={() => remove(p)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#FCE4E4]" aria-label={c.actions.delete}>
                    <TrashIcon />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* L'import de fichier vient après le catalogue : on ajoute un produit bien
          plus souvent qu'on n'importe un fichier Excel. */}
      {canEdit && (
        <div className="p-4">
          <BulkExcelManager business={business} />
        </div>
      )}

      {/* Bouton flottant réservé au téléphone, et seulement quand le catalogue
          n'est pas vide : sinon il doublait le bouton de l'état vide et, sur
          grand écran, se plaçait hors du cadre de la page. */}
      {canEdit && initial.length > 0 && (
        <button
          onClick={openNew}
          className="fixed bottom-[92px] right-4 z-20 flex h-14 cursor-pointer items-center gap-2 rounded-2xl bg-brand-green px-5 shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-95 md:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[15px] font-bold text-white">{k.addProduct}</span>
        </button>
      )}

      {form && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[560px] flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
          <div className="relative max-h-[90dvh] overflow-y-auto rounded-t-[24px] bg-white px-5 pb-8 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{form.id ? k.form.editTitle : k.form.newTitle}</h2>
              <button onClick={() => setForm(null)} className="cursor-pointer text-sm font-semibold text-ink-muted">
                {c.actions.cancel}
              </button>
            </div>

            {error && <p className="mt-3 rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</p>}

            <div className="mt-4 flex flex-col gap-3.5">
              <div className="grid grid-cols-3 gap-3">
                <Field label={k.form.photo1}>
                  <ImageUpload value={form.photoUrl} folder="products" onChange={(url) => set({ photoUrl: url })} label={k.form.addPhoto} />
                </Field>
                <Field label={k.form.photo2}>
                  <ImageUpload value={form.photoUrl2 ?? null} folder="products" onChange={(url) => set({ photoUrl2: url })} label={k.form.addPhoto} />
                </Field>
                <Field label={k.form.photo3}>
                  <ImageUpload value={form.photoUrl3 ?? null} folder="products" onChange={(url) => set({ photoUrl3: url })} label={k.form.addPhoto} />
                </Field>
              </div>

              {/* Le marchand décide de ce qui passe en vitrine ; le reste
                  reste accessible dans le catalogue complet. */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-[#F9FBFB] p-3">
                <input
                  type="checkbox"
                  checked={form.inShowcase === true}
                  onChange={(e) => set({ inShowcase: e.target.checked })}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#008069]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-bold text-ink">{k.form.showcase}</span>
                  <span className="text-[12px] leading-snug text-ink-muted">{k.form.showcaseHint}</span>
                </span>
              </label>

              <Field label={k.form.name}>
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder={k.form.namePlaceholder} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={k.form.price(form.currency)}>
                  <input value={form.priceGdes} onChange={(e) => set({ priceGdes: e.target.value })} inputMode="decimal" className={inputCls} placeholder="180" />
                </Field>
                <Field label={k.form.unit}>
                  <input value={form.unit} onChange={(e) => set({ unit: e.target.value })} className={inputCls} placeholder={k.form.unitPlaceholder} />
                </Field>
              </div>

              <Field label={k.form.cost(form.currency)} hint={marginHint(form) ?? k.form.costHelp}>
                <input value={form.costGdes ?? ""} onChange={(e) => set({ costGdes: e.target.value })} inputMode="decimal" className={inputCls} placeholder="120" />
              </Field>

              <Field label={k.form.category}>
                <input value={form.category} onChange={(e) => set({ category: e.target.value })} list="cats" className={inputCls} placeholder={k.form.categoryPlaceholder} />
                <datalist id="cats">
                  {categoriesFor(business.business_type, language).map((cat) => (
                    <option key={cat.label} value={cat.label} />
                  ))}
                </datalist>
              </Field>

              {/* L'état du stock (en stock / faible / épuisé) se déduit de la
                  quantité et du seuil : le choisir à la main permettait
                  d'afficher « en stock » sur un produit déjà épuisé. */}
              <Field label={k.form.stockQty} hint={k.form.stockQtyHelp}>
                <input value={form.stockQty} onChange={(e) => set({ stockQty: e.target.value })} inputMode="numeric" className={inputCls} placeholder={k.form.stockQtyHint} />
              </Field>

              <label className="flex items-center gap-3 pt-1">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-5 w-5 accent-[#008069]" />
                <span className="text-sm font-medium text-ink-soft">{k.form.visible}</span>
              </label>

              <button
                onClick={submit}
                disabled={pending}
                className="mt-2 flex h-[52px] cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? c.actions.saving : form.id ? k.form.submitEdit : k.form.submitNew}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-ink-muted">{hint}</span>}
    </label>
  );
}

function PencilIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}
