"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { updateProductStock } from "@/app/katalog/actions";
import { generateSalesReportCSV, triggerSalesReportPDF } from "@/lib/reports";
import type { Business, PipelineCard, Product, StockState } from "@/lib/types";
import { useTranslation } from "@/components/LanguageContext";

export function StockManager({
  business,
  initialProducts,
  cards,
}: {
  business: Business;
  initialProducts: Product[];
  cards: PipelineCard[];
}) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "alert" | "out">("all");
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");
  const [, startTransition] = useTransition();

  // Statistiques d'inventaire
  const totalStockValuationCents = products.reduce(
    (acc, p) => acc + p.price_cents * (p.stock_qty ?? 0),
    0,
  );
  const alertCount = products.filter(
    (p) => p.stock_state === "ba_stok" || p.stock_state === "fini",
  ).length;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "out") return matchSearch && p.stock_state === "fini";
    if (filter === "alert") return matchSearch && (p.stock_state === "ba_stok" || p.stock_state === "fini");
    return matchSearch;
  });

  function handleQtyChange(p: Product, newQty: number) {
    const qty = Math.max(0, newQty);
    let state: StockState = "en_stok";
    if (qty === 0) state = "fini";
    else if (qty <= (p.stock_threshold ?? 5)) state = "ba_stok";

    setProducts((list) =>
      list.map((item) => (item.id === p.id ? { ...item, stock_qty: qty, stock_state: state } : item)),
    );

    startTransition(() => {
      updateProductStock(p.id, qty, state);
    });
  }

  function downloadCSV() {
    const csvStr = generateSalesReportCSV(cards, products, timeframe, business.name);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rapo_Vant_Stok_${business.name.replace(/\s+/g, "_")}_${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPDF() {
    triggerSalesReportPDF(cards, products, timeframe, business.name);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Carte d'Aperçu & Valeur Totale du Stock */}
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#008069] to-[#075E54] p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-lg">📦</span>
            <span className="text-sm font-black tracking-tight">Valè Stòk & Envantè</span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-extrabold">
            {products.length} pwodwi
          </span>
        </div>

        <div className="flex items-baseline justify-between border-t border-white/15 pt-2">
          <span className="text-xs font-semibold text-[#B9F5E4]">Valè total nan stòk :</span>
          <span className="text-xl font-extrabold text-white">{formatMoney(totalStockValuationCents)}</span>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200 border border-amber-300/30">
            <span>⚠️ Alèty Stòk ({alertCount} pwodwi ki ba/fini)</span>
            <button onClick={() => setFilter("alert")} className="underline font-extrabold cursor-pointer">Wè yo</button>
          </div>
        )}
      </section>

      {/* Barre de Génération des Rapports Excel & PDF */}
      <section className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 shadow-sm border border-line">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-ink uppercase">Télécharger Rapò Vant ak Stòk :</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-ink outline-none border border-line"
          >
            <option value="week">Semenn sa a</option>
            <option value="month">Mwa sa a</option>
            <option value="all">Tout tan</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={downloadCSV}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-extrabold text-emerald-950 shadow-2xs active:scale-95 cursor-pointer hover:bg-emerald-100"
          >
            <span>📥 Rapò Excel (.csv)</span>
          </button>

          <button
            onClick={exportPDF}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 text-xs font-extrabold text-red-950 shadow-2xs active:scale-95 cursor-pointer hover:bg-red-100"
          >
            <span>📄 Rapò PDF Imprimer</span>
          </button>
        </div>
      </section>

      {/* Filtres & Recherche de Produits */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Cherche yon pwodwi nan enventè..."
          className="h-10 w-full rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink outline-none focus:border-brand"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all ${
              filter === "all" ? "bg-brand text-white shadow-xs" : "bg-white border border-line text-ink-muted"
            }`}
          >
            Tout ({products.length})
          </button>
          <button
            onClick={() => setFilter("alert")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all ${
              filter === "alert" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 border border-amber-200 text-amber-900"
            }`}
          >
            ⚠️ Alèty ({alertCount})
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all ${
              filter === "out" ? "bg-red-600 text-white shadow-xs" : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            🛑 Rupture
          </button>
        </div>
      </div>

      {/* Liste d'Ajustement Rapide des Stocks (Envantè) */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((p) => {
          const isFini = p.stock_state === "fini";
          const isBa = p.stock_state === "ba_stok";
          const currentQty = p.stock_qty ?? 0;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-2xl border p-3 bg-white shadow-xs ${
                isFini ? "border-red-300 bg-red-50/30" : isBa ? "border-amber-300 bg-amber-50/30" : "border-line"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover border border-line" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">📦</div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-ink truncate">{p.name}</span>
                  <span className="text-[11px] font-medium text-ink-muted">
                    {(p.price_cents / 100).toFixed(2)} {p.currency}
                  </span>
                </div>
              </div>

              {/* Contrôles de Quantité (+ / -) */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={() => handleQtyChange(p, currentQty - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-gray-100 text-sm font-black text-ink active:scale-90 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) => handleQtyChange(p, parseInt(e.target.value, 10) || 0)}
                  className={`h-8 w-12 rounded-xl border text-center text-xs font-extrabold outline-none ${
                    isFini
                      ? "border-red-400 bg-red-100 text-red-900"
                      : isBa
                      ? "border-amber-400 bg-amber-100 text-amber-900"
                      : "border-line bg-gray-50 text-ink"
                  }`}
                />
                <button
                  onClick={() => handleQtyChange(p, currentQty + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-green bg-brand-green/20 text-sm font-black text-brand active:scale-90 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-ink-faint">
            Pa gen pwodwi ki korresponn ak chèch la.
          </div>
        )}
      </div>
    </div>
  );
}
