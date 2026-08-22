"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { activatePlan, rejectPayment, setPlan } from "@/app/admin/actions";
import { signOut } from "@/app/login/actions";

interface Payment {
  id: string; plan: string; amount_cents: number; pay_method: string; pay_ref: string | null;
  status: string; created_at: string; business_id: string; businesses?: { name: string; slug: string } | null;
}
interface Merchant {
  id: string; name: string; slug: string; business_type: string | null; plan: string;
  plan_until: string | null; created_at: string; products: number; orders: number; agents: number; gmvCents: number;
}
interface Data {
  kpis: { mrrCents: number; merchants: number; newThisMonth: number; gmvCents: number; conversionPct: number; paidCount: number };
  planCounts: { gratis: number; pro: number; premium: number };
  signups: number[];
  pendingPayments: Payment[];
  expired: { id: string; name: string; plan: string }[];
  merchants: Merchant[];
}

export function AdminPanel({ data }: { data: Data }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const run = (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    start(async () => { await fn(); setBusy(null); router.refresh(); });
  };

  const maxSignup = Math.max(...data.signups, 1);
  const shown = data.merchants.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.slug.includes(q.toLowerCase()));

  return (
    <div className="min-h-[100dvh] bg-[#F7F8F9] pb-16">
      <header className="flex items-center justify-between bg-[#0E1B17] px-4 pb-4 pt-6">
        <div>
          <span className="text-[19px] font-extrabold text-white">Admin CONVERZA</span>
          <p className="text-[12px] text-white/60">Super-admin · monitè plataform lan</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white active:scale-95">Dekonekte</button>
        </form>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 px-4 pt-4">
        <Kpi label="MRR (chak mwa)" value={formatMoney(data.kpis.mrrCents)} accent />
        <Kpi label="GMV total" value={formatMoney(data.kpis.gmvCents)} />
        <Kpi label="Marchan" value={`${data.kpis.merchants}`} sub={`+${data.kpis.newThisMonth} mwa sa`} />
        <Kpi label="Konvèsyon → peye" value={`${data.kpis.conversionPct}%`} sub={`${data.kpis.paidCount} peye`} />
      </section>

      {/* Croissance + plans */}
      <section className="grid grid-cols-1 gap-3 px-4 pt-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <span className="text-[13px] font-bold text-ink-soft">Enskripsyon (8 semèn)</span>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {data.signups.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded bg-brand-green" style={{ height: `${Math.max(4, Math.round((v / maxSignup) * 68))}px`, opacity: i === 7 ? 1 : 0.55 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
          <span className="text-[13px] font-bold text-ink-soft">Repatisyon plan</span>
          <div className="mt-3 flex flex-col gap-2.5">
            <PlanRow label="Gratis" n={data.planCounts.gratis} total={data.kpis.merchants} color="#8696A0" />
            <PlanRow label="Pro" n={data.planCounts.pro} total={data.kpis.merchants} color="#16B67C" />
            <PlanRow label="Premium" n={data.planCounts.premium} total={data.kpis.merchants} color="#0A7D55" />
          </div>
        </div>
      </section>

      {/* Alertes */}
      {(data.expired.length > 0 || data.pendingPayments.length > 0) && (
        <section className="px-4 pt-4">
          <div className="rounded-2xl bg-owed-bg p-3.5">
            <span className="text-[13px] font-bold text-owed-text">Alèt</span>
            <div className="mt-1.5 flex flex-col gap-1 text-[13px] text-[#8A5A1E]">
              {data.pendingPayments.length > 0 && <div>• {data.pendingPayments.length} peman k ap tann konfimasyon</div>}
              {data.expired.length > 0 && <div>• {data.expired.length} plan ki ekspire: {data.expired.slice(0, 3).map((e) => e.name).join(", ")}{data.expired.length > 3 ? "…" : ""}</div>}
            </div>
          </div>
        </section>
      )}

      {/* Paiements en attente */}
      <section className="px-4 pt-5">
        <h2 className="mb-2 text-[15px] font-extrabold">Peman ki ap tann</h2>
        <div className="flex flex-col gap-2.5">
          {data.pendingPayments.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{p.businesses?.name ?? "Biznis"}</span>
                <span className="text-[12.5px] text-ink-faint">Plan <b className="text-ink">{p.plan}</b> · {formatMoney(p.amount_cents)} · {p.pay_method}{p.pay_ref ? ` · réf ${p.pay_ref}` : ""}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => run(p.id, () => activatePlan(p.id, p.business_id, p.plan))} disabled={pending && busy === p.id} className="h-10 flex-1 rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60">{busy === p.id ? "…" : "Aktive plan"}</button>
                <button onClick={() => run(p.id, () => rejectPayment(p.id))} disabled={pending && busy === p.id} className="h-10 rounded-xl bg-[#FCE4E4] px-4 text-sm font-bold text-[#C0392B] disabled:opacity-60">Rejte</button>
              </div>
            </div>
          ))}
          {data.pendingPayments.length === 0 && <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">Pa gen peman k ap tann.</p>}
        </div>
      </section>

      {/* Marchands */}
      <section className="px-4 pt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[15px] font-extrabold">Tout marchan</h2>
          <span className="rounded-full bg-[#E7EBED] px-2 py-0.5 text-[11px] font-bold text-ink-faint">{data.merchants.length}</span>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chèche yon marchan…" className="mb-2.5 h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none focus:border-brand" />
        <div className="flex flex-col gap-2.5">
          {shown.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate text-[15px] font-bold">{m.name}</span>
                  <span className="text-[12px] text-ink-faint">/{m.slug} · {m.business_type ?? "—"}</span>
                </div>
                <select
                  value={m.plan}
                  onChange={(e) => run("plan-" + m.id, () => setPlan(m.id, e.target.value))}
                  disabled={pending && busy === "plan-" + m.id}
                  className="rounded-lg border border-line bg-[#F7F8F9] px-2 py-1.5 text-[12.5px] font-semibold outline-none"
                >
                  <option value="gratis">Gratis</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Mini n={m.products} l="Pwodwi" />
                <Mini n={m.orders} l="Kòmand" />
                <Mini n={m.agents} l="Ajan" />
                <Mini n={formatMoney(m.gmvCents).replace(" HTG", "")} l="GMV" />
              </div>
            </div>
          ))}
          {shown.length === 0 && <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">Anyen jwenn.</p>}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] ${accent ? "bg-brand text-white" : "bg-white"}`}>
      <span className={`text-[12px] font-semibold ${accent ? "text-white/80" : "text-ink-muted"}`}>{label}</span>
      <div className="mt-1 text-[22px] font-extrabold leading-tight">{value}</div>
      {sub && <span className={`text-[11.5px] ${accent ? "text-white/70" : "text-ink-faint"}`}>{sub}</span>}
    </div>
  );
}
function PlanRow({ label, n, total, color }: { label: string; n: number; total: number; color: string }) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[12.5px]"><span className="font-medium text-ink-soft">{label}</span><span className="font-bold">{n}</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F3]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
function Mini({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-[#F7F8F9] py-2">
      <span className="text-[15px] font-extrabold">{n}</span>
      <span className="text-[10.5px] text-ink-faint">{l}</span>
    </div>
  );
}
