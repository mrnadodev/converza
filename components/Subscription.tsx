"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { PLANS, planOf, CONVERZA_PAYMENT_INFO, type Plan } from "@/lib/plans";
import { submitPayment } from "@/app/abonman/actions";
import type { Business } from "@/lib/types";

const PAY_METHODS = [
  { key: "moncash", label: "MonCash" },
  { key: "natcash", label: "Natcash" },
  { key: "bank", label: "Bank lokal" },
  { key: "lot", label: "Lòt" },
];

export function Subscription({ business }: { business: Business }) {
  const current = business.plan ?? "gratis";
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [method, setMethod] = useState("moncash");
  const [ref, setRef] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!chosen) return;
    setError(null);
    start(async () => {
      const res = await submitPayment({ plan: chosen.key, payMethod: method, payRef: ref });
      if (res.ok) setDone(true);
      else setError(res.error ?? "Erè");
    });
  }

  const payInfo = CONVERZA_PAYMENT_INFO[method as keyof typeof CONVERZA_PAYMENT_INFO];

  return (
    <div className="min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label="Retounen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <span className="text-[19px] font-extrabold text-white">Abònman</span>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-4">
        {PLANS.map((p) => {
          const isCurrent = p.key === current;
          return (
            <div key={p.key} className={`rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] ${p.highlight ? "ring-2 ring-brand-green" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold">{p.name}</span>
                  {p.highlight && <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">Popilè</span>}
                  {isCurrent && <span className="rounded-full bg-[#E7F7F1] px-2 py-0.5 text-[10px] font-bold text-brand">Plan aktyèl</span>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold">{p.priceGdes === 0 ? "Gratis" : formatMoney(p.priceGdes * 100)}</span>
                  {p.priceGdes > 0 && <span className="block text-[11px] text-ink-faint">/ mwa</span>}
                </div>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{p.tagline}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!isCurrent && p.priceGdes > 0 && (
                <button onClick={() => { setChosen(p); setDone(false); setError(null); }} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white active:scale-[0.99]">
                  Chwazi {p.name}
                </button>
              )}
            </div>
          );
        })}
        <p className="px-1 text-center text-[11.5px] text-ink-faint">Peman verifye alamen. Plan an aktive apre konfimasyon.</p>
      </div>

      {/* Feuille de paiement */}
      {chosen && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[480px] flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChosen(null)} />
          <div className="relative rounded-t-[24px] bg-white px-5 pb-8 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F7F1]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h2 className="text-lg font-extrabold">Nou resevwa demann ou!</h2>
                <p className="text-[13px] text-ink-muted">Plan <b>{chosen.name}</b> ap aktive apre nou verifye peman an. Mèsi!</p>
                <button onClick={() => setChosen(null)} className="mt-2 h-11 w-full rounded-xl bg-brand-green font-bold text-white">Fèmen</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-extrabold">Peye plan {chosen.name}</h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">{formatMoney(chosen.priceGdes * 100)} / mwa</p>

                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink-soft">Metòd peman</span>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className={cls}>
                    {PAY_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </label>

                <div className="mt-3 rounded-xl bg-[#E7F7F1] px-4 py-3 text-[13px] text-[#0B6B57]">
                  Voye {formatMoney(chosen.priceGdes * 100)} sou : <b>{payInfo}</b><br />Apre sa, mete referans lan anba a.
                </div>

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink-soft">Referans tranzaksyon</span>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className={cls} placeholder="Ex: 8842xxxx" />
                </label>

                {error && <div className="mt-3 rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</div>}

                <button onClick={submit} disabled={pending} className="mt-4 flex h-[52px] w-full items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] disabled:opacity-60">
                  {pending ? "N ap voye…" : "Konfime peman"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";
