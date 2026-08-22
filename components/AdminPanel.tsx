"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { activatePlan, rejectPayment } from "@/app/admin/actions";

interface Payment {
  id: string;
  plan: string;
  amount_cents: number;
  pay_method: string;
  pay_ref: string | null;
  status: string;
  created_at: string;
  business_id: string;
  businesses?: { name: string; slug: string } | null;
}
interface Biz {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  plan: string | null;
}

export function AdminPanel({ payments, businesses }: { payments: Payment[]; businesses: Biz[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const pendingPayments = payments.filter((p) => p.status === "pending");

  function activate(p: Payment) {
    setBusy(p.id);
    start(async () => {
      await activatePlan(p.id, p.business_id, p.plan);
      setBusy(null);
      router.refresh();
    });
  }
  function reject(p: Payment) {
    if (!confirm("Rejte peman sa a?")) return;
    setBusy(p.id);
    start(async () => {
      await rejectPayment(p.id);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="bg-[#0E1B17] px-4 pb-4 pt-6">
        <span className="text-[19px] font-extrabold text-white">Admin CONVERZA</span>
        <p className="text-[12px] text-white/60">Super-admin · jesyon abònman ak marchan</p>
      </header>

      {/* Paiements en attente */}
      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[15px] font-extrabold">Peman ki ap tann</h2>
          <span className="rounded-full bg-owed-bg px-2 py-0.5 text-[11px] font-bold text-owed-text">{pendingPayments.length}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {pendingPayments.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{p.businesses?.name ?? "Biznis"}</span>
                  <span className="text-[12.5px] text-ink-faint">
                    Plan <b className="text-ink">{p.plan}</b> · {formatMoney(p.amount_cents)}
                  </span>
                  <span className="text-[12.5px] text-ink-faint">
                    {p.pay_method}{p.pay_ref ? ` · réf ${p.pay_ref}` : ""}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => activate(p)} disabled={pending && busy === p.id} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60">
                  {busy === p.id ? "…" : "Aktive plan"}
                </button>
                <button onClick={() => reject(p)} disabled={pending && busy === p.id} className="flex h-10 items-center justify-center rounded-xl bg-[#FCE4E4] px-4 text-sm font-bold text-[#C0392B] disabled:opacity-60">
                  Rejte
                </button>
              </div>
            </div>
          ))}
          {pendingPayments.length === 0 && (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-ink-faint">Pa gen peman k ap tann.</p>
          )}
        </div>
      </section>

      {/* Tous les marchands */}
      <section className="px-4 pt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[15px] font-extrabold">Tout marchan</h2>
          <span className="rounded-full bg-[#E7EBED] px-2 py-0.5 text-[11px] font-bold text-ink-faint">{businesses.length}</span>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          {businesses.map((b, i) => (
            <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < businesses.length - 1 ? "border-b border-[#F0F2F3]" : ""}`}>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-semibold">{b.name}</span>
                <span className="text-[12px] text-ink-faint">/{b.slug} · {b.business_type ?? "—"}</span>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${b.plan === "gratis" || !b.plan ? "bg-[#EFF2F3] text-ink-faint" : "bg-[#E7F7F1] text-brand"}`}>
                {b.plan ?? "gratis"}
              </span>
            </div>
          ))}
          {businesses.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-faint">Pa gen marchan.</p>}
        </div>
      </section>
    </div>
  );
}
