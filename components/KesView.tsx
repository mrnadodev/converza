"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { KES_COPY } from "@/lib/i18n/app/kes";
import { MESSAGE_COPY } from "@/lib/i18n/app/messages";
import { formatMoney } from "@/lib/money";
import { buildDebtReminder } from "@/lib/order";
import { waMeLink } from "@/lib/whatsapp";
import { EXPENSE_CATEGORIES, KES_PERIODS, type ExpenseCategory } from "@/lib/kes-period";
import type { KesData } from "@/lib/kes";
import { addExpense, deleteExpense, type KesError } from "@/app/kes/actions";

const EXPENSE_METHODS = ["cash", "moncash", "natcash", "banque", "autre"] as const;

export function KesView({ data, businessName, plan = "gratis" }: { data: KesData; businessName: string; plan?: string }) {
  const k = useDict(KES_COPY);
  const { language } = useLanguage();
  const money = (cents: number) => formatMoney(cents, data.currency);
  const fmtDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "long" });
  const coverage = data.sales.revenue > 0 ? Math.round((data.sales.coveredRevenue / data.sales.revenue) * 100) : 0;

  return (
    <>
      <header className="flex items-center justify-between gap-3 bg-brand px-4 pb-4 pt-5">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{k.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{k.subtitle}</span>
        </div>
        <div className="md:hidden">
          <LanguageToggle />
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-4">
        <nav className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line" aria-label={k.title}>
          {KES_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/kes?p=${p}`}
              aria-current={data.period === p ? "page" : undefined}
              className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-extrabold ${data.period === p ? "bg-brand text-white" : "text-ink-muted"}`}
            >
              {k.periods[p]}
            </Link>
          ))}
        </nav>

        {!data.available ? (
          <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-[13px] text-ink-muted">{k.unavailable}</p>
        ) : (
          <>
            <p className="-mt-1 px-1 text-[11.5px] text-ink-muted">{k.since(fmtDate(data.since))}</p>

            {/* Caisse */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label={k.cards.cashIn} value={money(data.cashIn.total)} tone="in" />
              <Stat label={k.cards.expenses} value={money(data.expenses.total)} tone="out" />
              <Stat label={k.cards.purchases} value={money(data.purchasesPaid)} tone="out" />
              <Stat label={k.cards.balance} value={money(data.cashBalance)} hint={k.cards.balanceHint} tone={data.cashBalance < 0 ? "out" : "main"} />
            </section>

            {data.cashIn.byMethod.length > 0 && (
              <section className="rounded-2xl border border-line bg-white p-3.5">
                <h2 className="text-xs font-extrabold uppercase text-ink">{k.byMethod}</h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {data.cashIn.byMethod.map((m) => (
                    <li key={m.method} className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-soft">{k.methods[m.method] ?? m.method}</span>
                      <span className="font-extrabold text-ink">{money(m.amount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Bénéfice */}
            <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#008069] to-[#075E54] p-4 text-white">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-[#B9F5E4]">{k.cards.sales(data.sales.orders)}</span>
                <span className="text-base font-extrabold">{money(data.sales.revenue)}</span>
              </div>
              {data.sales.coveredRevenue === 0 && data.sales.revenue > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/15 px-3 py-2 text-[12.5px] font-semibold">
                  <span>{k.cards.noCost}</span>
                  <Link href="/katalog" className="font-extrabold underline">
                    {k.cards.setCosts}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[11.5px] text-[#B9F5E4]">{k.cards.grossProfit}</span>
                      <span className="text-lg font-extrabold">{money(data.sales.grossProfit)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11.5px] text-[#B9F5E4]">{k.cards.netProfit}</span>
                      <span className={`text-lg font-extrabold ${data.netProfit < 0 ? "text-[#FFC9C3]" : ""}`}>{money(data.netProfit)}</span>
                      <span className="text-[10.5px] text-[#B9F5E4]">{k.cards.netHint}</span>
                    </div>
                  </div>
                  {data.sales.revenue > 0 && coverage < 100 && <p className="text-[11.5px] text-[#B9F5E4]">{k.cards.coverage(coverage)}</p>}
                </>
              )}
              {data.otherCurrencyOrders > 0 && <p className="text-[11px] text-[#B9F5E4]">{k.otherCurrency(data.otherCurrencyOrders, data.currency)}</p>}
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Receivables data={data} businessName={businessName} />
              <Expenses data={data} />
            </div>

            {data.supplierDebt.rows.length > 0 && (
              <section className="rounded-2xl border border-line bg-white p-3.5">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xs font-extrabold uppercase text-ink">{k.supplierDebt.title}</h2>
                  <span className="text-sm font-extrabold text-owed-text">{money(data.supplierDebt.total)}</span>
                </div>
                <ul className="mt-2 divide-y divide-line">
                  {data.supplierDebt.rows.map((r, i) => (
                    <li key={i} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="font-bold text-ink">{r.supplier}</span>
                      <span className="font-extrabold text-owed-text">{money(r.owed)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="rounded-2xl border border-line bg-white p-3.5">
              <h2 className="text-xs font-extrabold uppercase text-ink">{k.ledger.title}</h2>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{k.ledger.hint}</p>
              <p className="mt-1 text-[11.5px] text-ink-faint">{k.ledger.columns}</p>
              {plan === "premium" ? (
                <a
                  href={`/api/journal?p=${data.period}&lang=${language}`}
                  className="mt-3 flex h-11 items-center justify-center rounded-xl bg-brand text-[13.5px] font-extrabold text-white active:scale-[0.99]"
                >
                  {k.ledger.cta}
                </a>
              ) : (
                <>
                  <p className="mt-2 rounded-xl bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">{k.ledger.premiumOnly}</p>
                  <a
                    href="/abonman"
                    className="mt-2 flex h-11 items-center justify-center rounded-xl border border-line bg-white text-[13.5px] font-extrabold text-ink active:scale-[0.99]"
                  >
                    {k.ledger.premiumCta}
                  </a>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: "in" | "out" | "main" }) {
  const color = tone === "in" ? "text-brand" : tone === "out" ? "text-[#C0392B]" : "text-ink";
  return (
    <div className={`flex flex-col gap-0.5 rounded-2xl border bg-white p-3.5 ${tone === "main" ? "border-brand/40" : "border-line"}`}>
      <span className="text-[11.5px] font-semibold text-ink-muted">{label}</span>
      <span className={`text-[17px] font-extrabold ${color}`}>{value}</span>
      {hint && <span className="text-[10.5px] leading-snug text-ink-faint">{hint}</span>}
    </div>
  );
}

function Receivables({ data, businessName }: { data: KesData; businessName: string }) {
  const k = useDict(KES_COPY);
  const { language } = useLanguage();
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;
  const days = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-extrabold uppercase text-ink">{k.receivables.title}</h2>
        <span className="text-sm font-extrabold text-owed-text">{formatMoney(data.receivables.total, data.currency)}</span>
      </div>
      <p className="text-[11.5px] text-ink-muted">{k.receivables.hint}</p>
      {data.receivables.rows.length === 0 ? (
        <p className="py-4 text-center text-[12.5px] text-ink-faint">{k.receivables.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {data.receivables.rows.map((r) => (
            <li key={r.orderId} className="flex items-center justify-between gap-2 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-bold text-ink">{r.customer}</span>
                <span className="text-[11px] text-ink-muted">
                  #{r.ref} · {k.receivables.days(days(r.since))}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[13px] font-extrabold text-owed-text">{formatMoney(r.owed, data.currency)}</span>
                {r.phone && (
                  <a
                    href={waMeLink(r.phone, buildDebtReminder(r.customer, r.owed, data.currency, businessName, m))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 items-center rounded-lg bg-brand-green px-2.5 text-[11.5px] font-extrabold text-white"
                  >
                    {k.receivables.remind}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Expenses({ data }: { data: KesData }) {
  const k = useDict(KES_COPY);
  const { language } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<KesError | null>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Port-au-Prince" });
  const [form, setForm] = useState({ amount: "", category: "transport" as ExpenseCategory, payMethod: "cash", note: "", spentOn: today });
  const field = "h-10 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[13.5px] text-ink outline-none focus:border-brand focus:bg-white";

  function save() {
    setError(null);
    start(async () => {
      const res = await addExpense(form);
      if (res.ok) {
        setForm((f) => ({ ...f, amount: "", note: "" }));
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-extrabold uppercase text-ink">{k.expense.title}</h2>
        <span className="text-sm font-extrabold text-[#C0392B]">{formatMoney(data.expenses.total, data.currency)}</span>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 h-10 cursor-pointer rounded-xl border-2 border-dashed border-line text-[13px] font-bold text-brand">
          + {k.expense.add}
        </button>
      ) : (
        <div className="mt-2 flex flex-col gap-2.5 rounded-xl bg-[#F7F8F9] p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{k.expense.amount} ({data.currency})</span>
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" autoFocus className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{k.expense.date}</span>
              <input type="date" value={form.spentOn} max={today} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{k.expense.category}</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className={field}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {k.expense.categories[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold text-ink-muted">{k.expense.method}</span>
              <select value={form.payMethod} onChange={(e) => setForm({ ...form, payMethod: e.target.value })} className={field}>
                {EXPENSE_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {k.methods[m] ?? m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-bold text-ink-muted">{k.expense.note}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} placeholder={k.expense.notePlaceholder} className={field} />
          </label>
          {error && <p className="rounded-lg bg-[#FCE4E4] px-3 py-2 text-[12px] font-semibold text-[#C0392B]">{k.expense.errors[error]}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-10 cursor-pointer rounded-xl border border-line bg-white text-[13px] font-bold text-ink">
              ✕
            </button>
            <button type="button" onClick={save} disabled={pending || !form.amount} className="h-10 cursor-pointer rounded-xl bg-brand text-[13px] font-extrabold text-white disabled:opacity-50">
              {pending ? k.expense.saving : k.expense.save}
            </button>
          </div>
        </div>
      )}

      {data.expenses.byCategory.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.expenses.byCategory.map((c) => (
            <span key={c.category} className="rounded-full bg-[#F3F6F4] px-2.5 py-1 text-[11px] font-bold text-ink-soft">
              {k.expense.categories[c.category] ?? c.category} · {formatMoney(c.amount, data.currency)}
            </span>
          ))}
        </div>
      )}

      {data.expenses.rows.length === 0 ? (
        <p className="py-4 text-center text-[12.5px] text-ink-faint">{k.expense.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {data.expenses.rows.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-bold text-ink">{e.note || k.expense.categories[e.category]}</span>
                <span className="text-[11px] text-ink-muted">
                  {k.expense.categories[e.category] ?? e.category} · {new Date(`${e.spentOn}T12:00:00`).toLocaleDateString(language === "en" ? "en-US" : "fr-HT", { day: "2-digit", month: "short" })}
                  {e.payMethod ? ` · ${k.methods[e.payMethod] ?? e.payMethod}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[13px] font-extrabold text-[#C0392B]">−{formatMoney(e.amount, data.currency)}</span>
                <button
                  type="button"
                  aria-label={k.expense.remove}
                  onClick={() => {
                    if (!window.confirm(k.expense.removeConfirm)) return;
                    start(async () => {
                      await deleteExpense(e.id);
                      router.refresh();
                    });
                  }}
                  className="h-7 w-7 cursor-pointer rounded-lg bg-[#F3F6F4] text-[12px] font-bold text-ink-muted"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
