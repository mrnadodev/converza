"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { activatePlan, rejectPayment, setPlan, revokePlan, upgradePlan, updatePlanConfig, updatePaymentInfoConfig, updateGlobalSettingsAction, updateMerchantStructureAction, repairMerchantDataAction } from "@/app/admin/actions";
import { signOut } from "@/app/login/actions";
import type { Plan, PlatformPaymentInfo, BankAccountDetails } from "@/lib/plans";
import { type PlatformGlobalSettings, type DesignLayoutConfig, type QrMenuServiceConfig } from "@/lib/platform-config";
import { ThemeToggle, useTheme } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/components/LanguageContext";
import { StorefrontPreviewModal } from "@/components/StorefrontPreviewModal";
import { TableQrGenerator } from "@/components/TableQrGenerator";

interface Payment {
  id: string; plan: string; amount_cents: number; pay_method: string; pay_ref: string | null;
  status: string; created_at: string; business_id: string; isDuplicateRef?: boolean;
  businesses?: { name: string; slug: string } | null;
}
interface Merchant {
  id: string; name: string; slug: string; business_type: string | null; plan: string;
  plan_until: string | null; created_at: string; products: number; orders: number; agents: number; gmvCents: number;
  phone_e164?: string | null; category?: string | null; address?: string | null; logo_url?: string | null;
  cover_url?: string | null; hours?: string | null; theme?: string | null; layout?: string | null;
  default_currency?: string | null; social_instagram?: string | null; social_facebook?: string | null; social_tiktok?: string | null;
}
interface Data {
  kpis: { mrrCents: number; merchants: number; newThisMonth: number; gmvCents: number; conversionPct: number; paidCount: number; securityAlertsCount?: number };
  planCounts: Record<string, number>;
  signups: number[];
  pendingPayments: Payment[];
  duplicateRefAlerts?: Payment[];
  expired: { id: string; name: string; plan: string }[];
  merchants: Merchant[];
  auditLogs?: any[];
  platformPlans?: Plan[];
  platformPaymentInfo?: PlatformPaymentInfo;
  platformSettings?: PlatformGlobalSettings;
}

