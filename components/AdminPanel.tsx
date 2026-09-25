"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TableQrGenerator } from "@/components/TableQrGenerator";
import { ThemeToggle } from "@/components/ThemeProvider";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { signOut } from "@/app/login/actions";
import {
  activatePlan,
  decidePhoneChange,
  rejectPayment,
  renewPlan,
  repairMerchantDataAction,
  revokePlan,
  setPlan,
  updateGlobalSettingsAction,
  updateMerchantStructureAction,
  updatePaymentInfoConfig,
  updateLegalInfoConfig,
  updatePlanConfig,
  updatePlanTexts,
} from "@/app/admin/actions";
import { ADMIN_COPY, type AdminCopy } from "@/lib/i18n/app/admin";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { MESSAGE_COPY } from "@/lib/i18n/app/messages";
import { SETTINGS_COPY } from "@/lib/i18n/app/settings";
import { STOREFRONT_COPY } from "@/lib/i18n/storefront";
import { csvCell } from "@/lib/reports";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import { buildFunnel } from "@/lib/funnel";
import { planTexts } from "@/lib/plan-texts";
import type { Language } from "@/lib/i18n/translations";
import { LandingEditor } from "@/components/LandingEditor";
import { SECTOR_THEME, THEMES, THEME_KEYS, themeOf } from "@/lib/themes";
import { INDUSTRY_SECTORS, verticalOf } from "@/lib/verticals";
import { designFor, paletteFor } from "@/lib/storefront-designs";
import { DESIGN_COPY, designName } from "@/lib/i18n/app/designs";
import { LayoutThumb as LayoutThumbMini } from "@/components/LayoutThumb";
import type { AdminData, AdminMerchant } from "@/lib/admin-data";
import type { BankAccountDetails, Plan } from "@/lib/plans";
import type { DesignLayoutConfig, QrMenuServiceConfig } from "@/lib/platform-config";
import { DEFAULT_LAYOUT, STOREFRONT_LAYOUTS, isLayoutKey, layoutRule, type LayoutKey } from "@/lib/storefront-layouts";
import { Select } from "@/components/ui/Select";

type Tab = "overview" | "merchants" | "billing" | "phones" | "qrMenu" | "platform" | "landing" | "security";
type Runner = (id: string, fn: () => Promise<unknown>) => void;

const PLAN_KEYS = ["gratis", "qr_express", "pro", "premium"] as const;
const PLAN_COLORS: Record<string, string> = {
  gratis: "#8696A0",
  qr_express: "#F59E0B",
  pro: "#16B67C",
  premium: "#0A7D55",
};

