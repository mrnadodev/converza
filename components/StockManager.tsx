"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { STOCK_COPY } from "@/lib/i18n/app/stock";
import { KES_COPY } from "@/lib/i18n/app/kes";
import { formatMoney } from "@/lib/money";
import { recordPurchase, recordStockMovement, type ManualMovementKind, type StockMovementError } from "@/app/stok/actions";
import { generateSalesReportCSV, triggerSalesReportPDF } from "@/lib/reports";
import { stockStateFor } from "@/lib/stock_ai";
import type { Business, PipelineCard, Product } from "@/lib/types";
import { Select } from "@/components/ui/Select";

export interface PurchaseRow {
  id: string;
  supplier: string | null;
  receivedOn: string;
  total: number;
  paid: number;
  currency: string;
  note: string | null;
  lines: { name: string; qty: number; unitCost: number }[];
}

export interface MovementRow {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  kind: "vente" | "annulation" | "entree" | "perte" | "correction";
  qtyAfter: number | null;
  note: string | null;
  createdAt: string;
  author: string | null;
  orderRef: string | null;
}

export function StockManager({
  business,
  initialProducts,
  cards,
  canEdit = true,
  movements = [],
  movementsAvailable = false,
  purchases = [],
  suppliers = [],
  purchasesAvailable = false,
}: {
  business: Business;
  initialProducts: Product[];
  cards: PipelineCard[];
  canEdit?: boolean;
  movements?: MovementRow[];
  /** Faux tant que la migration 5 n'a pas créé le journal. */
  movementsAvailable?: boolean;
  purchases?: PurchaseRow[];
  suppliers?: { id: string; name: string }[];
  /** Faux tant que la migration 6 n'a pas créé les tables d'achats. */
  purchasesAvailable?: boolean;
}) {
  const s = useDict(STOCK_COPY);
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");
  const [tab, setTab] = useState<"products" | "purchases" | "history">("products");
  const [editing, setEditing] = useState<Product | null>(null);
  const router = useRouter();

  const valuationCents = products.reduce((acc, p) => acc + p.price_cents * (p.stock_qty ?? 0), 0);
  const lowCount = products.filter((p) => p.stock_state === "ba_stok" || p.stock_state === "fini").length;
  const outCount = products.filter((p) => p.stock_state === "fini").length;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "out") return matchSearch && p.stock_state === "fini";
    if (filter === "low") return matchSearch && (p.stock_state === "ba_stok" || p.stock_state === "fini");
    return matchSearch;
  });

  // Chaque changement passe par un mouvement nommé (entrée, perte,
  // inventaire) : l'ancien pas-à-pas envoyait des totaux qui pouvaient
  // arriver dans le désordre et ne disait pas pourquoi le stock changeait.
  function applied(p: Product, qtyAfter: number | null) {
    const state = stockStateFor(qtyAfter, p.stock_threshold ?? 5);
    setProducts((list) => list.map((item) => (item.id === p.id ? { ...item, stock_qty: qtyAfter, stock_state: state } : item)));
    setEditing(null);
    router.refresh();
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
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
                triggerClassName="cursor-pointer rounded-lg border border-line bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-ink outline-none"
              >
                <option value="week">{s.reports.week}</option>
                <option value="month">{s.reports.month}</option>
                <option value="all">{s.reports.all}</option>
              </Select>
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

        {/* Onglets toujours visibles : les cacher quand le catalogue est vide
            faisait croire que les réceptions n'existaient pas. */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
            {(["products", "purchases", "history"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-pressed={tab === k}
                className={`h-9 flex-1 cursor-pointer rounded-lg text-xs font-extrabold ${tab === k ? "bg-brand text-white" : "text-ink-muted"}`}
              >
                {s.tabs[k]}
              </button>
            ))}
          </div>
          <p className="px-1 text-[11.5px] leading-snug text-ink-muted">{s.auto}</p>
        </div>

        {tab === "history" ? (
          <MovementHistory rows={movements} available={movementsAvailable} />
        ) : tab === "purchases" && products.length === 0 ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-8 text-center">
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{s.purchase.noProducts}</p>
            <Link href="/katalog" className="mt-1 flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white">
              {s.empty.cta}
            </Link>
          </section>
        ) : tab === "purchases" ? (
          <Purchases rows={purchases} suppliers={suppliers} products={products} available={purchasesAvailable} canEdit={canEdit} currency={business.default_currency ?? "HTG"} />
        ) : products.length === 0 ? (
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
                        <img src={p.photo_url} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-line object-contain" />
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100" />
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-ink">{p.name}</span>
                        <span className="text-[11px] font-medium text-ink-muted">{formatMoney(p.price_cents, p.currency)}</span>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-2">
                      <span
                        aria-label={s.quantity}
                        className={`flex h-8 min-w-12 items-center justify-center rounded-xl border px-2 text-xs font-extrabold ${
                          p.stock_qty === null
                            ? "border-line bg-gray-50 text-ink-faint"
                            : out
                              ? "border-red-400 bg-red-50 text-red-900"
                              : low
                                ? "border-amber-400 bg-amber-50 text-amber-900"
                                : "border-line bg-gray-50 text-ink"
                        }`}
                      >
                        {p.stock_qty === null ? s.untracked : qty}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => setEditing(p)}
                          className="flex h-8 cursor-pointer items-center justify-center rounded-xl border border-brand bg-[#E7F7F1] px-3 text-xs font-extrabold text-brand active:scale-95"
                        >
                          {s.movement.open}
                        </button>
                      )}
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

      {editing && <MovementSheet product={editing} onClose={() => setEditing(null)} onDone={(q) => applied(editing, q)} />}
    </>
  );
}