export function AdminPanel({ data }: { data: Data }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "qr_menu" | "governance" | "audit">("overview");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [diagnosticMerchant, setDiagnosticMerchant] = useState<Merchant | null>(null);
  const [qrGeneratorMerchant, setQrGeneratorMerchant] = useState<Merchant | null>(null);

  const run = (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    start(async () => { await fn(); setBusy(null); router.refresh(); });
  };

  const maxSignup = Math.max(...data.signups, 1);
  const shown = data.merchants.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.slug.includes(q.toLowerCase()));

  return (
    <div className={`app-page min-h-[100dvh] pb-16 transition-colors duration-300 ${isDark ? "bg-[#0A1210] text-white" : "bg-[#F7F8F9] text-ink"}`}>
      <header className="flex items-center justify-between bg-[#0E1B17] px-4 pb-4 pt-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[19px] font-extrabold text-white">Admin CONVERZA</span>
            <span className="rounded-full bg-[#16B67C]/20 px-2 py-0.5 text-[10.5px] font-bold text-[#16B67C] ring-1 ring-[#16B67C]/40">🛡️ RLS Protégé</span>
          </div>
          <p className="text-[12px] text-white/60">Super-admin · monitè ak sekirite plataform lan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
          >
            <span>👁️ Aperçu Vitrine (3 Designs)</span>
          </button>
          <LanguageToggle />
          <ThemeToggle />
          <form action={signOut}>
            <button type="submit" className="rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white active:scale-95">Dekonekte</button>
          </form>
        </div>
      </header>

      <StorefrontPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        isAdmin={true}
        businessName="CONVERZA Business"
      />

      {diagnosticMerchant && (
        <MerchantDiagnosticModal
          merchant={diagnosticMerchant}
          onClose={() => setDiagnosticMerchant(null)}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* Modal Générateur de Chevalets QR Code Tables */}
      {qrGeneratorMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-line text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div>
                <h3 className="text-lg font-black text-slate-900">🖨️ Générateur de Chevalets QR Code Tables</h3>
                <p className="text-xs text-slate-500 font-medium">Générez et imprimez les chevalets QR Code pour <b>{qrGeneratorMerchant.name}</b> (/{qrGeneratorMerchant.slug})</p>
              </div>
              <button
                onClick={() => setQrGeneratorMerchant(null)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <TableQrGenerator business={{ name: qrGeneratorMerchant.name, slug: qrGeneratorMerchant.slug } as any} />
          </div>
        </div>
      )}

      {/* Navigation par Onglets (Tabs) */}
      <div className={`flex border-b px-4 pt-3 gap-1 overflow-x-auto text-[13.5px] font-bold transition-colors ${isDark ? "border-gray-800 bg-[#0F1D19]" : "border-line bg-white"}`}>
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === "overview" ? "border-brand text-brand font-extrabold" : "border-transparent text-ink-faint hover:text-ink"}`}
        >
          📊 Aperçu & Marchands
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === "plans" ? "border-brand text-brand font-extrabold" : "border-transparent text-ink-faint hover:text-ink"}`}
        >
          💳 Plans & Pèman
          {data.pendingPayments.length > 0 && (
            <span className="rounded-full bg-rose-600 text-white text-[10.5px] px-1.5 py-0.2 animate-pulse font-black">
              {data.pendingPayments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("qr_menu")}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === "qr_menu" ? "border-amber-500 text-amber-500 font-black" : "border-transparent text-ink-faint hover:text-ink"}`}
        >
          📱 Menu QR Express (500 HTG)
          <span className="rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 text-[10.5px] px-1.5 py-0.2 font-black">
            {data.merchants.filter((m) => m.plan === "qr_express" || (m.business_type ?? "").toLowerCase().includes("resto") || (m.business_type ?? "").toLowerCase().includes("restaur")).length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("governance")}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === "governance" ? "border-brand text-brand font-extrabold" : "border-transparent text-ink-faint hover:text-ink"}`}
        >
          🎛️ Governance & Pilote
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === "audit" ? "border-brand text-brand font-extrabold" : "border-transparent text-ink-faint hover:text-ink"}`}
        >
          📜 Sekirite & Audit
        </button>
      </div>

      {/* Alertes Globales */}
      {(data.expired.length > 0 || data.pendingPayments.length > 0 || (data.duplicateRefAlerts && data.duplicateRefAlerts.length > 0)) && (
        <section className="px-4 pt-4">
          <div className="rounded-2xl bg-owed-bg p-3.5 border border-amber-200">
            <span className="text-[13px] font-bold text-owed-text flex items-center gap-1.5">
              ⚠️ Alèt monitè ak sekirite
            </span>
            <div className="mt-1.5 flex flex-col gap-1 text-[13px] text-[#8A5A1E]">
              {data.duplicateRefAlerts && data.duplicateRefAlerts.length > 0 && (
                <div className="font-semibold text-rose-700">
                  🚨 {data.duplicateRefAlerts.length} alèt anti-fraude: Yon referans MonCash/Zelle te itilize plizyè fwa!
                </div>
              )}
              {data.pendingPayments.length > 0 && <div>• {data.pendingPayments.length} peman k ap tann konfimasyon</div>}
              {data.expired.length > 0 && <div>• {data.expired.length} plan ki ekspire: {data.expired.slice(0, 3).map((e) => e.name).join(", ")}{data.expired.length > 3 ? "…" : ""}</div>}
            </div>
          </div>
        </section>
      )}

      {/* ONGLET 1: APERÇU & MARCHANDS */}
      {activeTab === "overview" && (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-2 gap-3 px-4 pt-4 md:grid-cols-4 md:px-6">
            <Kpi label="MRR (chak mwa)" value={formatMoney(data.kpis.mrrCents)} accent />
            <Kpi label="GMV total" value={formatMoney(data.kpis.gmvCents)} />
            <Kpi label="Marchan" value={`${data.kpis.merchants}`} sub={`+${data.kpis.newThisMonth} mwa sa`} />
            <Kpi label="Konvèsyon → peye" value={`${(data as any).conversionPct ?? data.kpis.conversionPct}%`} sub={`${data.kpis.paidCount} peye`} />
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
                <PlanRow label="Menu QR Express" n={data.planCounts.qr_express ?? 0} total={data.kpis.merchants} color="#F59E0B" />
                <PlanRow label="Pro" n={data.planCounts.pro} total={data.kpis.merchants} color="#16B67C" />
                <PlanRow label="Premium" n={data.planCounts.premium} total={data.kpis.merchants} color="#0A7D55" />
              </div>
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
                <div key={m.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border border-line">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="block truncate text-[15.5px] font-extrabold">{m.name}</span>
                        {m.plan !== "gratis" && (
                          <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10.5px] font-black text-brand uppercase">
                            {m.plan}
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-ink-faint">/{m.slug} · {m.business_type ?? "—"}</span>
                      {m.plan_until && (
                        <span className="block text-[11px] text-brand font-semibold mt-0.5">
                          Aktif jiska: {new Date(m.plan_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <select
                      value={m.plan}
                      onChange={(e) => run("plan-" + m.id, () => setPlan(m.id, e.target.value))}
                      disabled={pending && busy === "plan-" + m.id}
                      className="rounded-lg border border-line bg-[#F7F8F9] px-2 py-1.5 text-[12.5px] font-semibold outline-none"
                    >
                      <option value="gratis">Gratis</option>
                      <option value="qr_express">Menu QR Express</option>
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

                  {/* Boutons d'Action Rapides : Diagnostic Cockpit, Upgrade & Revoke */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                    <button
                      onClick={() => setDiagnosticMerchant(m)}
                      className="h-8 flex-1 rounded-lg bg-blue-600/10 px-3 text-[12px] font-extrabold text-blue-700 hover:bg-blue-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      🛠️ Dépanner & Structure
                    </button>

                    {m.plan !== "premium" && (
                      <button
                        onClick={() => run("upgrade-" + m.id, () => upgradePlan(m.id, m.plan === "gratis" ? "pro" : "premium", 1))}
                        disabled={pending && busy === "upgrade-" + m.id}
                        className="h-8 rounded-lg bg-emerald-600/10 px-3 text-[12px] font-extrabold text-emerald-700 hover:bg-emerald-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        ⚡ Upgrade ({m.plan === "gratis" ? "Pro" : "Premium"})
                      </button>
                    )}

                    {m.plan !== "gratis" && (
                      <button
                        onClick={() => run("revoke-" + m.id, () => revokePlan(m.id))}
                        disabled={pending && busy === "revoke-" + m.id}
                        className="h-8 rounded-lg bg-rose-100 px-3 text-[12px] font-bold text-rose-700 hover:bg-rose-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        🚫 Revoke Plan
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {shown.length === 0 && <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">Anyen jwenn.</p>}
            </div>
          </section>
        </>
      )}

      {/* ONGLET 2: PLANS & PAIEMENTS */}
      {activeTab === "plans" && (
        <>
          {/* Paiements en attente */}
          <section className="px-4 pt-5">
            <h2 className="mb-2 text-[15px] font-extrabold flex items-center gap-2">
              💳 Peman ki ap tann konfimasyon
              <span className="rounded-full bg-[#E7EBED] px-2 py-0.5 text-[11px] font-bold text-ink-faint">{data.pendingPayments.length}</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              {data.pendingPayments.map((p) => (
                <div key={p.id} className={`rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border ${p.isDuplicateRef ? "border-rose-400 bg-rose-50/20" : "border-transparent"}`}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold">{p.businesses?.name ?? "Biznis"}</span>
                      {p.isDuplicateRef && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
                          🚨 Réf Répétée (Risque de Fraude)
                        </span>
                      )}
                    </div>
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

          {/* Configuration des Méthodes de Paiement de la Plateforme CONVERZA */}
          <section className="px-4 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold flex items-center gap-1.5">
                💳 Nimewo & Metòd Peman Plataform lan (MonCash / Natcash / Bank)
              </h2>
              <span className="text-[11.5px] text-brand font-bold">Kolekt Abònman</span>
            </div>
            <PlatformPaymentInfoCard payInfo={data.platformPaymentInfo} run={run} pending={pending} />
          </section>

          {/* Configuration & Modification des Plans d'Abonnement (Gratis / Pro / Premium) */}
          <section className="px-4 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold flex items-center gap-1.5">
                🏷️ Konfigirasyon ak Modifikasyon Tarifs Plan yo
              </h2>
              <span className="text-[11.5px] text-ink-faint font-semibold">Tarification & Fonksyon</span>
            </div>
            <div className="flex flex-col gap-3">
              {(data.platformPlans ?? []).map((p) => (
                <PlatformPlanEditorCard key={p.key} plan={p} run={run} pending={pending} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ONGLET 3: RESTO MENU QR EXPRESS MONITORING */}
      {activeTab === "qr_menu" && (
        <RestoQrMenuMonitoringSection
          data={data}
          run={run}
          pending={pending}
          busy={busy}
          onOpenQrGenerator={(m) => setQrGeneratorMerchant(m)}
        />
      )}

      {/* ONGLET 4: GOVERNANCE & PILOTAGE DU PROJET */}
      {activeTab === "governance" && (
        <PlatformGovernanceSection settings={data.platformSettings} run={run} pending={pending} />
      )}

      {/* ONGLET 4: SÉCURITÉ & AUDIT */}
      {activeTab === "audit" && (
        <>
          {/* Moniteur de Sécurité & IDS/SIEM */}
          <section className="px-4 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold flex items-center gap-1.5">
                🛡️ Monitè Sekirite ak Entrizyon (IDS/SIEM)
              </h2>
              <span className="rounded-full bg-[#16B67C]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#16B67C]">
                ● Sistèm Pwoteje
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border border-emerald-100">
                <span className="text-[11.5px] font-semibold text-ink-muted">Isolation Multi-Tenant</span>
                <div className="mt-1 text-[15px] font-black text-emerald-700">100% RLS Valide</div>
                <span className="text-[10.5px] text-ink-faint">Données marchands étanches</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border border-emerald-100">
                <span className="text-[11.5px] font-semibold text-ink-muted">Détection Anti-Bruteforce</span>
                <div className="mt-1 text-[15px] font-black text-emerald-700">Rate-Limit Actif</div>
                <span className="text-[10.5px] text-ink-faint">Protection /login & API</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border border-emerald-100">
                <span className="text-[11.5px] font-semibold text-ink-muted">Contrôle Références MonCash</span>
                <div className="mt-1 text-[15px] font-black text-emerald-700">Anti-Fraude Actif</div>
                <span className="text-[10.5px] text-ink-faint">Vérification doublons pay_ref</span>
              </div>
            </div>
          </section>

          {/* Journal d'Audit Admin (security_audit_logs) */}
          <section className="px-4 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold flex items-center gap-1.5">
                📜 Journal d'Audit Admin (`security_audit_logs`)
              </h2>
              <span className="text-[11.5px] text-ink-faint font-semibold">Traçabilité immuable</span>
            </div>

            <div className="flex flex-col gap-2">
              {(data as any).auditLogs && (data as any).auditLogs.length > 0 ? (
                (data as any).auditLogs.map((log: any) => (
                  <div key={log.id} className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] flex items-center justify-between gap-3 text-[12.5px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-brand-green/10 px-2 py-0.5 font-bold text-brand text-[11px]">
                          {log.action}
                        </span>
                        <span className="font-semibold text-ink truncate">{log.admin_email}</span>
                      </div>
                      {log.details && (
                        <span className="mt-0.5 block text-[11.5px] text-ink-faint truncate">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-ink-faint">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-ink-faint">
                  Aucune action enregistrée dans le journal d'audit.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`rounded-2xl p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] transition-colors ${accent ? "bg-brand text-white" : isDark ? "bg-[#13231F] text-white border border-gray-800" : "bg-white text-ink"}`}>
      <span className={`text-[12px] font-semibold ${accent ? "text-white/80" : isDark ? "text-gray-300" : "text-ink-muted"}`}>{label}</span>
      <div className="mt-1 text-[22px] font-extrabold leading-tight">{value}</div>
      {sub && <span className={`text-[11.5px] ${accent ? "text-white/70" : isDark ? "text-gray-400" : "text-ink-faint"}`}>{sub}</span>}
    </div>
  );
}

function PlanRow({ label, n, total, color }: { label: string; n: number; total: number; color: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className={`font-medium ${isDark ? "text-gray-300" : "text-ink-soft"}`}>{label}</span>
        <span className="font-bold">{n}</span>
      </div>
      <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-gray-800" : "bg-[#EEF2F3]"}`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ n, l }: { n: number | string; l: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`flex flex-col rounded-lg py-2 ${isDark ? "bg-gray-800/60 text-white" : "bg-[#F7F8F9] text-ink"}`}>
      <span className="text-[15px] font-extrabold">{n}</span>
      <span className={`text-[10.5px] ${isDark ? "text-gray-400" : "text-ink-faint"}`}>{l}</span>
    </div>
  );
}

