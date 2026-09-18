"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { STOCK_COPY } from "@/lib/i18n/app/stock";
import { formatMoney } from "@/lib/money";
import { updateProductStock } from "@/app/katalog/actions";
import { generateSalesReportCSV, triggerSalesReportPDF } from "@/lib/reports";
import { stockStateFor } from "@/lib/stock_ai";
import type { Business, PipelineCard, Product } from "@/lib/types";

export function StockManager({
  business,
  initialProducts,
  cards,
  canEdit = true,
}: {
  business: Business;
  initialProducts: Product[];
  cards: PipelineCard[];
  canEdit?: boolean;
}) {
  const s = useDict(STOCK_COPY);
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");
  const [, startTransition] = useTransition();

  const valuationCents = products.reduce((acc, p) => acc + p.price_cents * (p.stock_qty ?? 0), 0);
  const lowCount = products.filter((p) => p.stock_state === "ba_stok" || p.stock_state === "fini").length;
  const outCount = products.filter((p) => p.stock_state === "fini").length;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "out") return matchSearch && p.stock_state === "fini";
    if (filter === "low") return matchSearch && (p.stock_state === "ba_stok" || p.stock_state === "fini");
    return matchSearch;
  });

  function changeQty(p: Product, newQty: number) {
    const qty = Math.max(0, newQty);
    // L'affichage anticipe ce que le serveur va conclure du seuil.
    const state = stockStateFor(qty, p.stock_threshold ?? 5);
    setProducts((list) => list.map((item) => (item.id === p.id ? { ...item, stock_qty: qty, stock_state: state } : item)));
    startTransition(() => {
      updateProductStock(p.id, qty);
    });
  }

  function downloadCSV() {
    const blob = new Blob([generateSalesReportCSV(cards, products, timeframe, business.name, language)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport-ventes-${business.name.replace(/\s+/g, "-").toLowerCase()}-${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 bg-brand px-4 pb-4 pt-5">
        <div className="flex flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{s.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{s.subtitle}</span>
        </div>
        <div className="md:hidden">
          <LanguageToggle />
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
        <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#008069] to-[#075E54] p-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black tracking-tight">{s.valuation.title}</h2>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-extrabold">{s.valuation.products(products.length)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 border-t border-white/15 pt-2">
            <span className="text-xs font-semibold text-[#B9F5E4]">{s.valuation.total}</span>
            <span className="text-xl font-extrabold">{formatMoney(valuationCents)}</span>
          </div>
          {lowCount > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/30 bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-100">
              <span>{s.alerts.text(lowCount)}</span>
              <button onClick={() => setFilter("low")} className="cursor-pointer font-extrabold underline">
                {s.alerts.see}
              </button>
            </div>
          )}
        </section>

        {products.length > 0 && (
          <section className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-extrabold uppercase text-ink">{s.reports.title}</h2>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
                className="cursor-pointer rounded-lg border border-line bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-ink outline-none"
              >
                <option value="week">{s.reports.week}</option>
                <option value="month">{s.reports.month}</option>
                <option value="all">{s.reports.all}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={downloadCSV} className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-[#F7F8F9] text-xs font-bold text-ink active:scale-95">
                {s.reports.csv}
              </button>
              <button
                onClick={() => triggerSalesReportPDF(cards, products, timeframe, business.name, language)}
                className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-[#F7F8F9] text-xs font-bold text-ink active:scale-95"
              >
                {s.reports.pdf}
              </button>
            </div>
          </section>
        )}

        {products.length === 0 ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-8 text-center">
            <h2 className="text-base font-extrabold text-ink">{s.empty.title}</h2>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{s.empty.desc}</p>
            <Link href="/katalog" className="mt-2 flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white">
              {s.empty.cta}
            </Link>
          </section>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={s.search}
                aria-label={s.search}
                className="h-10 w-full rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink outline-none focus:border-brand"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
                {([
                  ["all", s.filters.all(products.length)],
                  ["low", s.filters.low(lowCount)],
                  ["out", s.filters.out(outCount)],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === key ? "bg-brand text-white" : "border border-line bg-white text-ink-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {filtered.map((p) => {
                const out = p.stock_state === "fini";
                const low = p.stock_state === "ba_stok";
                const qty = p.stock_qty ?? 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 rounded-2xl border bg-white p-3 ${out ? "border-red-300" : low ? "border-amber-300" : "border-line"}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {p.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo_url} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-line object-cover" />
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100" />
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-ink">{p.name}</span>
                        <span className="text-[11px] font-medium text-ink-muted">{formatMoney(p.price_cents, p.currency)}</span>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => changeQty(p, qty - 1)}
                        disabled={!canEdit}
                        aria-label={s.decrease}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-line bg-gray-100 text-sm font-black text-ink active:scale-90 disabled:opacity-40"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={qty}
                        disabled={!canEdit}
                        aria-label={s.quantity}
                        onChange={(e) => changeQty(p, parseInt(e.target.value, 10) || 0)}
                        className={`h-8 w-14 rounded-xl border text-center text-xs font-extrabold outline-none disabled:opacity-60 ${
                          out ? "border-red-400 bg-red-50 text-red-900" : low ? "border-amber-400 bg-amber-50 text-amber-900" : "border-line bg-gray-50 text-ink"
                        }`}
                      />
                      <button
                        onClick={() => changeQty(p, qty + 1)}
                        disabled={!canEdit}
                        aria-label={s.increase}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-brand-green bg-brand-green/20 text-sm font-black text-brand active:scale-90 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-ink-faint">{s.empty.noMatch}</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
