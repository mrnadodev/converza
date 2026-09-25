"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BottomNav } from "@/components/BottomNav";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { TEAM_COPY } from "@/lib/i18n/app/team";
import { formatMoney } from "@/lib/money";
import { submitPayment } from "@/app/abonman/actions";
import { effectivePlan, type Plan, type PlatformPaymentInfo } from "@/lib/plans";
import { planTexts } from "@/lib/plan-texts";
import type { UserSession } from "@/lib/rbac";
import type { Business } from "@/lib/types";
import { Select } from "@/components/ui/Select";

const PAY_METHODS = [
  { key: "moncash", label: "MonCash" },
  { key: "natcash", label: "NatCash" },
  { key: "bank", label: "Transfert bancaire" },
  { key: "lot", label: "Autre" },
];

export function Subscription({
  business,
  plans,
  paymentInfo,
  userSession,
}: {
  business: Business;
  plans: Plan[];
  paymentInfo: PlatformPaymentInfo;
  userSession?: UserSession;
}) {
  const s = useDict(TEAM_COPY).subscription;
  const { language } = useLanguage();
  const c = useDict(COMMON_COPY);
  // Plan réellement dû : un abonnement échu n'est plus « actuel ».
  const current = effectivePlan(business.plan, business.plan_until);
  // Seuls les moyens de paiement que CONVERZA a renseignés sont proposés :
  // choisir un virement sans compte bancaire menait à une impasse.
  const methods = PAY_METHODS.filter((m) =>
    m.key === "moncash"
      ? Boolean(paymentInfo.moncash?.trim())
      : m.key === "natcash"
        ? Boolean(paymentInfo.natcash?.trim())
        : m.key === "bank"
          ? Boolean(paymentInfo.bank?.trim()) || (paymentInfo.bank_details?.length ?? 0) > 0
          : true,
  );
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [method, setMethod] = useState(() => methods[0]?.key ?? "lot");
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
      else setError(res.error ?? c.actions.retry);
    });
  }

  const rawPayInfo = paymentInfo[method as keyof PlatformPaymentInfo];
  const payInfo = typeof rawPayInfo === "string" ? rawPayInfo : "";
  const qrUrl = method === "moncash" ? paymentInfo.moncash_qr_url : method === "natcash" ? paymentInfo.natcash_qr_url : undefined;
  const bankDetails = method === "bank" ? paymentInfo.bank_details : undefined;
  const methodLabel = PAY_METHODS.find((m) => m.key === method)?.label ?? method;

  return (
    <div className="app-page with-topnav min-h-[100dvh] bg-[#F7F8F9] pb-[110px]">
      <header className="flex items-center gap-3 bg-brand px-4 pb-4 pt-5">
        <Link href="/" aria-label={c.actions.back}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-[19px] font-extrabold text-white">{s.title}</h1>
        <div className="ml-auto md:hidden">
          <LanguageToggle />
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-4 md:mx-auto md:max-w-[900px] md:grid md:grid-cols-2 md:items-start">
        {plans.map((p) => {
          const isCurrent = p.key === current;
          const texts = planTexts(p, language);
          return (
            <section key={p.key} className={`rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] ${p.highlight ? "ring-2 ring-brand-green" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold">{texts.name}</h2>
                  {p.highlight && <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">{s.popular}</span>}
                  {isCurrent && <span className="rounded-full bg-[#E7F7F1] px-2 py-0.5 text-[10px] font-bold text-brand">{s.current}</span>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold">{p.priceGdes === 0 ? s.free : formatMoney(p.priceGdes * 100)}</span>
                  {p.priceGdes > 0 && <span className="block text-[11px] text-ink-faint">{s.perMonth}</span>}
                </div>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{texts.tagline}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {texts.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrent && p.priceGdes > 0 && business.plan_until && (
                <p className="mt-3 text-[12px] text-ink-muted">
                  {s.until(new Date(business.plan_until).toLocaleDateString("fr-HT", { day: "2-digit", month: "long", year: "numeric" }))}
                </p>
              )}
              {p.priceGdes > 0 && (
                <button
                  onClick={() => {
                    setChosen(p);
                    setDone(false);
                    setError(null);
                  }}
                  className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white active:scale-[0.99]"
                >
                  {isCurrent ? s.renew(texts.name) : s.choose(texts.name)}
                </button>
              )}
            </section>
          );
        })}
        <p className="px-1 text-center text-[11.5px] text-ink-faint md:col-span-2">{s.manualNote}</p>
      </div>

      {chosen && (
        <div className="fixed inset-0 z-30 mx-auto flex max-w-[480px] flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChosen(null)} />
          <div className="relative max-h-[92dvh] overflow-y-auto rounded-t-[24px] bg-white px-5 pb-8 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F7F1]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="text-lg font-extrabold">{s.doneTitle}</h2>
                <p className="text-[13px] text-ink-muted">{s.doneDesc(chosen.name)}</p>
                <button onClick={() => setChosen(null)} className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-brand-green font-bold text-white">
                  {c.actions.close}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold">{s.payTitle(chosen.name)}</h2>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      {formatMoney(chosen.priceGdes * 100)} {s.perMonth}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChosen(null)}
                    aria-label={s.close}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-full bg-[#F3F6F4] text-[15px] font-bold text-ink-soft active:scale-95"
                  >
                    ✕
                  </button>
                </div>

                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink-soft">{s.method}</span>
                  <Select value={method} onChange={(e) => setMethod(e.target.value)} triggerClassName={cls}>
                    {methods.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </label>

                <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-[#E7F7F1] p-3 text-center text-[13px] text-[#0B6B57]">
                  <span>{s.sendTo(formatMoney(chosen.priceGdes * 100))}</span>

                  {bankDetails && bankDetails.length > 0 ? (
                    <div className="mt-1 flex w-full flex-col gap-2">
                      {bankDetails.map((b, idx) => (
                        <div key={idx} className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-white p-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-ink">{b.bank_name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${b.currency === "USD" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {b.currency}
                            </span>
                          </div>
                          <span className="font-mono text-[13px] font-bold tracking-wide text-brand-green">{b.account_number}</span>
                          {b.account_holder && (
                            <span className="text-[11px] text-ink-muted">
                              {s.holder} : <span className="font-semibold text-ink">{b.account_holder}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : payInfo ? (
                    <span className="rounded-lg border border-emerald-200 bg-white/70 px-3 py-1.5 text-sm font-bold">{payInfo}</span>
                  ) : (
                    /* Sans coordonnées enregistrées, on le dit : la page affichait
                       auparavant un numéro MonCash de démonstration. */
                    <span className="rounded-lg border border-amber-300 bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">
                      {s.notConfigured}
                    </span>
                  )}

                  <p className="text-[11.5px]">{s.afterPaying}</p>

                  {qrUrl && (
                    <div className="mt-1 flex flex-col items-center rounded-xl border border-emerald-200 bg-white p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrUrl} alt="" className="h-36 w-36 rounded-lg object-contain" />
                      <span className="mt-1.5 text-[11px] font-extrabold text-brand">{s.scan(methodLabel)}</span>
                    </div>
                  )}
                </div>

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink-soft">{s.reference}</span>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className={cls} placeholder={s.referencePlaceholder} />
                </label>

                {error && <p className="mt-3 rounded-xl bg-[#FCE4E4] px-3 py-2 text-[13px] text-[#C0392B]">{error}</p>}

                <button
                  onClick={submit}
                  disabled={pending}
                  className="mt-4 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-brand-green text-base font-extrabold text-white shadow-[0_6px_16px_rgba(37,211,102,0.4)] disabled:opacity-60"
                >
                  {pending ? s.sending : s.confirm}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav active={null} userSession={userSession} />
    </div>
  );
}

const cls = "h-12 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[15px] outline-none focus:border-brand focus:bg-white";