function PlatformPaymentInfoCard({
  payInfo,
  run,
  pending,
}: {
  payInfo?: PlatformPaymentInfo;
  run: (id: string, fn: () => Promise<unknown>) => void;
  pending: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [moncash, setMoncash] = useState(payInfo?.moncash ?? "");
  const [natcash, setNatcash] = useState(payInfo?.natcash ?? "");
  const [bank, setBank] = useState(payInfo?.bank ?? "");
  const [zelle, setZelle] = useState(payInfo?.zelle ?? "");
  const [usdt, setUsdt] = useState(payInfo?.usdt ?? "");
  const [moncashQr, setMoncashQr] = useState(payInfo?.moncash_qr_url ?? "");
  const [natcashQr, setNatcashQr] = useState(payInfo?.natcash_qr_url ?? "");

  const [bankDetails, setBankDetails] = useState<BankAccountDetails[]>(
    payInfo?.bank_details ?? [
      { bank_name: "Sogebank", account_number: "402-998-1120", currency: "HTG", account_holder: "CONVERZA S.A." },
      { bank_name: "Unibank", account_number: "220-410-0981", currency: "USD", account_holder: "CONVERZA S.A." },
    ]
  );

  function handleFileUpload(file: File | undefined, setter: (val: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(String(e.target.result));
    };
    reader.readAsDataURL(file);
  }

  function addBankRow() {
    setBankDetails([...bankDetails, { bank_name: "Sogebank", account_number: "", currency: "HTG", account_holder: "CONVERZA S.A." }]);
  }

  function updateBankRow(idx: number, field: keyof BankAccountDetails, val: string) {
    const updated = [...bankDetails];
    updated[idx] = { ...updated[idx], [field]: val };
    setBankDetails(updated);
  }

  function removeBankRow(idx: number) {
    setBankDetails(bankDetails.filter((_, i) => i !== idx));
  }

  const inputClass = `mt-1 h-10 w-full rounded-xl border px-3 outline-none focus:border-brand transition-colors text-[13px] ${
    isDark ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500" : "border-line bg-[#F7F8F9] text-ink"
  }`;

  return (
    <div className={`rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border transition-colors ${isDark ? "bg-[#13231F] border-gray-800 text-white" : "bg-white border-line text-ink"}`}>
      <div className="flex items-center justify-between mb-4 border-b border-line/60 pb-3">
        <div>
          <span className="text-[15px] font-extrabold block">💳 Kolekt Abònman Plataform lan</span>
          <p className={`text-[12px] ${isDark ? "text-gray-300" : "text-ink-muted"}`}>
            Nimewo, kont labank ak QR Codes sa yo afiche sou paj <b>/abonman</b>.
          </p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-black text-brand uppercase">Fintech Gateway</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* MonCash & Natcash Phone & QR Code Direct Upload */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* MonCash */}
          <div className={`rounded-2xl p-4 border ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-[#F9FBFB] border-line"}`}>
            <span className="font-extrabold text-[14px] text-brand block mb-2">🔴 MonCash</span>
            <label className="font-semibold text-[12px] text-ink-muted">Nimewo Telefòn MonCash</label>
            <input value={moncash} onChange={(e) => setMoncash(e.target.value)} placeholder="+509 3712 4488" className={inputClass} />

            <div className="mt-3">
              <label className="font-semibold text-[12px] text-ink-muted block mb-1"> Upload Imaj QR Code MonCash</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0], setMoncashQr)}
                className="block w-full text-xs text-ink-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-green/10 file:text-brand hover:file:bg-brand-green/20"
              />
              {moncashQr ? (
                <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-white/90 p-2.5 border border-emerald-200">
                  <img src={moncashQr} alt="QR MonCash" className="h-20 w-20 object-contain rounded-lg border border-line bg-white" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-emerald-700 block">✓ QR Code MonCash Prè</span>
                    <button onClick={() => setMoncashQr("")} className="mt-1 text-[11px] font-bold text-rose-600 hover:underline">Retire imaj la</button>
                  </div>
                </div>
              ) : (
                <span className="mt-1.5 block text-[11px] text-ink-faint">Pa gen imaj QR téléversé.</span>
              )}
            </div>
          </div>

          {/* Natcash */}
          <div className={`rounded-2xl p-4 border ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-[#F9FBFB] border-line"}`}>
            <span className="font-extrabold text-[14px] text-emerald-600 block mb-2">🟢 Natcash</span>
            <label className="font-semibold text-[12px] text-ink-muted">Nimewo Telefòn Natcash</label>
            <input value={natcash} onChange={(e) => setNatcash(e.target.value)} placeholder="+509 4123 9988" className={inputClass} />

            <div className="mt-3">
              <label className="font-semibold text-[12px] text-ink-muted block mb-1"> Upload Imaj QR Code Natcash</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0], setNatcashQr)}
                className="block w-full text-xs text-ink-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-green/10 file:text-brand hover:file:bg-brand-green/20"
              />
              {natcashQr ? (
                <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-white/90 p-2.5 border border-emerald-200">
                  <img src={natcashQr} alt="QR Natcash" className="h-20 w-20 object-contain rounded-lg border border-line bg-white" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-emerald-700 block">✓ QR Code Natcash Prè</span>
                    <button onClick={() => setNatcashQr("")} className="mt-1 text-[11px] font-bold text-rose-600 hover:underline">Retire imaj la</button>
                  </div>
                </div>
              ) : (
                <span className="mt-1.5 block text-[11px] text-ink-faint">Pa gen imaj QR téléversé.</span>
              )}
            </div>
          </div>
        </div>

        {/* Structured Bank Accounts Section */}
        <div className={`rounded-2xl p-4 border ${isDark ? "bg-gray-800/40 border-gray-700" : "bg-[#F9FBFB] border-line"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-extrabold text-[14px] block">🏦 Kont Labank yo (Champs Séparés)</span>
            <button
              onClick={addBankRow}
              className="h-8 rounded-xl bg-brand/10 px-3 text-[12px] font-extrabold text-brand hover:bg-brand/20 active:scale-95 transition-all"
            >
              + Ajoute yon Kont Labank
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {bankDetails.map((b, idx) => (
              <div key={idx} className={`rounded-xl p-3 border grid grid-cols-1 gap-2.5 sm:grid-cols-4 items-center ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-line"}`}>
                <div>
                  <label className="text-[11px] font-bold text-ink-muted block">Nom Labank</label>
                  <input
                    value={b.bank_name}
                    onChange={(e) => updateBankRow(idx, "bank_name", e.target.value)}
                    placeholder="Sogebank / Unibank"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-ink-muted block">Numewo Kont</label>
                  <input
                    value={b.account_number}
                    onChange={(e) => updateBankRow(idx, "account_number", e.target.value)}
                    placeholder="402-998-1120"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-ink-muted block">Deviz</label>
                  <select
                    value={b.currency}
                    onChange={(e) => updateBankRow(idx, "currency", e.target.value as "HTG" | "USD")}
                    className={inputClass}
                  >
                    <option value="HTG">HTG (Goud)</option>
                    <option value="USD">USD (Dola)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-ink-muted block">Titulaire / Nom Kont</label>
                    <input
                      value={b.account_holder}
                      onChange={(e) => updateBankRow(idx, "account_holder", e.target.value)}
                      placeholder="CONVERZA S.A."
                      className={inputClass}
                    />
                  </div>
                  {bankDetails.length > 1 && (
                    <button
                      onClick={() => removeBankRow(idx)}
                      className="mt-5 text-rose-600 hover:bg-rose-100 p-2 rounded-lg text-xs font-bold"
                      title="Retire kont sa a"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zelle & USDT */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={`font-semibold text-[12px] ${isDark ? "text-gray-200" : "text-ink-soft"}`}>Zelle / Email</label>
            <input value={zelle} onChange={(e) => setZelle(e.target.value)} placeholder="payments@converza.ht" className={inputClass} />
          </div>
          <div>
            <label className={`font-semibold text-[12px] ${isDark ? "text-gray-200" : "text-ink-soft"}`}>Adrès Crypto USDT (TRC20)</label>
            <input value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="TR7NHqjeKQxGTCi..." className={inputClass} />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          const bankSummary = bankDetails.map((b) => `${b.bank_name} ${b.currency} #${b.account_number} (${b.account_holder})`).join(" / ");
          run("save-payment-info", () => updatePaymentInfoConfig(moncash, natcash, bankSummary, zelle, usdt, moncashQr, natcashQr, bankDetails));
        }}
        disabled={pending}
        className="mt-5 h-12 w-full rounded-2xl bg-brand text-base font-extrabold text-white shadow-[0_6px_20px_rgba(0,128,105,0.3)] active:scale-[0.99] disabled:opacity-60 transition-all"
      >
        💾 Enregistre Modifikasyon Peman yo
      </button>
    </div>
  );
}