function localeOf(language: Language): string {
  return language === "en" ? "en-US" : "fr-HT";
}
function fmtDate(language: Language, iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(localeOf(language), { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(language: Language, iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(localeOf(language), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function planLabel(key: string, plans: Plan[]): string {
  return plans.find((p) => p.key === key)?.name ?? key;
}
function isActive(m: AdminMerchant): boolean {
  return m.plan !== "gratis" && !!m.plan_until && new Date(m.plan_until).getTime() > Date.now();
}

export function AdminPanel({ data }: { data: AdminData }) {
  const a = useDict(ADMIN_COPY);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [cockpit, setCockpit] = useState<AdminMerchant | null>(null);
  const [qrMerchant, setQrMerchant] = useState<AdminMerchant | null>(null);

  const run: Runner = (id, fn) => {
    setBusy(id);
    start(async () => {
      await fn();
      setBusy(null);
      router.refresh();
    });
  };

  const pendingPhones = data.phoneRequests.filter((r) => r.status === "pending").length;
  const blocked = data.merchants.filter((m) => m.issues.some((i) => i.level === "blocker")).length;
  const alerts = [
    pendingPhones > 0 && { tone: "warn" as const, text: a.alerts.phones(pendingPhones) },
    blocked > 0 && { tone: "danger" as const, text: a.alerts.blocked(blocked) },
    data.duplicateRefAlerts.length > 0 && { tone: "danger" as const, text: a.alerts.duplicates(data.duplicateRefAlerts.length) },
    data.pendingPayments.length > 0 && { tone: "warn" as const, text: a.alerts.pending(data.pendingPayments.length) },
    data.expired.length > 0 && { tone: "warn" as const, text: a.alerts.expired(data.expired.length) },
    data.expiringSoon.length > 0 && { tone: "info" as const, text: a.alerts.expiringSoon(data.expiringSoon.length) },
  ].filter(Boolean) as { tone: "danger" | "warn" | "info"; text: string }[];

  return (
    <div className="app-page min-h-[100dvh] bg-[#F7F8F9] pb-16 text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1B17] px-4 pb-4 pt-6">
        <div className="min-w-0">
          <h1 className="text-[19px] font-extrabold text-white">{a.header.title}</h1>
          <p className="text-[12px] text-white/60">{a.header.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <form action={signOut}>
            <button type="submit" className="cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white active:scale-95">
              {a.header.signOut}
            </button>
          </form>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-4 pt-3 text-[13.5px] font-bold [scrollbar-width:none]">
        {(["overview", "merchants", "billing", "phones", "qrMenu", "platform", "landing", "security"] as const).map((key) => {
          const badge =
            key === "billing"
              ? data.pendingPayments.length
              : key === "phones"
                ? pendingPhones
                : key === "security"
                  ? data.duplicateRefAlerts.length
                  : 0;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3.5 pb-3 transition-colors ${
                tab === key ? "border-brand font-extrabold text-brand" : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {a.tabs[key]}
              {badge > 0 && <span className="rounded-full bg-rose-600 px-1.5 text-[10.5px] font-black text-white">{badge}</span>}
            </button>
          );
        })}
      </nav>

      {alerts.length > 0 && (
        <section className="px-4 pt-4">
          <div className="rounded-2xl border border-amber-200 bg-owed-bg p-3.5">
            <span className="text-[13px] font-bold text-owed-text">{a.alerts.title}</span>
            <ul className="mt-1.5 flex flex-col gap-1 text-[13px]">
              {alerts.map((al, i) => (
                <li key={i} className={al.tone === "danger" ? "font-semibold text-rose-700" : "text-[#8A5A1E]"}>
                  • {al.text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "overview" && <OverviewTab data={data} onRenew={(id, months) => run("renew-" + id, () => renewPlan(id, months))} pending={pending} />}
      {tab === "merchants" && (
        <MerchantsTab
          data={data}
          run={run}
          pending={pending}
          busy={busy}
          onCockpit={(m) => setCockpit(m)}
        />
      )}
      {tab === "billing" && <BillingTab data={data} run={run} pending={pending} busy={busy} />}
      {tab === "phones" && <PhonesTab data={data} run={run} pending={pending} busy={busy} />}
      {tab === "qrMenu" && <QrMenuTab data={data} run={run} pending={pending} busy={busy} onPrint={(m) => setQrMerchant(m)} />}
      {tab === "platform" && <PlatformTab data={data} run={run} pending={pending} />}
      {tab === "landing" && <LandingEditor initial={data.landingOverrides ?? {}} />}
      {tab === "security" && <SecurityTab data={data} />}

      {cockpit && <CockpitModal merchant={cockpit} onClose={() => setCockpit(null)} onRefresh={() => router.refresh()} />}

      {qrMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-3xl border border-line bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold">{qrMerchant.name}</h2>
                <p className="text-xs text-ink-muted">/b/{qrMerchant.slug}</p>
              </div>
              <button onClick={() => setQrMerchant(null)} aria-label={a.cockpit.close} className="h-9 w-9 cursor-pointer rounded-full bg-[#F3F6F4] font-bold text-ink-soft">
                ✕
              </button>
            </div>
            <TableQrGenerator business={{ name: qrMerchant.name, slug: qrMerchant.slug } as never} />
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------------------------------- Vue d'ensemble --------------------------------- */

/**
 * Parcours des marchands, de l'inscription au premier paiement. La console
 * disait combien de comptes existaient, jamais où ils s'arrêtaient.
 */
function FunnelCard({ data }: { data: AdminData }) {
  const a = useDict(ADMIN_COPY);
  const f = useMemo(
    () =>
      buildFunnel(
        data.merchants.map((m) => ({
          createdAt: m.created_at,
          lastSignInAt: m.lastSignInAt,
          products: m.products,
          orders: m.orders,
          paidCents: m.paidCents,
          plan: m.plan,
          planUntil: m.plan_until,
          firstOrderAt: m.firstOrderAt,
        })),
      ),
    [data.merchants],
  );

  if (f.total === 0) {
    return (
      <Card>
        <CardTitle title={a.funnel.title} hint={a.funnel.hint} />
        <p className="mt-2 text-sm text-ink-faint">{a.funnel.empty}</p>
      </Card>
    );
  }

  const worstLabel = f.worstStep ? a.funnel.steps[f.worstStep].label : null;
  const delay =
    data.firstOrderComplete && f.medianDaysToFirstOrder !== null
      ? a.funnel.medianValue(f.medianDaysToFirstOrder)
      : a.funnel.medianUnknown;

  return (
    <Card>
      <CardTitle title={a.funnel.title} hint={a.funnel.hint} />

      <ul className="mt-3 flex flex-col gap-2">
        {f.steps.map((step, i) => {
          const copy = a.funnel.steps[step.key];
          const width = Math.max(step.pctOfTotal, 3);
          const worst = step.key === f.worstStep;
          return (
            <li key={step.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-bold text-ink">{copy.label}</span>
                <span className="shrink-0 text-[12px] text-ink-muted">
                  <span className="font-extrabold tabular-nums text-ink">{step.count}</span> · {a.funnel.ofTotal(step.pctOfTotal)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF2F3]">
                <div
                  className={`h-full rounded-full ${worst ? "bg-[#C0392B]" : "bg-brand-green"}`}
                  style={{ width: `${width}%`, opacity: worst ? 1 : 1 - i * 0.08 }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-[11.5px] text-ink-faint">
                <span>{copy.help}</span>
                {i > 0 && (
                  <span className={step.lost > 0 ? "font-bold text-owed-text" : ""}>
                    {step.lost > 0 ? `${a.funnel.lost(step.lost)} · ${a.funnel.ofPrevious(step.pctOfPrevious)}` : a.funnel.ofPrevious(step.pctOfPrevious)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {f.payingButStalled > 0 && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">
          {a.funnel.stalled(f.payingButStalled)}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] font-semibold text-ink-soft">
          {worstLabel ? a.funnel.worst(worstLabel) : a.funnel.allGood}
        </span>
        <span className="shrink-0 text-[12.5px] text-ink-muted">
          {a.funnel.median} : <span className="font-extrabold text-ink">{delay}</span>
        </span>
      </div>

      {f.cohorts.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <span className="text-[13px] font-bold text-ink-soft">{a.funnel.cohortsTitle}</span>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[380px] text-[12.5px]">
              <thead>
                <tr className="text-left text-ink-faint">
                  <th className="pb-1 font-semibold">{a.funnel.cohortMonth}</th>
                  <th className="pb-1 text-right font-semibold">{a.funnel.cohortSignups}</th>
                  <th className="pb-1 text-right font-semibold">{a.funnel.cohortCatalog}</th>
                  <th className="pb-1 text-right font-semibold">{a.funnel.cohortOrder}</th>
                  <th className="pb-1 text-right font-semibold">{a.funnel.cohortPaying}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {f.cohorts.map((c) => (
                  <tr key={c.month}>
                    <td className="py-1.5 font-bold">{c.month}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.signups}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.catalog}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.firstOrder}</td>
                    <td className="py-1.5 text-right tabular-nums font-bold">{c.paying}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}


/**
 * Ce qui manque à ce marchand pour vendre, dans l'ordre où il doit avancer.
 * Sert au message de relance : « il reste à publier votre premier produit ».
 */
const NUDGE_ORDER = ["noProducts", "noPayMethod", "noCover", "noDelivery", "noOrders"];
function nudgeStepOf(m: AdminData["merchants"][number]): string | null {
  const codes = new Set(m.issues.map((i) => i.code as string));
  return NUDGE_ORDER.find((code) => codes.has(code)) ?? null;
}

function OverviewTab({ data, onRenew, pending }: { data: AdminData; onRenew: (id: string, months: number) => void; pending: boolean }) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const plans = data.platformPlans ?? [];
  const maxSignup = Math.max(...data.signups, 1);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 md:px-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={a.kpis.mrr} value={formatMoney(data.kpis.mrrCents)} sub={a.kpis.mrrHint} accent />
        <Kpi label={a.kpis.gmv} value={formatMoney(data.kpis.gmvCents)} sub={a.kpis.gmvHint} />
        <Kpi label={a.kpis.merchants} value={String(data.kpis.merchants)} sub={a.kpis.newThisMonth(data.kpis.newThisMonth)} />
        <Kpi label={a.kpis.conversion} value={`${data.kpis.conversionPct} %`} sub={a.kpis.conversionHint(data.kpis.paidCount)} />
        <Kpi label={a.kpis.expiringSoon} value={String(data.kpis.expiringSoonCount)} sub={a.kpis.expiringSoonHint} />
        <Kpi label={a.kpis.pending} value={String(data.pendingPayments.length)} sub={a.kpis.pendingHint} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardTitle title={a.growth.signups} hint={a.growth.signupsHint} />
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {data.signups.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-ink-faint">{v > 0 ? v : ""}</span>
                <div
                  className="w-full rounded bg-brand-green"
                  style={{ height: `${Math.max(4, Math.round((v / maxSignup) * 64))}px`, opacity: i === 7 ? 1 : 0.55 }}
                />
                <span className="text-[9.5px] text-ink-faint">{i === 7 ? "—" : `S-${7 - i}`}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle title={a.growth.planSplit} />
          <div className="mt-3 flex flex-col gap-2.5">
            {PLAN_KEYS.map((key) => (
              <PlanRow key={key} label={planLabel(key, plans)} n={data.planCounts[key] ?? 0} total={data.kpis.merchants} color={PLAN_COLORS[key]} />
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <span className="text-[13px] font-bold text-ink-soft">{a.growth.mrrByPlan}</span>
            <div className="mt-2 flex flex-col gap-1.5 text-[12.5px]">
              {Object.keys(data.mrrByPlan).length === 0 ? (
                <span className="text-ink-faint">{a.growth.noRevenue}</span>
              ) : (
                Object.entries(data.mrrByPlan).map(([key, cents]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-ink-soft">{planLabel(key, plans)}</span>
                    <span className="font-extrabold tabular-nums">{formatMoney(cents)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </section>

      <FunnelCard data={data} />

      {(data.expiringSoon.length > 0 || data.expired.length > 0) && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.expiringSoon.length > 0 && (
            <Card>
              <CardTitle title={a.kpis.expiringSoon} hint={a.kpis.expiringSoonHint} />
              <ul className="mt-2 flex flex-col divide-y divide-line">
                {data.expiringSoon.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-bold">{e.name}</span>
                      <span className="text-[11.5px] text-ink-faint">{a.merchants.activeUntil(fmtDate(language, e.until))}</span>
                    </div>
                    <RenewButtons disabled={pending} onRenew={(months) => onRenew(e.id, months)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.expired.length > 0 && (
            <Card>
              <CardTitle title={a.alerts.expired(data.expired.length)} />
              <ul className="mt-2 flex flex-col divide-y divide-line">
                {data.expired.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-bold">{e.name}</span>
                      <span className="text-[11.5px] text-rose-700">{a.merchants.expiredSince(fmtDate(language, e.until))}</span>
                    </div>
                    <RenewButtons disabled={pending} onRenew={(months) => onRenew(e.id, months)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

function RenewButtons({ onRenew, disabled }: { onRenew: (months: number) => void; disabled: boolean }) {
  const a = useDict(ADMIN_COPY);
  return (
    <div className="flex shrink-0 items-center gap-1">
      {[1, 3, 12].map((m) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => onRenew(m)}
          className="cursor-pointer rounded-lg bg-[#E7F7F1] px-2 py-1 text-[11px] font-extrabold text-brand active:scale-95 disabled:opacity-50"
        >
          {a.merchants.renewMonths(m)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------ Marchands ----------------------------------- */

function MerchantsTab({
  data,
  run,
  pending,
  busy,
  onCockpit,
}: {
  data: AdminData;
  run: Runner;
  pending: boolean;
  busy: string | null;
  onCockpit: (m: AdminMerchant) => void;
}) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const plans = data.platformPlans ?? [];
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "free">("all");
  const [sort, setSort] = useState<"recent" | "gmv" | "orders" | "name">("recent");
  const [message, setMessage] = useState<string | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = data.merchants.filter((m) => {
      if (needle && !m.name.toLowerCase().includes(needle) && !m.slug.includes(needle) && !(m.ownerEmail ?? "").includes(needle)) return false;
      if (planFilter !== "all" && m.plan !== planFilter) return false;
      if (statusFilter === "active" && !isActive(m)) return false;
      if (statusFilter === "expired" && !(m.plan !== "gratis" && !isActive(m))) return false;
      if (statusFilter === "free" && m.plan !== "gratis") return false;
      return true;
    });
    return [...list].sort((x, y) => {
      if (sort === "gmv") return y.gmvCents - x.gmvCents;
      if (sort === "orders") return y.orders - x.orders;
      if (sort === "name") return x.name.localeCompare(y.name);
      return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
    });
  }, [data.merchants, q, planFilter, statusFilter, sort]);

  function exportCsv() {
    const header = [
      a.merchants.title,
      "slug",
      a.merchants.filterPlan,
      a.merchants.activeUntil("").trim(),
      a.merchants.owner,
      "WhatsApp",
      a.merchants.stats.products,
      a.merchants.stats.orders,
      a.merchants.stats.agents,
      a.merchants.stats.gmv,
      a.merchants.lastOrder,
      a.merchants.joined,
    ];
    const rows = shown.map((m) =>
      [
        m.name,
        m.slug,
        planLabel(m.plan, plans),
        m.plan_until ? fmtDate(language, m.plan_until) : "",
        m.ownerEmail ?? "",
        m.phone_e164 ?? "",
        m.products,
        m.orders,
        m.agents,
        (m.gmvCents / 100).toFixed(2),
        m.lastOrderAt ? fmtDate(language, m.lastOrderAt) : "",
        fmtDate(language, m.created_at),
      ].map(csvCell).join(";"),
    );
    const blob = new Blob(["﻿" + [header.map(csvCell).join(";"), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "converza-marchands.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.merchants.search}
          aria-label={a.merchants.search}
          className="h-11 min-w-[220px] flex-1 rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none focus:border-brand"
        />
        <SelectField label={a.merchants.filterPlan} value={planFilter} onChange={setPlanFilter}>
          <option value="all">{a.merchants.allPlans}</option>
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {planLabel(key, plans)}
            </option>
          ))}
        </SelectField>
        <SelectField label={a.merchants.filterStatus} value={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <option value="all">{a.merchants.status.all}</option>
          <option value="active">{a.merchants.status.active}</option>
          <option value="expired">{a.merchants.status.expired}</option>
          <option value="free">{a.merchants.status.free}</option>
        </SelectField>
        <SelectField label={a.merchants.sort} value={sort} onChange={(v) => setSort(v as typeof sort)}>
          <option value="recent">{a.merchants.sortBy.recent}</option>
          <option value="gmv">{a.merchants.sortBy.gmv}</option>
          <option value="orders">{a.merchants.sortBy.orders}</option>
          <option value="name">{a.merchants.sortBy.name}</option>
        </SelectField>
        <button onClick={exportCsv} className="h-11 cursor-pointer rounded-xl border border-line bg-white px-4 text-[13px] font-bold active:scale-95">
          {a.merchants.exportCsv}
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-emerald-200 bg-[#E7F7F1] px-3 py-2 text-[12.5px] font-semibold text-brand">{message}</p>
      )}

      <div className="flex flex-col gap-2.5">
        {shown.map((m) => {
          const active = isActive(m);
          return (
            <article key={m.id} className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15.5px] font-extrabold">{m.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-black uppercase ${active ? "bg-brand-green/10 text-brand" : m.plan === "gratis" ? "bg-[#EEF2F3] text-ink-faint" : "bg-rose-100 text-rose-700"}`}>
                      {planLabel(m.plan, plans)}
                    </span>
                  </div>
                  <span className="block text-[12px] text-ink-faint">/b/{m.slug}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold">
                    {m.plan === "gratis"
                      ? a.merchants.noSubscription
                      : active
                      ? <span className="text-brand">{a.merchants.activeUntil(fmtDate(language, m.plan_until))}</span>
                      : <span className="text-rose-700">{a.merchants.expiredSince(fmtDate(language, m.plan_until))}</span>}
                  </span>
                </div>

                <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-muted">
                  <span className="sr-only">{a.merchants.changePlan}</span>
                  <Select
                    value={m.plan}
                    onChange={(e) => run("plan-" + m.id, () => setPlan(m.id, e.target.value))}
                    disabled={pending && busy === "plan-" + m.id}
                    triggerClassName="h-9 cursor-pointer rounded-lg border border-line bg-[#F7F8F9] px-2 text-[12.5px] font-semibold outline-none"
                  >
                    {PLAN_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {planLabel(key, plans)}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
                <Info label={a.merchants.owner} value={m.ownerEmail ?? a.merchants.noOwner} />
                <Info label="WhatsApp" value={m.phone_e164 ?? "—"} />
                <Info label={a.merchants.lastOrder} value={m.lastOrderAt ? fmtDate(language, m.lastOrderAt) : a.merchants.never} />
                <Info label={a.merchants.joined} value={fmtDate(language, m.created_at)} />
                <Info label={a.support.orders7d(m.orders7d)} value={m.lastSignInAt ? fmtDate(language, m.lastSignInAt) : a.support.neverSignedIn} />
              </div>

              {m.issues.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {m.issues.map((i) => (
                    <li
                      key={i.code}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        i.level === "blocker" ? "bg-[#FCE4E4] text-[#C0392B]" : i.level === "warning" ? "bg-owed-bg text-owed-text" : "bg-[#F3F6F4] text-ink-soft"
                      }`}
                    >
                      {a.health.codes[i.code] ?? i.code}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                <Mini n={m.products} l={a.merchants.stats.products} />
                <Mini n={m.orders} l={a.merchants.stats.orders} />
                <Mini n={m.agents} l={a.merchants.stats.agents} />
                <Mini n={formatMoney(m.gmvCents)} l={a.merchants.stats.gmv} />
                <Mini n={m.paidCents === null ? "—" : formatMoney(m.paidCents)} l={a.merchants.stats.collected} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <button
                  onClick={() => onCockpit(m)}
                  className="h-8 cursor-pointer rounded-lg bg-[#E7F1FB] px-3 text-[12px] font-extrabold text-[#1A6BB8] active:scale-95"
                >
                  {a.merchants.cockpit}
                </button>
                <a
                  href={`/b/${m.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 rounded-lg bg-[#F3F6F4] px-3 text-[12px] font-extrabold leading-8 text-ink-soft active:scale-95"
                >
                  {a.merchants.storefront}
                </a>
                <a
                  href={`/admin/marchand/${m.id}`}
                  className="h-8 rounded-lg bg-[#F3F6F4] px-3 text-[12px] font-extrabold leading-8 text-ink-soft active:scale-95"
                >
                  {a.support.open}
                </a>
                {m.phone_e164 && nudgeStepOf(m) && (
                  <a
                    href={waMeLink(
                      m.phone_e164,
                      a.support.nudgeMessage({ shop: m.name, step: a.support.nudgeSteps[nudgeStepOf(m) as string] ?? "" }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 rounded-lg bg-owed-bg px-3 text-[12px] font-extrabold leading-8 text-owed-text active:scale-95"
                  >
                    {a.support.nudge}
                  </a>
                )}
                {m.phone_e164 && m.plan !== "gratis" && !isActive(m) && (
                  <a
                    href={waMeLink(
                      m.phone_e164,
                      a.support.remindMessage({ shop: m.name, plan: planLabel(m.plan, plans), date: fmtDate(language, m.plan_until) }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 rounded-lg bg-brand-green px-3 text-[12px] font-extrabold leading-8 text-white active:scale-95"
                  >
                    {a.support.remind}
                  </a>
                )}

                {m.plan !== "gratis" && (
                  <>
                    <span className="text-[11.5px] font-semibold text-ink-muted">{a.merchants.renew}</span>
                    <RenewButtons
                      disabled={pending}
                      onRenew={(months) =>
                        run("renew-" + m.id, async () => {
                          const res = await renewPlan(m.id, months);
                          if (res.ok && res.until) setMessage(a.merchants.renewed(fmtDate(language, res.until)));
                        })
                      }
                    />
                    <button
                      onClick={() => run("revoke-" + m.id, () => revokePlan(m.id))}
                      disabled={pending && busy === "revoke-" + m.id}
                      className="ml-auto h-8 cursor-pointer rounded-lg bg-rose-100 px-3 text-[12px] font-bold text-rose-700 active:scale-95 disabled:opacity-50"
                    >
                      {a.merchants.revoke}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}

        {shown.length === 0 && <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">{a.merchants.none}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------ Abonnements --------------------------------- */

/* ------------------------------ Changements de numéro ------------------------------ */

function PhonesTab({ data, run, pending, busy }: { data: AdminData; run: Runner; pending: boolean; busy: string | null }) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const queue = data.phoneRequests.filter((r) => r.status === "pending");
  const history = data.phoneRequests.filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 md:px-6">
      <Card>
        <CardTitle title={a.phones.title} hint={a.phones.hint} count={queue.length} />
        <div className="mt-3 rounded-xl bg-[#F3F8F6] p-3">
          <span className="text-[12px] font-extrabold text-brand">{a.phones.checklistTitle}</span>
          <ul className="mt-1 flex flex-col gap-0.5 text-[12px] text-ink-soft">
            {a.phones.checklist.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
        {queue.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">{a.phones.empty}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {queue.map((r) => (
              <PhoneRequestCard key={r.id} request={r} run={run} pending={pending} busy={busy} />
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle title={a.phones.historyTitle} />
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[12.5px]">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{r.businessName}</span>
                  <span className="text-ink-faint">
                    {r.oldPhone ?? "—"} → {r.newPhone}
                    {r.adminNote ? ` · ${r.adminNote}` : ""}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === "approved" ? "bg-[#E7F7F1] text-brand" : "bg-[#F3F6F4] text-ink-muted"}`}>
                    {a.phones.status[r.status as keyof typeof a.phones.status] ?? r.status}
                  </span>
                  <span className="text-[11px] text-ink-faint">{a.phones.decided(r.adminEmail ?? "—", fmtDate(language, r.decidedAt))}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function PhoneRequestCard({ request: r, run, pending, busy }: { request: AdminData["phoneRequests"][number]; run: Runner; pending: boolean; busy: string | null }) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const [note, setNote] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  // La boutique a déjà changé de numéro depuis la demande : la valider
  // écraserait ce changement.
  const stale = (r.currentPhone ?? "") !== (r.oldPhone ?? "");
  const working = pending && busy?.endsWith(r.id);

  function decide(decision: "approve" | "reject") {
    setWarn(null);
    if (decision === "reject" && !note.trim()) return setWarn(a.phones.rejectNeedsNote);
    if (decision === "approve" && !window.confirm(a.phones.confirmApprove(r.businessName, r.newPhone))) return;
    run(`phone-${decision}-${r.id}`, () => decidePhoneChange(r.id, decision, note));
  }

  const docLink = (url: string, label: string) => (
    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
      className="flex h-9 items-center rounded-lg bg-[#E7F1FB] px-3 text-[12px] font-bold text-[#1A6BB8]">
      📎 {label}
    </a>
  );

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-extrabold">{r.businessName}</p>
          <p className="text-[12px] text-ink-muted">
            {a.phones.owner} : {r.ownerName ?? "—"} · {r.ownerEmail ?? "—"}
          </p>
        </div>
        <span className="text-[11px] text-ink-faint">{fmtDateTime(language, r.createdAt)}</span>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2 text-[12.5px] sm:grid-cols-2">
        <div className="rounded-xl bg-white px-3 py-2">
          <span className="block text-[11px] font-semibold text-ink-faint">{a.phones.current}</span>
          <span className="font-bold">{r.currentPhone ?? "—"}</span>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 ring-2 ring-brand/30">
          <span className="block text-[11px] font-semibold text-ink-faint">{a.phones.requested}</span>
          <span className="font-extrabold text-brand">{r.newPhone}</span>
        </div>
      </div>

      <p className="mt-2 text-[12.5px]">
        <span className="font-bold">{a.phones.reason} : </span>
        {a.phones.reasons[r.reason as keyof typeof a.phones.reasons] ?? r.reason} · {a.phones.notice(r.noticeDays)}
      </p>
      {r.note && (
        <p className="mt-1 whitespace-pre-line rounded-xl bg-white px-3 py-2 text-[12.5px] text-ink-soft">
          <span className="font-bold">{a.phones.note} : </span>
          {r.note}
        </p>
      )}
      {stale && <p className="mt-2 rounded-xl bg-[#FCE4E4] px-3 py-2 text-[12px] font-bold text-[#C0392B]">{a.phones.stale}</p>}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {r.idDocUrl ? docLink(r.idDocUrl, a.phones.idDoc) : <span className="text-[12px] text-ink-faint">{a.phones.idDoc} : {a.phones.noDoc}</span>}
        {r.proofUrls.map((u, i) => docLink(u, `${a.phones.proofs} ${i + 1}`))}
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[11.5px] font-semibold text-ink-muted">{a.phones.adminNote}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder={a.phones.adminNotePlaceholder}
          className="rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand" />
      </label>
      {warn && <p className="mt-1.5 text-[12px] font-bold text-[#C0392B]">{warn}</p>}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" disabled={working} onClick={() => decide("approve")}
          className="h-10 flex-1 cursor-pointer rounded-xl bg-brand px-4 text-[13px] font-black text-white disabled:opacity-60">
          {a.phones.approve}
        </button>
        <button type="button" disabled={working} onClick={() => decide("reject")}
          className="h-10 cursor-pointer rounded-xl bg-[#FCE4E4] px-4 text-[13px] font-black text-[#C0392B] disabled:opacity-60">
          {a.phones.reject}
        </button>
      </div>
    </div>
  );
}

function BillingTab({ data, run, pending, busy }: { data: AdminData; run: Runner; pending: boolean; busy: string | null }) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const plans = data.platformPlans ?? [];

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 md:px-6">
      <section className="flex flex-col gap-2.5">
        <CardTitle title={a.billing.pendingTitle} count={data.pendingPayments.length} />
        {data.pendingPayments.map((p) => (
          <div key={p.id} className={`rounded-2xl border bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] ${p.isDuplicateRef ? "border-rose-400" : "border-line"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[15px] font-bold">{p.businesses?.name ?? "—"}</span>
              {p.isDuplicateRef && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">{a.billing.duplicateBadge}</span>
              )}
            </div>
            <span className="text-[12.5px] text-ink-faint">
              {planLabel(p.plan, plans)} · {formatMoney(p.amount_cents)} · {p.pay_method}
              {p.pay_ref ? ` · ${a.billing.reference(p.pay_ref)}` : ""} · {fmtDateTime(language, p.created_at)}
            </span>
            {p.isDuplicateRef && <p className="mt-1.5 text-[12px] font-semibold text-rose-700">{a.billing.duplicateHint}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => run(p.id, () => activatePlan(p.id, p.business_id, p.plan))}
                disabled={pending && busy === p.id}
                className="h-10 flex-1 cursor-pointer rounded-xl bg-brand-green text-sm font-bold text-white disabled:opacity-60"
              >
                {a.billing.activate}
              </button>
              <button
                onClick={() => run(p.id, () => rejectPayment(p.id))}
                disabled={pending && busy === p.id}
                className="h-10 cursor-pointer rounded-xl bg-[#FCE4E4] px-4 text-sm font-bold text-[#C0392B] disabled:opacity-60"
              >
                {a.billing.reject}
              </button>
            </div>
          </div>
        ))}
        {data.pendingPayments.length === 0 && <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">{a.billing.noPending}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <CardTitle title={a.billing.historyTitle} count={data.paymentHistory.length} />
        <Card>
          {data.paymentHistory.length === 0 ? (
            <p className="py-2 text-center text-sm text-ink-faint">{a.billing.noHistory}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {data.paymentHistory.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold">{p.businesses?.name ?? "—"}</span>
                    <span className="text-ink-faint">
                      {planLabel(p.plan, plans)} · {formatMoney(p.amount_cents)} · {p.pay_method}
                      {p.pay_ref ? ` · ${a.billing.reference(p.pay_ref)}` : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
                        p.status === "confirmed" ? "bg-[#E7F7F1] text-brand" : "bg-[#FCE4E4] text-[#C0392B]"
                      }`}
                    >
                      {p.status === "confirmed" ? a.billing.statuses.confirmed : a.billing.statuses.rejected}
                    </span>
                    <span className="text-[11px] text-ink-faint">{fmtDateTime(language, p.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <CardTitle title={a.billing.platformTitle} hint={a.billing.platformHint} />
        <PlatformPaymentCard payInfo={data.platformPaymentInfo} run={run} pending={pending} />
      </section>

      <section className="flex flex-col gap-2">
        <CardTitle title={a.billing.legal.title} hint={a.billing.legal.hint} />
        <LegalInfoCard info={data.legalInfo} run={run} pending={pending} />
      </section>

      <section className="flex flex-col gap-3">
        <CardTitle title={a.billing.plansTitle} hint={a.billing.plansHint} />
        {plans.map((p) => (
          <PlanEditorCard key={p.key} plan={p} run={run} pending={pending} />
        ))}
      </section>
    </div>
  );
}

function LegalInfoCard({
  info,
  run,
  pending,
}: {
  info: AdminData["legalInfo"];
  run: Runner;
  pending: boolean;
}) {
  const a = useDict(ADMIN_COPY);
  const c = useDict(COMMON_COPY);
  const [entity, setEntity] = useState(info?.entity ?? "");
  const [email, setEmail] = useState(info?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(info?.whatsapp ?? "");
  const [address, setAddress] = useState(info?.address ?? "");
  const [updatedOn, setUpdatedOn] = useState(info?.updatedOn ?? "");
  const nothing = !entity.trim() && !email.trim() && !whatsapp.trim();

  return (
    <Card>
      {nothing && (
        <p className="mb-4 rounded-xl border border-amber-300 bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">
          {a.billing.legal.empty}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={a.billing.legal.entity}>
          <input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="CONVERZA" className={inputCls} />
        </Field>
        <Field label={a.billing.legal.email}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@…" className={inputCls} />
        </Field>
        <Field label={a.billing.legal.whatsapp}>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+509 0000 0000" className={inputCls} />
        </Field>
        <Field label={a.billing.legal.updatedOn}>
          <input value={updatedOn} onChange={(e) => setUpdatedOn(e.target.value)} placeholder="2026-09-19" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={a.billing.legal.address}>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => run("save-legal-info", () => updateLegalInfoConfig({ entity, email, whatsapp, address, updatedOn }))}
          disabled={pending}
          className="h-12 flex-1 cursor-pointer rounded-2xl bg-brand text-base font-extrabold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? c.actions.saving : a.billing.legal.save}
        </button>
        <a
          href="/kondisyon"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center rounded-2xl border border-line bg-white px-5 text-sm font-bold text-ink"
        >
          {a.billing.legal.view}
        </a>
      </div>
    </Card>
  );
}

function PlatformPaymentCard({
  payInfo,
  run,
  pending,
}: {
  payInfo?: AdminData["platformPaymentInfo"];
  run: Runner;
  pending: boolean;
}) {
  const a = useDict(ADMIN_COPY);
  const c = useDict(COMMON_COPY);
  const [moncash, setMoncash] = useState(payInfo?.moncash ?? "");
  const [natcash, setNatcash] = useState(payInfo?.natcash ?? "");
  const [zelle, setZelle] = useState(payInfo?.zelle ?? "");
  const [usdt, setUsdt] = useState(payInfo?.usdt ?? "");
  const [moncashQr, setMoncashQr] = useState(payInfo?.moncash_qr_url ?? "");
  const [natcashQr, setNatcashQr] = useState(payInfo?.natcash_qr_url ?? "");
  // Aucun compte pré-rempli : les numéros de démonstration affichés ici
  // finissaient par être proposés aux marchands comme comptes officiels.
  const [banks, setBanks] = useState<BankAccountDetails[]>(payInfo?.bank_details ?? []);

  function readImage(file: File | undefined, setter: (v: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(String(e.target.result));
    };
    reader.readAsDataURL(file);
  }

  const nothingConfigured =
    !moncash.trim() && !natcash.trim() && !zelle.trim() && !usdt.trim() && banks.length === 0;

  return (
    <Card>
      {nothingConfigured && (
        <p className="mb-4 rounded-xl border border-amber-300 bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">
          {a.billing.notConfigured}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {([
          ["moncash", a.billing.moncashNumber, moncash, setMoncash, moncashQr, setMoncashQr],
          ["natcash", a.billing.natcashNumber, natcash, setNatcash, natcashQr, setNatcashQr],
        ] as const).map(([key, label, value, setValue, qr, setQr]) => (
          <div key={key} className="rounded-2xl border border-line bg-[#F9FBFB] p-4">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink-muted">{label}</span>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="+509 0000 0000" className={inputCls} />
            </label>
            <div className="mt-3 flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-ink-muted">{a.billing.qrUpload}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => readImage(e.target.files?.[0], setQr)}
                className="block w-full text-xs text-ink-muted file:mr-2 file:rounded-xl file:border-0 file:bg-brand-green/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand"
              />
              {qr ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="" className="h-20 w-20 rounded-lg border border-line object-contain" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-brand">{a.billing.qrReady}</span>
                    <button onClick={() => setQr("")} className="mt-1 cursor-pointer text-[11px] font-bold text-rose-600 hover:underline">
                      {a.billing.qrRemove}
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-ink-faint">{a.billing.noQr}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-[#F9FBFB] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[14px] font-extrabold">{a.billing.banksTitle}</span>
          <button
            onClick={() => setBanks([...banks, { bank_name: "", account_number: "", currency: "HTG", account_holder: "" }])}
            className="h-8 cursor-pointer rounded-xl bg-brand/10 px-3 text-[12px] font-extrabold text-brand active:scale-95"
          >
            {a.billing.addBank}
          </button>
        </div>

        {banks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-ink-faint">{a.billing.noBank}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {banks.map((b, idx) => {
              const update = (patch: Partial<BankAccountDetails>) =>
                setBanks(banks.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
              return (
                <div key={idx} className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white p-3 sm:grid-cols-4">
                  <Field label={a.billing.bankName}>
                    <input value={b.bank_name} onChange={(e) => update({ bank_name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label={a.billing.accountNumber}>
                    <input value={b.account_number} onChange={(e) => update({ account_number: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label={a.billing.currency}>
                    <Select value={b.currency} onChange={(e) => update({ currency: e.target.value as "HTG" | "USD" })} triggerClassName={inputCls}>
                      <option value="HTG">HTG</option>
                      <option value="USD">USD</option>
                    </Select>
                  </Field>
                  <div className="flex items-end gap-2">
                    <Field label={a.billing.accountHolder}>
                      <input value={b.account_holder} onChange={(e) => update({ account_holder: e.target.value })} className={inputCls} />
                    </Field>
                    <button
                      onClick={() => setBanks(banks.filter((_, i) => i !== idx))}
                      aria-label={a.billing.removeBank}
                      className="mb-1 h-9 cursor-pointer rounded-lg px-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={a.billing.zelle}>
          <input value={zelle} onChange={(e) => setZelle(e.target.value)} placeholder="payments@converza.ht" className={inputCls} />
        </Field>
        <Field label={a.billing.usdt}>
          <input value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="T..." className={inputCls} />
        </Field>
      </div>

      <button
        onClick={() => {
          const summary = banks.map((b) => `${b.bank_name} ${b.currency} #${b.account_number} (${b.account_holder})`).join(" / ");
          run("save-payment-info", () => updatePaymentInfoConfig(moncash, natcash, summary, zelle, usdt, moncashQr, natcashQr, banks));
        }}
        disabled={pending}
        className="mt-5 h-12 w-full cursor-pointer rounded-2xl bg-brand text-base font-extrabold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? c.actions.saving : a.billing.savePayments}
      </button>
    </Card>
  );
}

/**
 * Offre : le prix d'un côté, les textes par langue de l'autre.
 *
 * Ces textes s'affichent sur la page d'accueil comme sur la page Abonnement.
 * Les avantages se saisissent un par ligne : séparés par des virgules, un
 * avantage qui en contenait une (« Notes pour la cuisine, sans piment ») se
 * coupait en deux.
 */
function PlanEditorCard({ plan, run, pending }: { plan: Plan; run: Runner; pending: boolean }) {
  const a = useDict(ADMIN_COPY);
  const c = useDict(COMMON_COPY);
  const [price, setPrice] = useState(plan.priceGdes);
  const [lang, setLang] = useState<Language>("fr");
  const saved = planTexts(plan, lang);
  const [name, setName] = useState(saved.name);
  const [tagline, setTagline] = useState(saved.tagline);
  const [features, setFeatures] = useState(saved.features.join("\n"));

  // Changer de langue recharge les textes de cette langue.
  const switchLang = (next: Language) => {
    const texts = planTexts(plan, next);
    setLang(next);
    setName(texts.name);
    setTagline(texts.tagline);
    setFeatures(texts.features.join("\n"));
  };

  const priceDirty = price !== plan.priceGdes;
  const textDirty = name !== saved.name || tagline !== saved.tagline || features !== saved.features.join("\n");

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[16px] font-extrabold">{plan.name}</span>
        {/* Le prix enregistré, pas celui en train d'être tapé. */}
        <span className="text-[14px] font-black text-brand">
          {plan.priceGdes === 0 ? a.billing.free : `${formatMoney(plan.priceGdes * 100)} ${a.billing.perMonth}`}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <Field label={a.billing.planPrice}>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <button
          onClick={() => run("save-plan-" + plan.key, () => updatePlanConfig(plan.key, price))}
          disabled={pending || !priceDirty}
          className="h-10 shrink-0 rounded-xl bg-brand-green/15 px-4 text-[13px] font-extrabold text-brand active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? c.actions.saving : a.billing.savePrice}
        </button>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-muted">{a.billing.planTextsTitle}</span>
          {(["fr", "ht", "en"] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`rounded-full px-3 py-1 text-[12px] font-extrabold ${lang === l ? "bg-brand text-white" : "bg-[#F3F6F4] text-ink-soft"}`}
            >
              {a.billing.planLangs[l]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11.5px] text-ink-faint">{a.billing.planTextsHint}</p>

        <div className="mt-3 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
          <Field label={a.billing.planName}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label={a.billing.planTagline}>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={a.billing.planFeatures} hint={a.billing.planFeaturesHint}>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={Math.min(8, Math.max(3, features.split("\n").length + 1))}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <button
          onClick={() => run("save-plan-texts-" + plan.key + lang, () => updatePlanTexts(plan.key, lang, { name, tagline, features }))}
          disabled={pending || !textDirty}
          className="mt-3 h-10 w-full rounded-xl bg-brand-green/15 text-[13px] font-extrabold text-brand active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? c.actions.saving : a.billing.savePlanTexts(a.billing.planLangs[lang])}
        </button>
      </div>
    </Card>
  );
}

/* -------------------------------------- Menu QR ----------------------------------- */

function QrMenuTab({
  data,
  run,
  pending,
  busy,
  onPrint,
}: {
  data: AdminData;
  run: Runner;
  pending: boolean;
  busy: string | null;
  onPrint: (m: AdminMerchant) => void;
}) {
  const a = useDict(ADMIN_COPY);
  const plans = data.platformPlans ?? [];
  const premiumPrice = plans.find((p) => p.key === "premium")?.priceGdes ?? 0;
  const settings = data.platformSettings?.qrMenuService;
  const [q, setQ] = useState("");

  const limits = settings?.tableLimits ?? { gratis: 5, pro: 25, premium: 50 };
  const venues = data.merchants.filter(
    (m) => m.plan === "premium" || (m.business_type ?? "").toLowerCase().startsWith("restaur"),
  );
  const subscribers = data.merchants.filter((m) => m.plan === "premium" && isActive(m)).length;
  const shown = venues.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.slug.includes(q.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 md:px-6">
      <Card>
        <CardTitle title={a.qr.title} hint={a.qr.subtitle} />
        <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-ink-muted">{a.qr.includedInPremium}</p>
      </Card>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={a.qr.kpis.restaurants} value={String(venues.length)} sub={a.qr.kpis.restaurantsHint(subscribers)} />
        <Kpi label={a.qr.kpis.mrr} value={formatMoney(subscribers * premiumPrice * 100)} sub={a.qr.kpis.mrrHint} />
        <Kpi label={a.qr.kpis.orders} value={String(venues.reduce((s, m) => s + m.orders, 0))} sub={a.qr.kpis.ordersHint} />
        <Kpi label={a.qr.kpis.gmv} value={formatMoney(venues.reduce((s, m) => s + m.gmvCents, 0))} sub={a.qr.kpis.gmvHint} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={a.qr.search}
          aria-label={a.qr.search}
          className="h-11 min-w-[220px] flex-1 rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none focus:border-brand"
        />
        <span className="text-xs font-bold text-ink-muted">{a.qr.showing(shown.length, venues.length)}</span>
      </div>

      <div className="flex flex-col gap-3">
        {shown.map((m) => {
          const tableLimit = m.plan === "premium" ? limits.premium : m.plan === "pro" ? limits.pro : m.plan === "qr_express" ? limits.pro : limits.gratis;
          return (
            <article key={m.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-extrabold">{m.name}</span>
                    <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10.5px] font-black uppercase text-amber-950">
                      {planLabel(m.plan, plans)}
                    </span>
                  </div>
                  <span className="text-xs text-ink-faint">/b/{m.slug} · {m.phone_e164 ?? "—"}</span>
                </div>
                <Select
                  value={m.plan}
                  onChange={(e) => run("plan-" + m.id, () => setPlan(m.id, e.target.value))}
                  disabled={pending && busy === "plan-" + m.id}
                  triggerClassName="h-9 cursor-pointer rounded-lg border border-line bg-[#F7F8F9] px-2.5 text-xs font-bold outline-none"
                >
                  {PLAN_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {planLabel(key, plans)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="my-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <Mini n={m.products} l={a.qr.dishes} />
                <Mini n={m.orders} l={a.qr.orders} />
                <Mini n={tableLimit} l={a.qr.tableLimit} />
                <Mini n={formatMoney(m.gmvCents)} l="GMV" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[1, 5].map((n) => (
                  <a
                    key={n}
                    href={`/b/${m.slug}?table=${n}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 rounded-lg bg-amber-500/15 px-3 text-xs font-bold leading-8 text-amber-800"
                  >
                    {a.qr.testTable(n)}
                  </a>
                ))}
                <button
                  onClick={() => onPrint(m)}
                  className="h-8 cursor-pointer rounded-lg bg-brand px-3.5 text-xs font-extrabold text-white active:scale-95"
                >
                  {a.qr.printCards}
                </button>
              </div>
            </article>
          );
        })}

        {shown.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-xs text-ink-faint">{a.qr.none}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------- Plateforme --------------------------------- */

function PlatformTab({ data, run, pending }: { data: AdminData; run: Runner; pending: boolean }) {
  const a = useDict(ADMIN_COPY);
  const c = useDict(COMMON_COPY);
  const look = useDict(SETTINGS_COPY).look;
  const cash = useDict(MESSAGE_COPY).cashOnDelivery;
  const settings = data.platformSettings;
  const [saved, setSaved] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<LayoutKey | null>(null);
  // Par défaut, une vitrine d'exemple : on voit chaque modèle par type de
  // commerce sans dépendre d'un compte marchand.
  const [source, setSource] = useState<PreviewSource>({ kind: "demo", sector: "commerce_vente", theme: SECTOR_THEME });
  const designCopy = useDict(DESIGN_COPY);
  const previewSector = sectorOfSource(source, data.merchants);

  const [designs, setDesigns] = useState<DesignLayoutConfig[]>(
    settings?.designs ?? [
      { key: "design1", name: look.designs.design1, tag: "", minPlanRequired: "gratis", enabled: true },
      { key: "design2", name: look.designs.design2, tag: "", minPlanRequired: "pro", enabled: true },
      { key: "design3", name: look.designs.design3, tag: "", minPlanRequired: "premium", enabled: true },
    ],
  );
  const [imageRatios, setImageRatios] = useState(
    settings?.imageRatios ?? [
      { key: "1:1" as const, label: "1:1", enabled: true },
      { key: "3:4" as const, label: "3:4", enabled: true },
      { key: "16:9" as const, label: "16:9", enabled: true },
      { key: "stretch" as const, label: "100%", enabled: false },
    ],
  );
  const [maxImageMb, setMaxImageMb] = useState(settings?.maxImageSizeMb ?? 5);
  const [quality, setQuality] = useState(settings?.imageCompressionQuality ?? 85);
  const [languages, setLanguages] = useState(
    settings?.languages ?? [
      { code: "fr" as const, name: "Français", flag: "🇫🇷", enabled: true, isDefault: true },
      { code: "ht" as const, name: "Kreyòl", flag: "🇭🇹", enabled: true },
      { code: "en" as const, name: "English", flag: "🇺🇸", enabled: true },
    ],
  );
  const [payMethods, setPayMethods] = useState(
    settings?.paymentMethods ?? {
      moncashEnabled: true,
      natcashEnabled: true,
      bankEnabled: true,
      zelleEnabled: true,
      usdtEnabled: true,
      cashOnDeliveryEnabled: true,
    },
  );
  const [flags, setFlags] = useState(
    settings?.featureFlags ?? {
      aiAssistantEnabled: true,
      antiFraudDetectorEnabled: true,
      whatsappAutoRemindersEnabled: true,
      excelExportEnabled: true,
      maintenanceMode: false,
    },
  );
  const [qrService, setQrService] = useState<QrMenuServiceConfig>(
    settings?.qrMenuService ?? {
      enabled: true,
      standalonePriceGdes: 500,
      tableLimits: { gratis: 5, pro: 25, premium: 50 },
      allowKitchenNotes: true,
      autoOpenWhatsapp: true,
    },
  );

  function saveAll() {
    setSaved(false);
    run("save-platform-settings", async () => {
      const res = await updateGlobalSettingsAction({
        designs,
        imageRatios,
        maxImageSizeMb: maxImageMb,
        imageCompressionQuality: quality,
        languages,
        qrMenuService: qrService,
        paymentMethods: payMethods,
        featureFlags: flags,
      });
      if (res.ok) setSaved(true);
    });
  }

  const payLabels: Record<string, string> = {
    moncashEnabled: "MonCash",
    natcashEnabled: "NatCash",
    bankEnabled: a.billing.banksTitle,
    zelleEnabled: "Zelle",
    usdtEnabled: "USDT (TRC-20)",
    cashOnDeliveryEnabled: cash,
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 md:px-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold">{a.platform.title}</h2>
            <p className="text-xs text-ink-muted">{a.platform.subtitle}</p>
          </div>
          <button
            onClick={saveAll}
            disabled={pending}
            className="h-10 cursor-pointer rounded-xl bg-brand px-4 text-xs font-black text-white active:scale-95 disabled:opacity-60"
          >
            {pending ? c.actions.saving : a.platform.saveAll}
          </button>
        </div>
        {saved && <p className="mt-2 rounded-xl bg-[#E7F7F1] px-3 py-2 text-[12.5px] font-semibold text-brand">{a.platform.saved}</p>}
      </Card>

      <Card>
        <CardTitle title={a.platform.designsTitle} hint={a.platform.designsHint} />
        <PreviewControls source={source} onChange={setSource} merchants={data.merchants} />
        <p className="mt-2 text-[11.5px] text-ink-muted">{designName(designCopy, previewSector, 0).name} · {designName(designCopy, previewSector, 1).name} · {designName(designCopy, previewSector, 2).name}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STOREFRONT_LAYOUTS.map((l, index) => {
            const spec = designFor(previewSector, l.key);
            const names = designName(designCopy, previewSector, index as 0 | 1 | 2);
            const rule = layoutRule(l.key, designs);
            const isBase = l.key === DEFAULT_LAYOUT;
            // Les noms stockés en base datent d'une ancienne version : on
            // affiche toujours le libellé traduit de la clé.
            const patch = (change: Partial<DesignLayoutConfig>) =>
              setDesigns((cur) => {
                const existing = cur.find((x) => x.key === l.key);
                const next = { ...(existing ?? { key: l.key, name: look.designs[l.key], tag: "", minPlanRequired: rule.minPlan, enabled: rule.enabled }), ...change };
                return existing ? cur.map((x) => (x.key === l.key ? next : x)) : [...cur, next];
              });
            return (
              <div key={l.key} className={`flex flex-col gap-2.5 rounded-xl border p-3 ${rule.enabled ? "border-emerald-300 bg-[#F3F8F6]" : "border-line bg-[#F7F8F9] opacity-70"}`}>
                <MiniStorefront src={`${previewSrc(source, l.key)}#vedettes`} title={names.name} onOpen={() => setPreviewLayout(l.key)} />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-14 shrink-0"><LayoutThumbMini shape={spec.shape} color={themeOf(source.kind === "demo" ? source.theme : SECTOR_THEME, previewSector).accent} /></span>
                    <span className="text-sm font-extrabold">{names.name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-ink-muted">{look.images(spec.slots)}</span>
                </div>
                <label className="flex items-center justify-between gap-2 text-[11.5px] font-bold text-ink-muted">
                  {a.platform.minPlanLabel}
                  <Select
                    value={isBase ? "gratis" : rule.minPlan}
                    disabled={isBase}
                    onChange={(e) => patch({ minPlanRequired: e.target.value as DesignLayoutConfig["minPlanRequired"] })}
                    triggerClassName="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-ink outline-none disabled:opacity-60"
                  >
                    {(["gratis", "pro", "premium"] as const).map((k) => (
                      <option key={k} value={k}>{planLabel(k, data.platformPlans ?? [])}</option>
                    ))}
                  </Select>
                </label>
                {isBase ? (
                  <span className="rounded-lg bg-white py-1.5 text-center text-[11px] font-bold text-ink-muted">{a.platform.alwaysOn}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => patch({ enabled: !rule.enabled })}
                    className={`w-full cursor-pointer rounded-lg py-1.5 text-xs font-black ${rule.enabled ? "bg-brand text-white" : "bg-[#EEF2F3] text-ink-muted"}`}
                  >
                    {rule.enabled ? a.platform.enabled : a.platform.disabled}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewLayout(l.key)}
                  className="w-full cursor-pointer rounded-lg border border-line bg-white py-1.5 text-xs font-bold text-ink-soft"
                >
                  {a.platform.previewButton}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {previewLayout && (
        <LayoutPreviewModal merchants={data.merchants} initial={previewLayout} initialSource={source} onClose={() => setPreviewLayout(null)} />
      )}

      <Card>
        <CardTitle title={a.platform.imagesTitle} />
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-xs font-bold text-ink-muted">{a.platform.ratiosLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              {imageRatios.map((r, idx) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setImageRatios(imageRatios.map((x, i) => (i === idx ? { ...x, enabled: !x.enabled } : x)))}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs font-bold ${r.enabled ? "border-emerald-500 bg-[#E7F7F1] text-brand" : "border-line bg-[#F7F8F9] text-ink-faint"}`}
                >
                  <span>{r.key === "stretch" ? "100 %" : r.key}</span>
                  <span>{r.enabled ? "✓" : "✕"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Field label={a.platform.maxSize}>
              <input type="number" value={maxImageMb} onChange={(e) => setMaxImageMb(Number(e.target.value))} className={inputCls} />
            </Field>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink-muted">{a.platform.quality(quality)}</span>
              <input type="range" min="50" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand" />
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle title={a.platform.languagesTitle} hint={a.platform.languagesHint} />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {languages.map((l, idx) => (
            <div key={l.code} className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3 ${l.enabled ? "border-emerald-300 bg-white" : "border-line bg-[#F7F8F9] text-ink-faint"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xl">{l.flag}</span>
                {l.isDefault && <span className="rounded bg-brand px-1.5 py-0.5 text-[9.5px] font-black text-white">{a.platform.defaultBadge}</span>}
              </div>
              <span className="text-xs font-black">{l.name}</span>
              <button
                type="button"
                onClick={() => setLanguages(languages.map((x, i) => (i === idx ? { ...x, enabled: !x.enabled } : x)))}
                className={`w-full cursor-pointer rounded-lg py-1 text-[11px] font-bold ${l.enabled ? "bg-[#E7F7F1] text-brand" : "bg-[#EEF2F3] text-ink-muted"}`}
              >
                {l.enabled ? a.platform.available : a.platform.unavailable}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle title={a.platform.payMethodsTitle} hint={a.platform.payMethodsHint} />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(payMethods).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPayMethods({ ...payMethods, [key]: !value })}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${value ? "border-emerald-500 bg-[#E7F7F1] text-brand" : "border-line bg-[#F7F8F9] text-ink-faint"}`}
            >
              <span>{payLabels[key] ?? key}</span>
              <span>{value ? a.platform.on : a.platform.off}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle title={a.platform.flagsTitle} hint={a.platform.flagsHint} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ["aiAssistantEnabled", a.platform.flags.aiAssistant],
            ["antiFraudDetectorEnabled", a.platform.flags.antiFraud],
            ["whatsappAutoRemindersEnabled", a.platform.flags.autoReminders],
            ["excelExportEnabled", a.platform.flags.exports],
            ["maintenanceMode", a.platform.flags.maintenance],
          ] as const).map(([key, copy]) => {
            const value = flags[key as keyof typeof flags];
            return (
              <div key={key} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${value ? "border-emerald-300 bg-white" : "border-line bg-[#F7F8F9]"}`}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-extrabold text-ink">{copy.label}</span>
                  <span className="text-[10.5px] text-ink-faint">{copy.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlags({ ...flags, [key]: !value })}
                  className={`shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-black ${value ? "bg-brand text-white" : "bg-[#EEF2F3] text-ink-muted"}`}
                >
                  {value ? a.platform.on : a.platform.off}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle title={a.platform.qrServiceTitle} />
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${qrService.enabled ? "border-emerald-300 bg-[#F3F8F6]" : "border-line bg-[#F7F8F9]"}`}>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold">{a.platform.qrServiceStatus}</span>
                <span className="text-[10.5px] text-ink-faint">{a.platform.qrServiceStatusHint}</span>
              </div>
              <button
                type="button"
                onClick={() => setQrService({ ...qrService, enabled: !qrService.enabled })}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-black ${qrService.enabled ? "bg-brand text-white" : "bg-[#EEF2F3] text-ink-muted"}`}
              >
                {qrService.enabled ? a.platform.on : a.platform.off}
              </button>
            </div>

            <Field label={a.platform.qrServicePrice} hint={a.platform.qrServicePriceHint}>
              <input
                type="number"
                value={qrService.standalonePriceGdes}
                onChange={(e) => setQrService({ ...qrService, standalonePriceGdes: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink-muted">{a.platform.tableLimitsTitle}</span>
            <div className="grid grid-cols-3 gap-2">
              {(["gratis", "pro", "premium"] as const).map((key) => (
                <Field key={key} label={planLabel(key, data.platformPlans ?? [])}>
                  <input
                    type="number"
                    value={qrService.tableLimits[key]}
                    onChange={(e) => setQrService({ ...qrService, tableLimits: { ...qrService.tableLimits, [key]: Number(e.target.value) } })}
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["allowKitchenNotes", a.platform.kitchenNotes],
                ["autoOpenWhatsapp", a.platform.whatsappDirect],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQrService({ ...qrService, [key]: !qrService[key] })}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-[11px] font-bold ${qrService[key] ? "border-emerald-500 bg-[#E7F7F1] text-brand" : "border-line bg-[#F7F8F9] text-ink-faint"}`}
                >
                  <span>{label}</span>
                  <span>{qrService[key] ? "✓" : "✕"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <button
        onClick={saveAll}
        disabled={pending}
        className="mb-2 h-14 w-full cursor-pointer rounded-2xl bg-brand text-base font-extrabold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? c.actions.saving : a.platform.saveAll}
      </button>
    </div>
  );
}

/* -------------------------------------- Sécurité ---------------------------------- */

function SecurityTab({ data }: { data: AdminData }) {
  const a = useDict(ADMIN_COPY);
  const { language } = useLanguage();
  const checks = data.checks;

  const rows: { ok: boolean; label: string; desc: string }[] = [
    { ok: checks.serviceRoleKey, label: a.security.checks.serviceRole.label, desc: a.security.checks.serviceRole.desc },
    { ok: checks.adminEmails > 0, label: a.security.checks.adminEmails.label, desc: a.security.checks.adminEmails.desc(checks.adminEmails) },
    { ok: checks.inviteSecret, label: a.security.checks.inviteSecret.label, desc: a.security.checks.inviteSecret.desc },
    { ok: Boolean(checks.siteUrl), label: a.security.checks.siteUrl.label, desc: checks.siteUrl || a.security.checks.siteUrl.desc },
    { ok: checks.auditTable, label: a.security.checks.auditTable.label, desc: a.security.checks.auditTable.desc },
    { ok: checks.statsView, label: a.security.checks.statsView.label, desc: a.security.checks.statsView.desc },
    { ok: checks.extendedStats, label: a.security.checks.extendedStats.label, desc: a.security.checks.extendedStats.desc },
    { ok: checks.phoneChanges, label: a.security.checks.phoneChanges.label, desc: a.security.checks.phoneChanges.desc },
    { ok: checks.support, label: a.security.checks.support.label, desc: a.security.checks.support.desc },
    { ok: checks.subscription, label: a.security.checks.subscription.label, desc: a.security.checks.subscription.desc },
    { ok: checks.showcase, label: a.security.checks.showcase.label, desc: a.security.checks.showcase.desc },
  ];
  const needsMigration = !checks.extendedStats || !checks.auditTable || !checks.phoneChanges || !checks.support || !checks.subscription || !checks.showcase;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 md:px-6">
      <Card>
        <CardTitle title={a.security.title} hint={a.security.subtitle} />
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${r.ok ? "border-emerald-200 bg-[#F3F8F6]" : "border-amber-300 bg-owed-bg"}`}>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-extrabold">{r.label}</span>
                <span className="break-all text-[10.5px] text-ink-muted">{r.desc}</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-black ${r.ok ? "bg-[#E7F7F1] text-brand" : "bg-white text-owed-text"}`}>
                {r.ok ? a.security.ok : a.security.missing}
              </span>
            </div>
          ))}
        </div>
        {needsMigration && <p className="mt-3 rounded-xl bg-owed-bg px-3 py-2 text-[12px] font-semibold text-owed-text">{a.security.migrationHint}</p>}
      </Card>

      <Card>
        <CardTitle title={a.security.fraudTitle} hint={a.security.fraudHint} count={data.duplicateRefAlerts.length} />
        {data.duplicateRefAlerts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">{a.security.noFraud}</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {data.duplicateRefAlerts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{p.businesses?.name ?? "—"}</span>
                  <span className="text-ink-faint">
                    {formatMoney(p.amount_cents)} · {p.pay_method} · {p.pay_ref ? a.billing.reference(p.pay_ref) : "—"}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-ink-faint">{fmtDateTime(language, p.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle title={a.support.errors.title} hint={a.support.errors.hint} count={data.appErrors.length} />
        {!data.checks.support ? (
          <p className="mt-2 text-sm text-ink-faint">{a.support.errors.unavailable}</p>
        ) : data.appErrors.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">{a.support.errors.empty}</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {data.appErrors.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2.5 text-[12.5px]">
                <div className="flex min-w-0 flex-col">
                  <span className="font-bold">{e.scope}</span>
                  <span className="break-words text-ink-muted">{e.message}</span>
                </div>
                <span className="shrink-0 text-[11px] text-ink-faint">{fmtDateTime(language, e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle title={a.security.auditTitle} hint={a.security.auditHint} />
        {data.auditLogs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">{a.security.noAudit}</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {data.auditLogs.map((log: Record<string, unknown>) => (
              <li key={String(log.id)} className="flex items-start justify-between gap-3 py-2.5 text-[12.5px]">
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-brand-green/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                      {a.security.actions[String(log.action)] ?? String(log.action)}
                    </span>
                    <span className="truncate font-semibold">{String(log.admin_email ?? "")}</span>
                  </div>
                  {log.details ? <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">{JSON.stringify(log.details)}</span> : null}
                </div>
                <span className="shrink-0 text-[11px] font-medium text-ink-faint">{fmtDateTime(language, String(log.created_at ?? ""))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------- Fiche technique --------------------------------- */

type PreviewSource = { kind: "demo"; sector: string; theme: string } | { kind: "shop"; slug: string };

/** Adresse de l'aperçu : vitrine d'exemple d'un secteur, ou vitrine réelle. */
function previewSrc(source: PreviewSource, layout: LayoutKey): string {
  return source.kind === "demo"
    ? `/apercu/${source.sector}?design=${layout}&theme=${source.theme}`
    : `/b/${source.slug}?apercu=${layout}`;
}

/** Type de commerce affiché par l'aperçu. */
function sectorOfSource(source: PreviewSource, merchants: AdminMerchant[]): string {
  if (source.kind === "demo") return source.sector;
  return verticalOf(merchants.find((m) => m.slug === source.slug)?.business_type).id;
}

/**
 * Choix du type de commerce (vitrine d'exemple) ou d'une vitrine réelle, et
 * des couleurs de l'exemple.
 */
function PreviewControls({ source, onChange, merchants }: { source: PreviewSource; onChange: (s: PreviewSource) => void; merchants: AdminMerchant[] }) {
  const a = useDict(ADMIN_COPY);
  const sectors = useDict(STOREFRONT_COPY).sectors;
  const shops = useMemo(() => [...merchants].filter((m) => m.products > 0).sort((x, y) => y.products - x.products), [merchants]);
  const look = useDict(SETTINGS_COPY).look;
  const theme = source.kind === "demo" ? source.theme : SECTOR_THEME;
  const current = sectorOfSource(source, merchants);

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-[#F7F8F9] p-2.5">
      <span className="text-xs font-bold text-ink-muted">{a.platform.sectorLabel}</span>
      <div className="-mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 pb-1 [scrollbar-width:thin]">
        {Object.keys(INDUSTRY_SECTORS).map((k) => {
          const active = source.kind === "demo" && current === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ kind: "demo", sector: k, theme })}
              aria-pressed={active}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold ${active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: paletteFor(k).strong }} />
              {sectors[k]?.label ?? k}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {source.kind === "demo" ? (
          <div className="flex items-center gap-2 text-xs font-bold text-ink-muted">
            {a.platform.colorsLabel}
            <div className="flex gap-1.5">
              {THEME_KEYS.map((k) => {
                const label = k === SECTOR_THEME ? look.sectorColors : THEMES[k].label;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-label={label}
                    aria-pressed={theme === k}
                    onClick={() => onChange({ ...source, theme: k })}
                    className={`h-7 w-7 cursor-pointer rounded-full ${theme === k ? "ring-2 ring-ink ring-offset-2" : ""}`}
                    style={{ background: themeOf(k, current).accent }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-ink-faint">{a.platform.shopColorsNote}</span>
        )}
        {shops.length > 0 && (
          <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-ink-muted">
            {a.platform.shopsGroup}
            <Select
              value={source.kind === "shop" ? source.slug : ""}
              onChange={(e) => (e.target.value ? onChange({ kind: "shop", slug: e.target.value }) : onChange({ kind: "demo", sector: current, theme }))}
              triggerClassName="h-8 max-w-[220px] rounded-lg border border-line bg-white px-2 text-xs font-bold text-ink outline-none"
            >
              <option value="">—</option>
              {shops.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name} ({m.products})
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>
      {source.kind === "demo" && <span className="text-[11px] text-ink-faint">{a.platform.demoNote}</span>}
    </div>
  );
}

/** Vitrine réduite, positionnée sur les produits mis en avant. */
function MiniStorefront({ src, title, onOpen }: { src: string; title: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      className="relative h-[440px] w-full cursor-zoom-in overflow-hidden rounded-lg bg-[#E9EDEF] ring-1 ring-line"
    >
      {/* Un téléphone de 390 × 800 px réduit à 55 % : la section entière tient. */}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        className="pointer-events-none absolute left-1/2 top-0 h-[800px] w-[390px] origin-top -translate-x-1/2 scale-[0.55] border-0 bg-white"
      />
    </button>
  );
}

/**
 * Aperçu d'une disposition sur la vitrine réelle d'un marchand, via
 * `/b/<slug>?apercu=<disposition>` : rien n'est enregistré, et on voit le rendu
 * avec de vraies photos plutôt qu'une maquette.
 */
function LayoutPreviewModal({
  merchants,
  initial,
  initialSource,
  onClose,
}: {
  merchants: AdminMerchant[];
  initial: LayoutKey;
  initialSource: PreviewSource;
  onClose: () => void;
}) {
  const a = useDict(ADMIN_COPY);
  const look = useDict(SETTINGS_COPY).look;
  const [source, setSource] = useState<PreviewSource>(initialSource);
  const designCopy = useDict(DESIGN_COPY);
  const [layout, setLayout] = useState<LayoutKey>(initial);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const src = previewSrc(source, layout);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs">
      <div className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white text-ink shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3.5">
          <h2 className="mr-auto text-base font-black">{a.platform.previewTitle}</h2>
          <button onClick={onClose} aria-label={a.cockpit.close} className="h-9 w-9 cursor-pointer rounded-full bg-[#F3F6F4] font-bold text-ink-soft">
            ✕
          </button>
        </div>

        <>
            <div className="px-3.5">
              <PreviewControls source={source} onChange={setSource} merchants={merchants} />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3.5 py-2.5">
              <div className="flex gap-1 rounded-xl bg-[#F3F6F4] p-1">
                {STOREFRONT_LAYOUTS.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLayout(l.key)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold ${layout === l.key ? "bg-white text-brand shadow-sm" : "text-ink-muted"}`}
                  >
                    {designName(designCopy, sectorOfSource(source, merchants), STOREFRONT_LAYOUTS.indexOf(l) as 0 | 1 | 2).name}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 rounded-xl bg-[#F3F6F4] p-1">
                {(["phone", "desktop"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold ${device === d ? "bg-white text-brand shadow-sm" : "text-ink-muted"}`}
                  >
                    {d === "phone" ? a.platform.phone : a.platform.desktop}
                  </button>
                ))}
              </div>
              <a href={src} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-bold text-[#1A6BB8]">
                {a.platform.openTab} ↗
              </a>
            </div>

            <div className="flex flex-1 justify-center overflow-hidden bg-[#E9EDEF] p-3">
              <iframe
                key={src}
                src={src}
                title={a.platform.previewTitle}
                className={`h-full rounded-2xl bg-white shadow-lg ${device === "phone" ? "w-[390px] max-w-full" : "w-full"}`}
              />
            </div>
        </>
      </div>
    </div>
  );
}

function CockpitModal({ merchant, onClose, onRefresh }: { merchant: AdminMerchant; onClose: () => void; onRefresh: () => void }) {
  const a = useDict(ADMIN_COPY);
  const c = useDict(COMMON_COPY);
  const look = useDict(SETTINGS_COPY).look;
  const designCopy = useDict(DESIGN_COPY);
  const sectors = useDict(STOREFRONT_COPY).sectors;
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<keyof AdminCopy["cockpit"]["tabs"]>("structure");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: merchant.name,
    slug: merchant.slug,
    phone_e164: merchant.phone_e164 ?? "",
    business_type: merchant.business_type ?? "commerce_vente",
    layout: isLayoutKey(merchant.layout) ? merchant.layout : DEFAULT_LAYOUT,
    theme: merchant.theme ?? "whatsapp",
    default_currency: merchant.default_currency ?? "HTG",
    category: merchant.category ?? "",
    address: merchant.address ?? "",
    hours: merchant.hours ?? "",
    logo_url: merchant.logo_url ?? "",
    cover_url: merchant.cover_url ?? "",
    social_instagram: merchant.social_instagram ?? "",
    social_facebook: merchant.social_facebook ?? "",
    social_tiktok: merchant.social_tiktok ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  function saveStructure() {
    start(async () => {
      const res = await updateMerchantStructureAction(merchant.id, form);
      if (res.ok) {
        setMessage({ tone: "ok", text: a.cockpit.structure.saved });
        onRefresh();
      } else {
        setMessage({ tone: "error", text: a.cockpit.error(res.error ?? "") });
      }
    });
  }

  function repairMedia() {
    start(async () => {
      const res = await repairMerchantDataAction(merchant.id);
      if (res.ok) {
        setMessage({ tone: "ok", text: a.cockpit.media.done(res.repaired ?? 0) });
        onRefresh();
      } else {
        setMessage({ tone: "error", text: a.cockpit.error(res.error ?? "") });
      }
    });
  }

  function downloadJson() {
    const href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(merchant, null, 2));
    const link = document.createElement("a");
    link.href = href;
    link.download = `converza-${merchant.slug}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadCsv() {
    const header = ["id", "name", "slug", "plan", "plan_until", "owner", "phone", "products", "orders", "agents", "gmv"];
    const row = [
      merchant.id,
      merchant.name,
      merchant.slug,
      merchant.plan,
      merchant.plan_until ?? "",
      merchant.ownerEmail ?? "",
      merchant.phone_e164 ?? "",
      merchant.products,
      merchant.orders,
      merchant.agents,
      (merchant.gmvCents / 100).toFixed(2),
    ];
    const blob = new Blob(["﻿" + [header.map(csvCell).join(";"), row.map(csvCell).join(";")].join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converza-${merchant.slug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-line bg-white text-ink shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black">{merchant.name}</h2>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase text-brand">{merchant.plan}</span>
            </div>
            <p className="mt-0.5 break-all text-xs text-ink-muted">{a.cockpit.idLine(merchant.id, merchant.slug)}</p>
          </div>
          <button onClick={onClose} aria-label={a.cockpit.close} className="h-9 w-9 shrink-0 cursor-pointer rounded-full bg-[#F3F6F4] font-bold text-ink-soft">
            ✕
          </button>
        </div>

        {message && (
          <p className={`mx-5 mt-4 rounded-2xl px-3 py-2 text-xs font-extrabold ${message.tone === "ok" ? "bg-[#E7F7F1] text-brand" : "bg-[#FCE4E4] text-[#C0392B]"}`}>
            {message.text}
          </p>
        )}

        <div className="shrink-0 px-5 pt-3">
          <a
            href={`/b/${merchant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-full items-center justify-center rounded-xl bg-[#E7F1FB] text-xs font-black text-[#1A6BB8]"
          >
            {a.cockpit.openStorefront}
          </a>
        </div>

        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line px-5 pt-3 text-xs font-extrabold [scrollbar-width:none]">
          {(["structure", "media", "reports", "tables", "raw"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`cursor-pointer border-b-2 px-3 pb-2 ${tab === key ? "border-brand text-brand" : "border-transparent text-ink-muted"}`}
            >
              {a.cockpit.tabs[key]}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "structure" && (
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <Field label={a.cockpit.structure.name}>
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.slug} hint={a.cockpit.structure.slugHint}>
                <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.phone}>
                <input value={form.phone_e164} onChange={(e) => set({ phone_e164: e.target.value })} placeholder="+509…" className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.sector}>
                <Select value={form.business_type} onChange={(e) => set({ business_type: e.target.value })} triggerClassName={inputCls}>
                  {Object.keys(INDUSTRY_SECTORS).map((key) => (
                    <option key={key} value={key}>
                      {sectors[key]?.label ?? key}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={a.cockpit.structure.layout}>
                <Select value={form.layout} onChange={(e) => set({ layout: e.target.value as LayoutKey })} triggerClassName={inputCls}>
                  {STOREFRONT_LAYOUTS.map((l) => (
                    <option key={l.key} value={l.key}>
                      {designName(designCopy, verticalOf(form.business_type).id, STOREFRONT_LAYOUTS.indexOf(l) as 0 | 1 | 2).name} · {look.images(designFor(verticalOf(form.business_type).id, l.key).slots)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={a.cockpit.structure.theme}>
                <Select value={form.theme} onChange={(e) => set({ theme: e.target.value })} triggerClassName={inputCls}>
                  {THEME_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key === SECTOR_THEME ? look.sectorColors : THEMES[key].label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={a.cockpit.structure.currency}>
                <Select value={form.default_currency} onChange={(e) => set({ default_currency: e.target.value })} triggerClassName={inputCls}>
                  <option value="HTG">HTG</option>
                  <option value="USD">USD</option>
                </Select>
              </Field>
              <Field label={a.cockpit.structure.category}>
                <input value={form.category} onChange={(e) => set({ category: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.address}>
                <input value={form.address} onChange={(e) => set({ address: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.hours}>
                <input value={form.hours} onChange={(e) => set({ hours: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.instagram}>
                <input value={form.social_instagram} onChange={(e) => set({ social_instagram: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.facebook}>
                <input value={form.social_facebook} onChange={(e) => set({ social_facebook: e.target.value })} className={inputCls} />
              </Field>
              <Field label={a.cockpit.structure.tiktok}>
                <input value={form.social_tiktok} onChange={(e) => set({ social_tiktok: e.target.value })} className={inputCls} />
              </Field>

              <div className="sm:col-span-2">
                <button
                  onClick={saveStructure}
                  disabled={pending}
                  className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-brand text-xs font-black text-white active:scale-95 disabled:opacity-60"
                >
                  {pending ? c.actions.saving : a.cockpit.structure.save}
                </button>
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-[#F7F8F9] p-4">
                <h3 className="text-sm font-black">{a.cockpit.media.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{a.cockpit.media.desc}</p>
                <button
                  onClick={repairMedia}
                  disabled={pending}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl bg-brand text-xs font-black text-white active:scale-95 disabled:opacity-60"
                >
                  {pending ? a.cockpit.media.running : a.cockpit.media.run}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <Field label={a.cockpit.media.logoUrl}>
                  <input value={form.logo_url} onChange={(e) => set({ logo_url: e.target.value })} placeholder="https://…" className={inputCls} />
                </Field>
                <Field label={a.cockpit.media.coverUrl}>
                  <input value={form.cover_url} onChange={(e) => set({ cover_url: e.target.value })} placeholder="https://…" className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                  <button
                    onClick={saveStructure}
                    disabled={pending}
                    className="h-10 w-full cursor-pointer rounded-xl bg-brand-green/15 text-xs font-black text-brand active:scale-95 disabled:opacity-60"
                  >
                    {pending ? c.actions.saving : a.cockpit.structure.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="rounded-2xl border border-line bg-[#F7F8F9] p-4">
              <h3 className="text-sm font-black">{a.cockpit.reports.title}</h3>
              <p className="mt-1 text-xs text-ink-muted">{a.cockpit.reports.desc}</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button onClick={downloadCsv} className="h-10 flex-1 cursor-pointer rounded-xl bg-brand text-xs font-black text-white active:scale-95">
                  {a.cockpit.reports.csv}
                </button>
                <button onClick={downloadJson} className="h-10 flex-1 cursor-pointer rounded-xl bg-[#EEF2F3] text-xs font-black text-ink-soft active:scale-95">
                  {a.cockpit.reports.json}
                </button>
              </div>
            </div>
          )}

          {tab === "tables" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-[#F7F8F9] p-4">
                <h3 className="text-sm font-black">{a.cockpit.tables.title}</h3>
                <p className="mt-1 text-xs text-ink-muted">{a.cockpit.tables.desc}</p>
              </div>
              <TableQrGenerator business={{ name: merchant.name, slug: merchant.slug } as never} />
            </div>
          )}

          {tab === "raw" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-ink-muted">{a.cockpit.raw}</span>
              <pre className="max-h-80 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400">
                {JSON.stringify(merchant, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-[#F7F8F9] p-4">
          <span className="text-[11px] font-semibold text-ink-muted">{a.cockpit.footer}</span>
          <button onClick={onClose} className="cursor-pointer rounded-xl bg-[#EEF2F3] px-4 py-2 text-xs font-bold text-ink-soft">
            {a.cockpit.close}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Petits éléments -------------------------------- */

const inputCls = "mt-1 h-10 w-full rounded-xl border border-line bg-[#F7F8F9] px-3 text-[13px] outline-none focus:border-brand";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">{children}</div>;
}

function CardTitle({ title, hint, count }: { title: string; hint?: string; count?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-extrabold">{title}</h2>
        {count !== undefined && <span className="rounded-full bg-[#EEF2F3] px-2 py-0.5 text-[11px] font-bold text-ink-faint">{count}</span>}
      </div>
      {hint && <p className="text-[11.5px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] ${accent ? "bg-brand text-white" : "bg-white text-ink"}`}>
      <span className={`text-[12px] font-semibold ${accent ? "text-white/80" : "text-ink-muted"}`}>{label}</span>
      <div className="mt-1 text-[20px] font-extrabold leading-tight tabular-nums">{value}</div>
      {sub && <span className={`text-[11.5px] ${accent ? "text-white/70" : "text-ink-faint"}`}>{sub}</span>}
    </div>
  );
}

function PlanRow({ label, n, total, color }: { label: string; n: number; total: number; color: string }) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="font-bold tabular-nums">{n}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F3]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-[#F7F8F9] py-2">
      <span className="truncate px-1 text-[14px] font-extrabold tabular-nums">{n}</span>
      <span className="text-[10.5px] text-ink-faint">{l}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[10.5px] font-bold uppercase text-ink-faint">{label}</span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-muted">
      <span className="hidden sm:inline">{label}</span>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        triggerClassName="h-11 cursor-pointer rounded-xl border border-line bg-white px-2 text-[13px] font-bold text-ink outline-none"
      >
        {children}
      </Select>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="text-[12px] font-semibold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 text-[10.5px] text-ink-faint">{hint}</span>}
    </label>
  );
}