/* ─────────── Saisie d'un mouvement ─────────── */

function MovementSheet({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: (qtyAfter: number | null) => void }) {
  const s = useDict(STOCK_COPY);
  const [kind, setKind] = useState<ManualMovementKind>("entree");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<StockMovementError | null>(null);
  const [pending, start] = useTransition();

  const current = product.stock_qty;
  const n = Math.floor(Number(qty));
  const valid = qty !== "" && Number.isFinite(n) && (kind === "correction" ? n >= 0 : n > 0);
  // Même calcul que la base (apply_stock_movement), pour annoncer le résultat.
  const preview = !valid ? null : kind === "correction" ? n : Math.max((current ?? 0) + (kind === "entree" ? n : -n), 0);

  function save() {
    if (!valid) return setError("invalid");
    setError(null);
    start(async () => {
      const res = await recordStockMovement({ productId: product.id, kind, qty: n, note });
      if (res.ok) onDone(res.qtyAfter ?? preview);
      else setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={s.movement.title}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl sm:pb-5"
      >
        <div>
          <h2 className="text-base font-extrabold text-ink">{s.movement.title}</h2>
          <p className="truncate text-[13px] font-semibold text-ink-soft">{product.name}</p>
          <p className="text-[12px] text-ink-muted">{s.movement.current(current === null ? s.untracked : String(current))}</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(["entree", "perte", "correction"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`min-h-10 cursor-pointer rounded-xl px-1.5 text-[12px] font-extrabold leading-tight ${
                kind === k ? (k === "perte" ? "bg-[#C0392B] text-white" : "bg-brand text-white") : "border border-line bg-white text-ink-soft"
              }`}
            >
              {s.movement.kinds[k]}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold text-ink-muted">{s.movement.qtyLabel[kind]}</span>
          <input
            type="number"
            inputMode="numeric"
            min={kind === "correction" ? 0 : 1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            autoFocus
            className="h-12 rounded-xl border border-line bg-[#F7F8F9] px-4 text-lg font-extrabold text-ink outline-none focus:border-brand focus:bg-white"
          />
          {preview !== null && <span className="text-[12.5px] font-bold text-brand">{s.movement.after(preview)}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold text-ink-muted">{s.movement.note}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={s.movement.notePlaceholder}
            className="h-11 rounded-xl border border-line bg-[#F7F8F9] px-3 text-[13.5px] text-ink outline-none focus:border-brand focus:bg-white"
          />
        </label>

        {error && <p className="rounded-xl bg-[#FCE4E4] px-3 py-2 text-[12.5px] font-semibold text-[#C0392B]">{s.movement.errors[error]}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 cursor-pointer rounded-2xl border border-line bg-white text-sm font-bold text-ink">
            {s.movement.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !valid}
            className="h-12 cursor-pointer rounded-2xl bg-brand-green text-sm font-extrabold text-white disabled:opacity-50"
          >
            {pending ? s.movement.saving : s.movement.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Historique ─────────── */

function MovementHistory({ rows, available }: { rows: MovementRow[]; available: boolean }) {
  const s = useDict(STOCK_COPY);
  const { language } = useLanguage();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!available) return <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-[13px] text-ink-muted">{s.history.unavailable}</p>;
  if (rows.length === 0) return <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-[13px] text-ink-muted">{s.history.empty}</p>;

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white">
      <h2 className="border-b border-line px-3.5 py-3 text-xs font-extrabold uppercase text-ink">{s.history.title}</h2>
      <ul className="divide-y divide-line">
        {rows.map((m) => {
          const plus = m.delta > 0;
          return (
            <li key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <span
                className={`flex h-9 min-w-14 items-center justify-center rounded-xl px-2 text-[13px] font-extrabold ${
                  plus ? "bg-[#E7F7F1] text-brand" : m.delta < 0 ? "bg-[#FCE4E4] text-[#C0392B]" : "bg-gray-100 text-ink-muted"
                }`}
              >
                {plus ? "+" : ""}
                {m.delta}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-bold text-ink">{m.productName}</span>
                <span className="truncate text-[11.5px] text-ink-muted">
                  {s.history.kinds[m.kind]}
                  {m.orderRef ? ` · ${s.history.order(m.orderRef)}` : ""}
                  {m.note ? ` · ${m.note}` : ""}
                  {m.author ? ` · ${s.history.by(m.author)}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-[11px] text-ink-faint">{fmt(m.createdAt)}</span>
                {m.qtyAfter !== null && <span className="text-[11px] font-bold text-ink-soft">{s.history.after(String(m.qtyAfter))}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─────────── Réceptions ─────────── */

type Line = { productId: string; qty: string; unitCost: string };

function Purchases({
  rows,
  suppliers,
  products,
  available,
  canEdit,
  currency,
}: {
  rows: PurchaseRow[];
  suppliers: { id: string; name: string }[];
  products: Product[];
  available: boolean;
  canEdit: boolean;
  currency: "HTG" | "USD";
}) {
  const s = useDict(STOCK_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<StockMovementError | null>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Port-au-Prince" });

  // Le prix d'achat connu du produit pré-remplit la ligne.
  const costOf = (id: string) => {
    const c = products.find((p) => p.id === id)?.cost_cents;
    return c == null ? "" : String(c / 100);
  };
  const newLine = (): Line => ({ productId: products[0]?.id ?? "", qty: "", unitCost: costOf(products[0]?.id ?? "") });
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [supplierId, setSupplierId] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [paid, setPaid] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [receivedOn, setReceivedOn] = useState(today);

  const num = (v: string) => parseFloat(v.replace(",", "."));
  const totalCents = lines.reduce((a, l) => {
    const q = num(l.qty);
    const c = num(l.unitCost);
    return Number.isFinite(q) && Number.isFinite(c) ? a + Math.round(q * c * 100) : a;
  }, 0);
  const valid = lines.length > 0 && lines.every((l) => l.productId && num(l.qty) > 0 && num(l.unitCost) >= 0);
  const money = (c: number) => formatMoney(c, currency);
  const field = "h-10 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[13.5px] text-ink outline-none focus:border-brand focus:bg-white";
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  function save() {
    if (!valid) return setError("invalid");
    setError(null);
    start(async () => {
      const res = await recordPurchase({
        supplierId: supplierId || null,
        newSupplier: supplierId ? "" : newSupplier,
        items: lines.map((l) => ({ productId: l.productId, qty: num(l.qty), unitCost: l.unitCost })),
        paid: paid ?? String(totalCents / 100),
        payMethod,
        note,
        receivedOn,
      });
      if (res.ok) {
        setOpen(false);
        setLines([newLine()]);
        setPaid(null);
        setNote("");
        setNewSupplier("");
        router.refresh();
      } else setError(res.error);
    });
  }

  if (!available) return <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-[13px] text-ink-muted">{s.purchase.unavailable}</p>;

  return (
    <div className="flex flex-col gap-3">
      {canEdit && !open && (
        <button type="button" onClick={() => setOpen(true)} className="h-11 cursor-pointer rounded-2xl bg-brand text-sm font-extrabold text-white">
          + {s.purchase.new}
        </button>
      )}

      {open && (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3.5">
          <div>
            <h2 className="text-sm font-extrabold text-ink">{s.purchase.title}</h2>
            <p className="text-[11.5px] text-ink-muted">{s.purchase.hint}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.supplier}</span>
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} triggerClassName={field}>
                <option value="">{s.purchase.noSupplier}</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </Select>
            </label>
            {!supplierId && (
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.newSupplier}</span>
                <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} maxLength={80} placeholder={s.purchase.newSupplierPlaceholder} className={field} />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-[#F7F8F9] p-2.5">
                <Select
                  value={l.productId}
                  onChange={(e) => setLine(i, { productId: e.target.value, unitCost: costOf(e.target.value) })}
                  aria-label={s.purchase.product}
                  triggerClassName={`${field} col-span-2 bg-white`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-ink-muted">{s.purchase.qty}</span>
                    <input value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} inputMode="numeric" className={`${field} bg-white`} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-ink-muted">{s.purchase.unitCost} ({currency})</span>
                    <input value={l.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} inputMode="decimal" className={`${field} bg-white`} />
                  </label>
                </div>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    className="self-end rounded-lg px-2 py-2 text-[12px] font-bold text-[#C0392B]"
                  >
                    {s.purchase.removeLine}
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])} className="h-10 cursor-pointer rounded-xl border-2 border-dashed border-line text-[13px] font-bold text-brand">
              {s.purchase.addLine}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#E7F7F1] px-3 py-2.5">
            <span className="text-[12.5px] font-bold text-brand">{s.purchase.total}</span>
            <span className="text-base font-extrabold text-brand">{money(totalCents)}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.paid} ({currency})</span>
              <input value={paid ?? String(totalCents / 100)} onChange={(e) => setPaid(e.target.value)} inputMode="decimal" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.method}</span>
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} triggerClassName={field}>
                {["cash", "moncash", "natcash", "banque", "autre"].map((m) => (
                  <option key={m} value={m}>
                    {KES_COPY[language].methods[m] ?? m}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.date}</span>
              <input type="date" value={receivedOn} max={today} onChange={(e) => setReceivedOn(e.target.value)} className={field} />
            </label>
          </div>
          <p className="-mt-1 text-[11px] leading-snug text-ink-muted">{s.purchase.paidHint}</p>

          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-bold text-ink-muted">{s.purchase.note}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={field} />
          </label>

          {error && <p className="rounded-lg bg-[#FCE4E4] px-3 py-2 text-[12px] font-semibold text-[#C0392B]">{error === "migration" ? s.purchase.unavailable : s.movement.errors[error]}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-11 cursor-pointer rounded-xl border border-line bg-white text-[13px] font-bold text-ink">
              {s.movement.cancel}
            </button>
            <button type="button" onClick={save} disabled={pending || !valid} className="h-11 cursor-pointer rounded-xl bg-brand-green text-[13px] font-extrabold text-white disabled:opacity-50">
              {pending ? s.purchase.saving : s.purchase.save}
            </button>
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-[13px] text-ink-muted">{s.purchase.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const owed = Math.max(r.total - r.paid, 0);
            return (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13.5px] font-extrabold text-ink">{r.supplier ?? s.purchase.noSupplier}</span>
                    <span className="text-[11.5px] text-ink-muted">
                      {new Date(`${r.receivedOn}T12:00:00`).toLocaleDateString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "short", year: "numeric" })} · {s.purchase.lines(r.lines.length)}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-[13.5px] font-extrabold text-ink">{formatMoney(r.total, r.currency as "HTG" | "USD")}</span>
                    <span className={`text-[11px] font-bold ${owed > 0 ? "text-owed-text" : "text-brand"}`}>
                      {owed > 0 ? s.purchase.debt(formatMoney(owed, r.currency as "HTG" | "USD")) : s.purchase.settled}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[11.5px] text-ink-soft">
                  {r.lines.map((l) => `${l.qty} × ${l.name}`).join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