function PlatformPlanEditorCard({
  plan,
  run,
  pending,
}: {
  plan: Plan;
  run: (id: string, fn: () => Promise<unknown>) => void;
  pending: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [price, setPrice] = useState(plan.priceGdes);
  const [tagline, setTagline] = useState(plan.tagline);
  const [features, setFeatures] = useState((plan.features ?? []).join(", "));

  const inputClass = `mt-1 h-10 w-full rounded-xl border px-3 outline-none focus:border-brand transition-colors ${
    isDark ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500" : "border-line bg-[#F7F8F9] text-ink"
  }`;

  return (
    <div className={`rounded-2xl p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border transition-colors ${isDark ? "bg-[#13231F] border-gray-800 text-white" : "bg-white border-line text-ink"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-extrabold">{plan.name}</span>
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${isDark ? "bg-gray-800 text-gray-300" : "bg-[#F7F8F9] text-ink-faint"}`}>
            Key: {plan.key}
          </span>
        </div>
        <span className="text-[14px] font-black text-brand">
          {price === 0 ? "Gratis" : `${price} HTG / mwa`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[13px]">
        <div>
          <label className={`font-semibold ${isDark ? "text-gray-200" : "text-ink-soft"}`}>Pri an Goud (HTG)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={inputClass + " font-bold"}
          />
        </div>
        <div>
          <label className={`font-semibold ${isDark ? "text-gray-200" : "text-ink-soft"}`}>Slogan / Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={`font-semibold ${isDark ? "text-gray-200" : "text-ink-soft"}`}>Fonksyon ak Avantaou yo (séparés par virgule)</label>
          <input value={features} onChange={(e) => setFeatures(e.target.value)} className={inputClass} />
        </div>
      </div>

      <button
        onClick={() => run("save-plan-" + plan.key, () => updatePlanConfig(plan.key, price, tagline, features))}
        disabled={pending}
        className="mt-3 h-9 w-full rounded-xl bg-brand-green/15 text-[13px] font-extrabold text-brand active:scale-[0.99] disabled:opacity-60"
      >
        ✏️ Mete ajou Plan {plan.name}
      </button>
    </div>
  );
}

function PlatformGovernanceSection({
  settings,
  run,
  pending,
}: {
  settings?: PlatformGlobalSettings;
  run: (id: string, fn: () => Promise<unknown>) => void;
  pending: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State local initialisé avec settings ou defaults
  const [designs, setDesigns] = useState<DesignLayoutConfig[]>(
    settings?.designs ?? [
      { key: "design1", name: "Design 1: Héros & Grille Standard", tag: "Standard", minPlanRequired: "gratis" as const, enabled: true },
      { key: "design2", name: "Design 2: Wireframe Spécifique Secteur", tag: "Avancé", minPlanRequired: "pro" as const, enabled: true },
      { key: "design3", name: "Design 3: Carousel Showcase Deluxe VIP", tag: "Deluxe VIP", minPlanRequired: "premium" as const, enabled: true },
    ]
  );

  const [imageRatios, setImageRatios] = useState(
    settings?.imageRatios ?? [
      { key: "1:1" as const, label: "Carré (1:1)", enabled: true },
      { key: "3:4" as const, label: "Portrait (3:4)", enabled: true },
      { key: "16:9" as const, label: "Bannière (16:9)", enabled: true },
      { key: "stretch" as const, label: "Étiré Full-Width (100% 100%)", enabled: true },
    ]
  );

  const [maxImageMb, setMaxImageMb] = useState(settings?.maxImageSizeMb ?? 5);
  const [compressionQuality, setCompressionQuality] = useState(settings?.imageCompressionQuality ?? 85);

  const [languages, setLanguages] = useState(
    settings?.languages ?? [
      { code: "ht" as const, name: "Kreyòl Ayisyen", flag: "🇭🇹", enabled: true, isDefault: true },
      { code: "fr" as const, name: "Français", flag: "🇫🇷", enabled: true },
      { code: "en" as const, name: "English", flag: "🇺🇸", enabled: true },
      { code: "es" as const, name: "Español", flag: "🇩🇴", enabled: false },
    ]
  );

  const [payMethods, setPayMethods] = useState(
    settings?.paymentMethods ?? {
      moncashEnabled: true,
      natcashEnabled: true,
      bankEnabled: true,
      zelleEnabled: true,
      usdtEnabled: true,
      cashOnDeliveryEnabled: true,
    }
  );

  const [featureFlags, setFeatureFlags] = useState(
    settings?.featureFlags ?? {
      aiAssistantEnabled: true,
      antiFraudDetectorEnabled: true,
      whatsappAutoRemindersEnabled: true,
      excelExportEnabled: true,
      maintenanceMode: false,
    }
  );

  const [qrMenuService, setQrMenuService] = useState<QrMenuServiceConfig>(
    settings?.qrMenuService ?? {
      enabled: true,
      standalonePriceGdes: 500,
      tableLimits: { gratis: 5, pro: 25, premium: 50 },
      allowKitchenNotes: true,
      autoOpenWhatsapp: true,
    }
  );

  function saveAll() {
    run("save-platform-settings", () =>
      updateGlobalSettingsAction({
        designs,
        imageRatios,
        maxImageSizeMb: maxImageMb,
        imageCompressionQuality: compressionQuality,
        languages,
        qrMenuService,
        paymentMethods: payMethods,
        featureFlags,
      })
    );
  }

  const cardClass = `rounded-2xl p-5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] border transition-colors ${
    isDark ? "bg-[#13231F] border-gray-800 text-white" : "bg-white border-line text-ink"
  }`;

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      {/* En-tête Tour de Contrôle */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-brand text-white font-black text-2xl shadow-md">
              🎛️
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Centre de Pilotage & Gouvernance CONVERZA</h2>
              <p className="text-xs text-emerald-200">Gérez les modèles de designs, tailles d'images, langues, paiements et fonctionnalités de la plateforme.</p>
            </div>
          </div>
          <button
            onClick={saveAll}
            disabled={pending}
            className="rounded-xl bg-brand-green px-4 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            💾 Enregistrer Tout
          </button>
        </div>
      </div>

      {/* 1. Modèles de Designs & Styles de Catalogues */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            🎨 Modèles de Designs & Layouts Vitrines Disponibles
          </h3>
          <span className="text-xs font-bold text-brand">3 Designs Proposés</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {designs.map((d, idx) => (
            <div key={d.key} className={`rounded-xl p-3.5 border flex flex-col justify-between gap-3 ${d.enabled ? (isDark ? "bg-gray-800/80 border-emerald-500/50" : "bg-emerald-50/50 border-emerald-300") : (isDark ? "bg-gray-900 border-gray-800 opacity-60" : "bg-gray-100 border-gray-300 opacity-60")}`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase text-brand">{d.tag}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${d.minPlanRequired === "premium" ? "bg-purple-100 text-purple-800" : d.minPlanRequired === "pro" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    Min: {d.minPlanRequired}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold line-clamp-1">{d.name}</h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = [...designs];
                  updated[idx].enabled = !updated[idx].enabled;
                  setDesigns(updated);
                }}
                className={`w-full py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  d.enabled ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                {d.enabled ? "✓ Actif sur la plateforme" : "✕ Désactivé"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Tailles d'Images & Ratios d'Affichage */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            🖼️ Tailles d'Images, Ratios & Compression
          </h3>
          <span className="text-xs font-bold text-emerald-600">Optimization Média</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-ink-muted block mb-2">Ratios d'Images Autorisés sur les Vitrines :</label>
            <div className="grid grid-cols-2 gap-2">
              {imageRatios.map((r, idx) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    const updated = [...imageRatios];
                    updated[idx].enabled = !updated[idx].enabled;
                    setImageRatios(updated);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    r.enabled ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 font-black" : "border-line bg-gray-100 text-gray-500"
                  }`}
                >
                  <span>{r.label}</span>
                  <span>{r.enabled ? "✓" : "✕"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-ink-muted block mb-1">Taille Maximale Téléversée (MB) :</label>
              <input
                type="number"
                value={maxImageMb}
                onChange={(e) => setMaxImageMb(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-line px-3 text-xs font-black outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-muted block mb-1">Qualité de Compression WebP ({compressionQuality}%) :</label>
              <input
                type="range"
                min="50"
                max="100"
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Langues de la Plateforme */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            🌐 Langues Prises en Charge sur CONVERZA
          </h3>
          <span className="text-xs font-bold text-brand">Multilingue (4 Langues)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {languages.map((l, idx) => (
            <div key={l.code} className={`rounded-xl p-3 border flex flex-col justify-between gap-2.5 ${l.enabled ? "bg-white border-emerald-300 shadow-2xs text-ink" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xl">{l.flag}</span>
                {l.isDefault && <span className="text-[9.5px] font-black bg-emerald-700 text-white px-1.5 py-0.5 rounded">Par Défaut</span>}
              </div>
              <span className="text-xs font-black">{l.name}</span>
              <button
                type="button"
                onClick={() => {
                  const updated = [...languages];
                  updated[idx].enabled = !updated[idx].enabled;
                  setLanguages(updated);
                }}
                className={`w-full py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  l.enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                }`}
              >
                {l.enabled ? "✓ Disponible" : "✕ Désactivé"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Passerelles de Paiement & Options Globales */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            💳 Méthodes de Paiement Autorisées sur les Vitrines
          </h3>
          <span className="text-xs font-bold text-emerald-600">Gateways</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: "moncashEnabled", label: "📱 MonCash Digicel", value: payMethods.moncashEnabled },
            { key: "natcashEnabled", label: "🟢 Natcash Natcom", value: payMethods.natcashEnabled },
            { key: "bankEnabled", label: "🏦 Transfert Labank", value: payMethods.bankEnabled },
            { key: "zelleEnabled", label: "💵 Zelle USA", value: payMethods.zelleEnabled },
            { key: "usdtEnabled", label: "🪙 USDT TRC-20", value: payMethods.usdtEnabled },
            { key: "cashOnDeliveryEnabled", label: "🚚 Peye nan Livrezon", value: payMethods.cashOnDeliveryEnabled },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setPayMethods((prev) => ({ ...prev, [m.key]: !prev[m.key as keyof typeof payMethods] }))}
              className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                m.value ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-black" : "border-line bg-gray-100 text-gray-500"
              }`}
            >
              <span>{m.label}</span>
              <span>{m.value ? "✓ Active" : "✕ Off"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Interrupteurs de Fonctionnalités (Feature Flags) */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            ⚡ Interrupteurs de Fonctionnalités Globaux (Feature Flags)
          </h3>
          <span className="text-xs font-bold text-rose-600">Pilote du Projet</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { key: "aiAssistantEnabled", label: "🤖 Assistant IA & Inventaire Automatique", desc: "Activer les suggestions IA sur les vitrines et tableaux de bord" },
            { key: "antiFraudDetectorEnabled", label: "🛡️ Détecteur Anti-Fraude de Référence", desc: "Détecter automatiquement les reçus et références répétées" },
            { key: "whatsappAutoRemindersEnabled", label: "📲 Relances Automatiques WhatsApp", desc: "Autoriser l'envoi de relances automatisées 1-clic" },
            { key: "excelExportEnabled", label: "📥 Exportation Données Excel/PDF", desc: "Permettre l'exportation des fichiers de rapportage" },
            { key: "maintenanceMode", label: "🚧 Mode Maintenance Plateforme", desc: "Bloquer les accès vitrines sauf pour les administrateurs" },
          ].map((f) => {
            const isVal = featureFlags[f.key as keyof typeof featureFlags];
            return (
              <div key={f.key} className={`rounded-xl p-3 border flex items-center justify-between gap-3 ${isVal ? "bg-white border-emerald-300" : "bg-gray-100 border-gray-300"}`}>
                <div className="flex flex-col">
                  <span className="font-extrabold text-ink">{f.label}</span>
                  <span className="text-[10.5px] text-ink-faint">{f.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatureFlags((prev) => ({ ...prev, [f.key]: !prev[f.key as keyof typeof featureFlags] }))}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 cursor-pointer ${
                    isVal ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {isVal ? "ON" : "OFF"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Service Standalone "CONVERZA Menu QR Express" & Gestion Tables */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            🍽️ Service Standalone "CONVERZA Menu QR Express" & Limitation Tables
          </h3>
          <span className="text-xs font-bold text-emerald-600">Service Resto & Tables</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <div className={`flex items-center justify-between p-3 rounded-xl border ${qrMenuService.enabled ? (isDark ? "bg-[#0E1B17] border-emerald-500/40" : "bg-emerald-50/70 border-emerald-200") : (isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200")}`}>
              <div>
                <span className="font-extrabold text-xs text-ink block">Statut du Service Menu QR Standalone</span>
                <span className="text-[10.5px] text-ink-faint">Offre ciblée pour restaurants & bars</span>
              </div>
              <button
                type="button"
                onClick={() => setQrMenuService(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer ${
                  qrMenuService.enabled ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                {qrMenuService.enabled ? "ACTIF" : "OFF"}
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted block mb-1">Tarif Mensuel Service Standalone (HTG) :</label>
              <input
                type="number"
                value={qrMenuService.standalonePriceGdes}
                onChange={(e) => setQrMenuService(prev => ({ ...prev, standalonePriceGdes: Number(e.target.value) }))}
                className={`h-10 w-full rounded-xl border px-3 text-xs font-black outline-none focus:border-brand ${
                  isDark ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-[#F7F8F9] text-ink"
                }`}
              />
              <span className="text-[10.5px] text-ink-faint mt-1 block">Facturé séparément pour les restaurants n'utilisant que le menu sur table sans e-commerce complet.</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink-muted block">Limites du Nombre de Tables par Plan :</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Gratis</label>
                <input
                  type="number"
                  value={qrMenuService.tableLimits.gratis}
                  onChange={(e) => setQrMenuService(prev => ({ ...prev, tableLimits: { ...prev.tableLimits, gratis: Number(e.target.value) } }))}
                  className={`h-9 w-full rounded-lg border px-2 text-xs font-bold ${
                    isDark ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-[#F7F8F9] text-ink"
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-emerald-600 block mb-1">Pro</label>
                <input
                  type="number"
                  value={qrMenuService.tableLimits.pro}
                  onChange={(e) => setQrMenuService(prev => ({ ...prev, tableLimits: { ...prev.tableLimits, pro: Number(e.target.value) } }))}
                  className={`h-9 w-full rounded-lg border px-2 text-xs font-bold ${
                    isDark ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-[#F7F8F9] text-ink"
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-emerald-800 block mb-1">Premium</label>
                <input
                  type="number"
                  value={qrMenuService.tableLimits.premium}
                  onChange={(e) => setQrMenuService(prev => ({ ...prev, tableLimits: { ...prev.tableLimits, premium: Number(e.target.value) } }))}
                  className={`h-9 w-full rounded-lg border px-2 text-xs font-bold ${
                    isDark ? "border-gray-700 bg-gray-800 text-white" : "border-line bg-[#F7F8F9] text-ink"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setQrMenuService(prev => ({ ...prev, allowKitchenNotes: !prev.allowKitchenNotes }))}
                className={`p-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-between cursor-pointer ${
                  qrMenuService.allowKitchenNotes ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-black" : "border-line bg-gray-100 text-gray-500"
                }`}
              >
                <span>📝 Notes Cuisine</span>
                <span>{qrMenuService.allowKitchenNotes ? "✓" : "✕"}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMenuService(prev => ({ ...prev, autoOpenWhatsapp: !prev.autoOpenWhatsapp }))}
                className={`p-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-between cursor-pointer ${
                  qrMenuService.autoOpenWhatsapp ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-black" : "border-line bg-gray-100 text-gray-500"
                }`}
              >
                <span>📲 WhatsApp Direct</span>
                <span>{qrMenuService.autoOpenWhatsapp ? "✓" : "✕"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={saveAll}
        disabled={pending}
        className="mt-2 h-14 w-full rounded-2xl bg-brand text-base font-extrabold text-white shadow-xl hover:bg-brand-dark active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
      >
        💾 Enregistrer Toutes les Configurations de Gouvernance
      </button>
    </div>
  );
}

function MerchantDiagnosticModal({
  merchant,
  onClose,
  onRefresh,
}: {
  merchant: Merchant;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"media" | "structure" | "reports" | "tables" | "json">("media");

  const [name, setName] = useState(merchant.name);
  const [slug, setSlug] = useState(merchant.slug);
  const [phone, setPhone] = useState(merchant.phone_e164 ?? "");
  const [businessType, setBusinessType] = useState(merchant.business_type ?? "boutik");
  const [layout, setLayout] = useState(merchant.layout ?? "design1");
  const [themeColor, setThemeColor] = useState(merchant.theme ?? "whatsapp");
  const [currency, setCurrency] = useState(merchant.default_currency ?? "HTG");
  const [category, setCategory] = useState(merchant.category ?? "");
  const [address, setAddress] = useState(merchant.address ?? "");
  const [hours, setHours] = useState(merchant.hours ?? "");
  const [logoUrl, setLogoUrl] = useState(merchant.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(merchant.cover_url ?? "");
  const [instagram, setInstagram] = useState(merchant.social_instagram ?? "");
  const [facebook, setFacebook] = useState(merchant.social_facebook ?? "");
  const [tiktok, setTiktok] = useState(merchant.social_tiktok ?? "");

  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  const inputClass = `mt-1 h-10 w-full rounded-xl border px-3 outline-none focus:border-brand text-xs font-semibold ${
    isDark ? "border-gray-700 bg-gray-800 text-white placeholder-gray-500" : "border-line bg-[#F7F8F9] text-ink"
  }`;

  function handleSaveStructure() {
    startTransition(async () => {
      const res = await updateMerchantStructureAction(merchant.id, {
        name,
        slug,
        phone_e164: phone,
        business_type: businessType,
        layout,
        theme: themeColor,
        default_currency: currency,
        category,
        address,
        hours,
        logo_url: logoUrl,
        cover_url: coverUrl,
        social_instagram: instagram,
        social_facebook: facebook,
        social_tiktok: tiktok,
      });
      if (res.ok) {
        setRepairMsg("✅ Structure du business mise à jour avec succès !");
        onRefresh();
      } else {
        setRepairMsg("❌ Erreur: " + res.error);
      }
    });
  }

  function handleRepairMedia() {
    startTransition(async () => {
      const res = await repairMerchantDataAction(merchant.id);
      if (res.ok) {
        setRepairMsg("✅ " + res.message);
        onRefresh();
      } else {
        setRepairMsg("❌ Erreur lors de la réparation des médias.");
      }
    });
  }

  function handleDownloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(merchant, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `structure-${merchant.slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleExportCsvReport() {
    const csvContent = `ID,Nom,Slug,Plan,Produits,Commandes,GMV_HTG,WhatsApp,Secteur,Layout,Theme\n` +
      `"${merchant.id}","${merchant.name}","${merchant.slug}","${merchant.plan}",${merchant.products},${merchant.orders},${merchant.gmvCents / 100},"${merchant.phone_e164}","${merchant.business_type}","${merchant.layout}","${merchant.theme}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport-marchand-${merchant.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className={`relative w-full max-w-3xl rounded-3xl shadow-2xl border transition-colors max-h-[90vh] flex flex-col ${
        isDark ? "bg-[#0E1B17] border-gray-800 text-white" : "bg-white border-line text-ink"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 p-5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">{merchant.name}</span>
              <span className="rounded-full bg-blue-500/20 text-blue-600 px-2.5 py-0.5 text-xs font-black">
                🛠️ Cockpit Diagnostic
              </span>
              <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[11px] font-bold uppercase">
                {merchant.plan}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">ID: {merchant.id} · Slug: /{merchant.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message de notification */}
        {repairMsg && (
          <div className="mx-5 mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{repairMsg}</span>
            <button onClick={() => setRepairMsg(null)} className="text-emerald-700 hover:underline cursor-pointer">Fermer</button>
          </div>
        )}

        {/* Action Rapide Impersonation */}
        <div className="px-5 pt-3 shrink-0">
          <a
            href={`/p/${merchant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 cursor-pointer"
          >
            👁️ Tester / Inspection Directe de la Vitrine Marchand (`/p/${merchant.slug}`) ↗
          </a>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-line/60 px-5 pt-3 gap-2 overflow-x-auto text-xs font-extrabold shrink-0">
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "media" ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            🖼️ Réparation Médias & Photos
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "structure" ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            ⚙️ Structure & Paramètres Biznis
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "reports" ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            📊 Import/Export & Rapports
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "tables" ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            🍽️ Menu QR Codes & Tables
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "json" ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            🔍 JSON Bruts & Debug
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MEDIA REPAIR */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 border border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-200">🛠️ Résolution Automatique des Problèmes de Photos</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Si le marchand signale des images brisées, des URLs manquantes ou un mauvais affichage du catalogue, cliquez ci-dessous. Le système va balayer les produits et réinjecter les images de remplacement adaptées au secteur ({merchant.business_type ?? "boutik"}).
                </p>
                <button
                  onClick={handleRepairMedia}
                  disabled={pending}
                  className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-sm hover:bg-blue-500 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {pending ? "Réparation en cours…" : "⚡ Lancer la Réparation des Médias & Photos (1-Click)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold block text-ink-muted">URL du Logo</label>
                  <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
                <div>
                  <label className="font-bold block text-ink-muted">URL de la Couverture (Bannière)</label>
                  <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS STRUCTURE EDITOR */}
          {activeTab === "structure" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-ink-muted">Nom du Business</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="font-bold block text-ink-muted">Slug URL (`/p/${slug}`)</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Téléphone WhatsApp (E.164)</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+509..." className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Secteur / Business Type</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputClass}>
                    <option value="boutik">🛍️ Boutik Général</option>
                    <option value="restoran">🍔 Restoran & Kafeterya</option>
                    <option value="quincaillerie">🔨 Kincaillerie & Materyo</option>
                    <option value="supermarket">🛒 Sipèmakèt / Siprèt</option>
                    <option value="boutique_en_ligne">👗 Boutik Abiman & Mòd</option>
                    <option value="beauty">💄 Sante, Boté ak Kosmetik</option>
                    <option value="electronic">📱 Elektwonik ak Telefòn</option>
                    <option value="service">🛠️ Sèvis ak Reparasyon</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Design Vitrine Autorisé</label>
                  <select value={layout} onChange={(e) => setLayout(e.target.value)} className={inputClass}>
                    <option value="design1">Design 1: Héros & Grille Standard (Gratis+)</option>
                    <option value="design2">Design 2: Layout Spécifique Secteur (Pro+)</option>
                    <option value="design3">Design 3: Carousel Showcase Deluxe VIP (Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Thème Couleur Vitrine</label>
                  <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className={inputClass}>
                    <option value="whatsapp">🟢 WhatsApp Green</option>
                    <option value="dark">🌙 Midnight Dark</option>
                    <option value="ocean">🌊 Ocean Blue</option>
                    <option value="emerald">❇️ Emerald Mint</option>
                    <option value="rose">🌸 Rose Luxury</option>
                    <option value="gold">⭐ Prestige Gold</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Devise Principale</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                    <option value="HTG">Gourdes (HTG)</option>
                    <option value="USD">Dollars (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Catégorie</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex: Alimantè" className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Adresse Principale</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delmas 31..." className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Heures d'Ouverture</label>
                  <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="8am - 6pm" className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Instagram Handle/URL</label>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@boutik" className={inputClass} />
                </div>

                <div>
                  <label className="font-bold block text-ink-muted">Facebook / TikTok</label>
                  <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook page" className={inputClass} />
                </div>
              </div>

              <button
                onClick={handleSaveStructure}
                disabled={pending}
                className="mt-4 w-full py-3 rounded-xl bg-brand text-white text-xs font-black shadow-md hover:bg-brand-dark active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {pending ? "Enregistrement en cours…" : "💾 Enregistrer les Modifications de la Structure"}
              </button>
            </div>
          )}

          {/* TAB 3: IMPORT/EXPORT & REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">📊 Diagnostic & Exportation de Rapport</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  En cas de problème d'importation ou d'exportation de rapport par le marchand, vous pouvez générer directement le rapport CSV des ventes et produits ou exporter la structure JSON du tenant.
                </p>

                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExportCsvReport}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
                  >
                    📥 Exporter Rapport CSV Ventes & Structure
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-black shadow-sm hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    📄 Télécharger Structure JSON Completes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TABLES & QR CODE INSPECTOR */}
          {activeTab === "tables" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800">
                <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">📱 Inspection & Génération QR Code Menu Table</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Inspectez et générez les chevalets QR Code pour les tables de <b>{merchant.name}</b>. Vous pouvez aussi tester l'expérience client à table en 1-click.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/p/${merchant.slug}?table=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
                  >
                    👁️ Tester Menu QR Table #1 ↗
                  </a>
                  <a
                    href={`/p/${merchant.slug}?table=5`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
                  >
                    👁️ Tester Menu QR Table #5 ↗
                  </a>
                  <a
                    href={`/p/${merchant.slug}?table=10`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
                  >
                    👁️ Tester Menu QR Table #10 ↗
                  </a>
                </div>
              </div>

              <TableQrGenerator business={merchant as any} />
            </div>
          )}

          {/* TAB 5: JSON DEBUG */}
          {activeTab === "json" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-ink-muted">Structure Brute Supabase (`businesses` record) :</span>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 border border-slate-800">
                {JSON.stringify(merchant, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line/60 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <span className="text-[11px] font-semibold text-ink-muted">
            🛡️ Actions enregistrées dans `security_audit_logs`
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-300 cursor-pointer"
          >
            Fermer Cockpit
          </button>
        </div>
      </div>
    </div>
  );
}

function RestoQrMenuMonitoringSection({
  data,
  run,
  pending,
  busy,
  onOpenQrGenerator,
}: {
  data: Data;
  run: (id: string, fn: () => Promise<unknown>) => void;
  pending: boolean;
  busy: string | null;
  onOpenQrGenerator: (m: Merchant) => void;
}) {
  const [qResto, setQResto] = useState("");
  const qrPlan = data.platformPlans?.find((p) => p.key === "qr_express");
  const initialPrice = qrPlan?.priceGdes ?? data.platformSettings?.qrMenuService?.standalonePriceGdes ?? 500;
  const [qrPriceInput, setQrPriceInput] = useState<number>(initialPrice);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const restoMerchants = data.merchants.filter(
    (m) =>
      m.plan === "qr_express" ||
      (m.business_type ?? "").toLowerCase().includes("resto") ||
      (m.business_type ?? "").toLowerCase().includes("restaur") ||
      (m.category ?? "").toLowerCase().includes("resto")
  );

  const activeQrSubs = data.merchants.filter((m) => m.plan === "qr_express").length;
  const qrMrr = activeQrSubs * qrPriceInput;
  const totalOrders = restoMerchants.reduce((sum, m) => sum + m.orders, 0);
  const totalGmvCents = restoMerchants.reduce((sum, m) => sum + m.gmvCents, 0);

  const filteredRestos = restoMerchants.filter(
    (m) => m.name.toLowerCase().includes(qResto.toLowerCase()) || m.slug.includes(qResto.toLowerCase())
  );

  function handleSyncPrice() {
    const tagline = qrPlan?.tagline || "Spesyal pou Restoran, Bar & Kafeterya (Sèvis Standalone)";
    const featuresStr = (qrPlan?.features || [
      "Menu Dijital ak Imaj 4:5 Hyper-Visyèl (Fòma 2Lx2.5H)",
      "Gjeniratè Chevalet QR pou Tab (Jiska 25 tab)",
      "Pran kòmand sou Tab ak notifikasyon Kwizin (/komand)",
      "Sipò Not Kizin (San piman, plis glas...)",
      "Kòmand dirèk WhatsApp ak chwa tab",
    ]).join(", ");

    run("sync-qr-price", async () => {
      const res = await updatePlanConfig("qr_express", qrPriceInput, tagline, featuresStr);
      await updateGlobalSettingsAction({
        qrMenuService: {
          ...(data.platformSettings?.qrMenuService ?? {
            enabled: true,
            standalonePriceGdes: qrPriceInput,
            tableLimits: { gratis: 5, pro: 25, premium: 50 },
            allowKitchenNotes: true,
            autoOpenWhatsapp: true,
          }),
          standalonePriceGdes: qrPriceInput,
        },
      });
      if (res.ok) {
        setSavedMsg(`✅ Prix Menu QR Express mis à jour à ${qrPriceInput} HTG/mois et synchronisé en temps réel sur la plateforme !`);
      }
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Banner Titre */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-slate-950 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <h2 className="text-lg md:text-xl font-black text-slate-950">Moniteur & Gestion Standalone Menu QR Express</h2>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-amber-400">
              {qrPriceInput} HTG / mwa
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">
            Supervision en temps réel des restaurants, cafétérias et bars configurés avec chevalets QR Code et menus 4:5.
          </p>
        </div>
      </div>

      {/* Synchronisateur de Prix en Temps Réel */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 text-xl font-black shadow-xs">
            💰
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">Synchronisation du Prix du Menu QR Express</h4>
            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mt-0.5">
              Modifiez le tarif mensuel ci-contre. Le montant se recalcule instantanément en temps réel sur tout le portail admin, la landing page et les abonnements.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-300 shadow-xs">
            <input
              type="number"
              value={qrPriceInput}
              onChange={(e) => setQrPriceInput(Number(e.target.value))}
              className="w-24 font-black text-sm text-slate-900 dark:text-white outline-none bg-transparent"
            />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400">HTG / mo</span>
          </div>
          <button
            onClick={handleSyncPrice}
            disabled={pending}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            <span>{pending && busy === "sync-qr-price" ? "Enregistrement…" : "⚡ Synchroniser Prix"}</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-extrabold text-emerald-600 flex items-center justify-between">
          <span>{savedMsg}</span>
          <button onClick={() => setSavedMsg(null)} className="text-emerald-700 hover:underline cursor-pointer">Fermer</button>
        </div>
      )}

      {/* Grid KPIs Service QR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-amber-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">Restos QR Aktif</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{restoMerchants.length}</span>
          <span className="text-[11px] text-slate-400 font-medium">({activeQrSubs} abonné {qrPriceInput} HTG/mo)</span>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-emerald-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">MRR Menu QR Standalone</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{formatMoney(qrMrr * 100)}</span>
          <span className="text-[11px] text-slate-400 font-medium">Revenu récurrent mensuel</span>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">Kòmand Kwizin Traite</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalOrders}</span>
          <span className="text-[11px] text-slate-400 font-medium">Commandes à table & WhatsApp</span>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block">GMV Total Restos</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{formatMoney(totalGmvCents)}</span>
          <span className="text-[11px] text-slate-400 font-medium">Volume des ventes restaurants</span>
        </div>
      </div>

      {/* Barre de Recherche & Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          value={qResto}
          onChange={(e) => setQResto(e.target.value)}
          placeholder="Chèche yon restoran oswa cafétéria sa..."
          className="h-11 w-full sm:w-80 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-bold outline-none focus:border-amber-500"
        />
        <span className="text-xs font-bold text-slate-500">
          Affichage de {filteredRestos.length} restaurant(s) sur {restoMerchants.length}
        </span>
      </div>

      {/* Liste des Restaurants & Menu QR Monitored */}
      <div className="space-y-3">
        {filteredRestos.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900 dark:text-white">{m.name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-black uppercase ${
                    m.plan === "qr_express" ? "bg-amber-400 text-amber-950 shadow-xs" : "bg-emerald-100 text-emerald-900"
                  }`}>
                    {m.plan === "qr_express" ? "🍔 Menu QR Express (500 HTG/mo)" : m.plan}
                  </span>
                </div>
                <span className="text-xs text-slate-500">/{m.slug} · {m.phone_e164 || "Pas de tel"}</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={m.plan}
                  onChange={(e) => run("plan-" + m.id, () => setPlan(m.id, e.target.value))}
                  disabled={pending && busy === "plan-" + m.id}
                  className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="gratis">Gratis (5 Tables max)</option>
                  <option value="qr_express">🍔 Menu QR Express (500 HTG/mo)</option>
                  <option value="pro">Pro (25 Tables max)</option>
                  <option value="premium">Premium (50 Tables max)</option>
                </select>
              </div>
            </div>

            {/* Metrics Restaurant */}
            <div className="grid grid-cols-4 gap-2 my-3 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="block font-black text-slate-900 dark:text-white">{m.products}</span>
                <span className="text-[10px] text-slate-500 font-medium">Plats Menu</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="block font-black text-slate-900 dark:text-white">{m.orders}</span>
                <span className="text-[10px] text-slate-500 font-medium">Kòmand</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="block font-black text-amber-600">{m.plan === "gratis" ? "5" : m.plan === "pro" ? "25" : m.plan === "premium" ? "50" : "25"}</span>
                <span className="text-[10px] text-slate-500 font-medium">Limite Tables</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="block font-black text-emerald-600">{formatMoney(m.gmvCents)}</span>
                <span className="text-[10px] text-slate-500 font-medium">GMV</span>
              </div>
            </div>

            {/* Action buttons Resto */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`/p/${m.slug}?table=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-all"
              >
                <span>👁️ Table #1 ↗</span>
              </a>
              <a
                href={`/p/${m.slug}?table=5`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-all"
              >
                <span>👁️ Table #5 ↗</span>
              </a>
              <button
                onClick={() => onOpenQrGenerator(m)}
                className="h-8 px-3.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🖨️ Générer Chevalets QR (Imprimer)</span>
              </button>
            </div>
          </div>
        ))}

        {filteredRestos.length === 0 && (
          <p className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-xs text-slate-400">
            Aucun restaurant ou service Menu QR trouvé.
          </p>
        )}
      </div>
    </div>
  );
}
