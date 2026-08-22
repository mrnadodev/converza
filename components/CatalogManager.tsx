"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { formatMoney } from "@/lib/money";
import { verticalOf } from "@/lib/verticals";
import { saveProduct, deleteProduct, type ProductInput } from "@/app/katalog/actions";
import type { Business, Product, StockState } from "@/lib/types";

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
  isActive: true,
});

export function CatalogManager({ business, initial }: { business: Business; initial: Product[] }) {
  const router = useRouter();
  const vertical = verticalOf(business.business_type);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setError(null);
    setForm(EMPTY(business.default_currency));
  }
  function openEdit(p: Product) {
    setError(null);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      priceGdes: String(p.price_cents / 100),
      currency: p.currency,
      unit: p.unit ?? "",
      stockQty: p.stock_qty == null ? "" : String(p.stock_qty),
      stockState: p.stock_state,
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
    <div className="relative min-h-[100dvh] bg-[#F7F8F9] pb-[110px]">
      <header className="flex items-center gap-2.5 bg-brand px-4 pb-4 pt-5">
        <span className="text-[21px] font-extrabold tracking-tight text-white">{vertical.catalogWord}</span>
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {initial.length}
        </span>
      </header>

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
            <button onClick={() => openEdit(p)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F7F1]" aria-label="Modifye">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </button>
            <button onClick={() => remove(p)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCE4E4]" aria-label="Efase">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            </button>
          </div>
        ))}
        {initial.length === 0 && (
          <p className="bg-white px-6 py-16 text-center text-sm text-ink-faint">Pa gen pwodwi. Ajoute premye a.</p>
        )}
      </div>

      {/* FAB ajouter */}
      <button
        onClick={openNew}
        className="fixed bottom-[92px] right-4 z-20 flex h-14 items-center gap-2 rounded-2xl bg-brand-green px-5 shadow-[0_6px_18px_rgba(37,211,102,0.45)] active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        <span className="text-[15px] font-bold text-white">Pwodwi</span>
      </button>

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
                className="mt-2 flex h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? "N ap sove…" : form.id ? "Sove chanjman" : "Ajoute pwodwi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="katalog" />
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
