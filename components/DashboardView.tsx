"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductPosterModal } from "@/components/ProductPosterModal";
import { BottomNav } from "@/components/BottomNav";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { signOut } from "@/app/login/actions";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { DASHBOARD_COPY } from "@/lib/i18n/app/dashboard";
import { formatMoney } from "@/lib/money";
import { analyzeStockRisk } from "@/lib/stock_ai";
import { canSell, setupProgress, setupSteps } from "@/lib/setup-steps";
import { collectDebts } from "@/lib/dunning";
import { waMeLink } from "@/lib/whatsapp";
import type { DashboardOrder, SourceRow } from "@/lib/data";
import type { RolePermissions, UserSession } from "@/lib/rbac";
import type { Business, OrderStatus, Product } from "@/lib/types";

export interface DashboardViewProps {
  session: UserSession;
  permissions: RolePermissions;
  userName: string;
  business: Business;
  stats: {
    weekSalesCents: number;
    weekTrendPct: number;
    hasLastWeek: boolean;
    ordersToday: number;
    owedCents: number;
    weekBars: number[];
  };
  funnel: { leads: number; orders: number; paid: number; delivered: number };
  statusCounts: Partial<Record<OrderStatus, number>>;
  recentOrders: DashboardOrder[];
  topCustomers: { id: string; full_name: string; initials: string; orders: number; totalCents: number }[];
  sources: SourceRow[];
  products: Product[];
}

const CLOSED: OrderStatus[] = ["livre", "swivi", "anile"];

export function DashboardView(props: DashboardViewProps) {
  const { session, permissions, business, stats, funnel, statusCounts, recentOrders, products } = props;
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  const [posterOpen, setPosterOpen] = useState(false);

  const profile = c.profiles[session.role === "owner" ? "owner" : session.agentId ?? "agent"] ?? session.specialty ?? c.profiles.agent;
  const userInitials = initialsOf(props.userName) || "C";
  const hasOrders = funnel.orders > 0;
  const inProgress = Object.entries(statusCounts)
    .filter(([s]) => !CLOSED.includes(s as OrderStatus))
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);
  const stockAlerts = permissions.canEditStock ? analyzeStockRisk(products) : [];
  const searchHref = permissions.allowedNavTabs.includes("kliyan") ? "/kliyan" : "/komand";

  return (
    <div className="app-page with-topnav relative min-h-[100dvh] bg-chat-bg pb-[96px]">
      <header className="flex flex-col gap-4 bg-brand px-5 pb-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BusinessMark business={business} />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-medium text-[#B9F5E4]">{d.greeting(props.userName)}</span>
                <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">{profile}</span>
              </div>
              <span className="truncate text-xl font-extrabold tracking-tight text-white">{business.name}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <LanguageToggle />
            </div>
            {permissions.canManageTeam && (
              <HeaderIconLink href="/ekip" label={c.nav.team}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </HeaderIconLink>
            )}
            {permissions.canManageSettings && (
              <HeaderIconLink href="/reglaj" label={c.nav.settings}>
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </HeaderIconLink>
            )}
            <form action={signOut}>
              <button
                type="submit"
                aria-label={d.signOutAs(props.userName)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white/35 bg-brand-teal text-sm font-extrabold text-white active:scale-95"
              >
                {userInitials}
              </button>
            </form>
          </div>
        </div>
        <Link href={searchHref} className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5 text-[#D6F5EC] transition-colors hover:bg-white/20">
          <SearchIcon />
          <span className="text-sm">{d.search}</span>
        </Link>
      </header>

      <main className="grid grid-cols-1 gap-[18px] px-4 pt-[18px] md:grid-cols-2 md:items-start md:gap-5 md:px-6 md:pt-6">
        {permissions.canViewFinancialTurnover ? (
          <>
            <StoreActions
              slug={business.slug}
              canMakePoster={products.length > 0}
              onPoster={() => setPosterOpen(true)}
            />

            <FirstSteps business={business} productCount={products.length} orderCount={funnel.orders} />

            {stockAlerts.length > 0 && <StockAlerts alerts={stockAlerts} />}

            {hasOrders && (
              <>
                <WeekSales stats={stats} />
                <section className="grid grid-cols-3 gap-3 md:col-span-2">
                  <Metric label={d.metrics.ordersToday} value={String(stats.ordersToday)} />
                  <Metric label={d.metrics.inProgress} value={String(inProgress)} />
                  <Metric label={d.metrics.toCollect} value={formatMoney(stats.owedCents)} tone={stats.owedCents > 0 ? "owed" : undefined} />
                </section>
                <Collect orders={recentOrders} shopName={business.name} />
                <RecentOrders orders={recentOrders.slice(0, 5)} />
                <Funnel funnel={funnel} />
                <Sources sources={props.sources} />
                <TopCustomers customers={props.topCustomers} canOpen={permissions.allowedNavTabs.includes("kliyan")} />
              </>
            )}
          </>
        ) : (
          <>
            <AgentQueue
              profile={profile}
              columns={permissions.allowedPipelineColumns}
              statusCounts={statusCounts}
              orders={recentOrders}
              canOpenOrders={permissions.allowedNavTabs.includes("komand")}
            />
            {stockAlerts.length > 0 && <StockAlerts alerts={stockAlerts} />}
          </>
        )}
      </main>

      {posterOpen && (
        <ProductPosterModal business={business} products={products} onClose={() => setPosterOpen(false)} />
      )}

      <BottomNav active="tablo" userSession={session} />
    </div>
  );
}

/* ---------- Blocs ---------- */

function StoreActions({ slug, canMakePoster, onPoster }: { slug: string; canMakePoster: boolean; onPoster: () => void }) {
  const d = useDict(DASHBOARD_COPY);
  const { share, copied, shareLabel } = useShareStore(slug);
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:col-span-2">
      <button
        type="button"
        onClick={share}
        className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,211,102,0.3)] active:scale-[0.99]"
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
        <span>{copied ? shareLabel : d.actions.share}</span>
      </button>
      <a
        href={`/b/${slug}`}
        target="_blank"
        rel="noopener"
        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-bold text-ink active:scale-[0.99]"
      >
        <EyeIcon />
        <span>{d.actions.viewStore}</span>
      </a>
      {canMakePoster && (
        <button
          type="button"
          onClick={onPoster}
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-bold text-ink active:scale-[0.99]"
        >
          <ImageIcon />
          <span>{d.actions.poster}</span>
        </button>
      )}
    </div>
  );
}


/**
 * Créances à recouvrer, les plus anciennes d'abord. Le tableau de bord
 * affichait un montant sans dire de qui il venait : impossible d'agir dessus.
 */
function Collect({ orders, shopName }: { orders: DashboardOrder[]; shopName: string }) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  const summary = collectDebts(orders);
  if (summary.count === 0) return null;

  const shown = summary.debts.slice(0, 5);
  const rest = summary.count - shown.length;
  const tone: Record<string, string> = {
    old: "bg-[#FCE4E4] text-[#C0392B]",
    due: "bg-owed-bg text-owed-text",
    fresh: "bg-[#F3F6F4] text-ink-soft",
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-base font-extrabold text-ink">{d.dunning.title}</h2>
          <p className="text-[12.5px] text-ink-muted">{d.dunning.hint}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[11px] font-semibold text-ink-muted">{d.dunning.total}</span>
          <span className="text-lg font-extrabold text-owed-text">{formatMoney(summary.totalOwedCents)}</span>
        </div>
      </div>

      {summary.oldestDays > 0 && <p className="text-[12px] text-ink-muted">{d.dunning.oldest(summary.oldestDays)}</p>}

      <ul className="flex flex-col divide-y divide-line">
        {shown.map((debt) => (
          <li key={debt.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-bold text-ink">{debt.customerName || c.customerFallback}</span>
              <span className="text-[11.5px] text-ink-muted">
                {debt.ref} · {d.dunning.age(debt.ageDays)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-black ${tone[debt.tier]}`}>{d.dunning.tiers[debt.tier]}</span>
              <span className="text-[13.5px] font-extrabold tabular-nums text-ink">{formatMoney(debt.owedCents)}</span>
              {debt.reachable ? (
                <a
                  href={waMeLink(
                    debt.customerPhone ?? "",
                    d.dunning.message({
                      name: debt.customerName || c.customerFallback,
                      ref: debt.ref,
                      owed: formatMoney(debt.owedCents),
                      shop: shopName,
                    }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-brand-green px-2.5 py-1.5 text-[11.5px] font-extrabold text-white active:scale-95"
                >
                  {d.dunning.remind}
                </a>
              ) : (
                <span className="rounded-lg bg-[#F3F6F4] px-2.5 py-1.5 text-[11.5px] font-bold text-ink-faint">{d.dunning.noPhone}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 text-[11.5px] text-ink-muted">
        <span>{summary.unreachable > 0 ? d.dunning.unreachable(summary.unreachable) : ""}</span>
        {rest > 0 && (
          <Link href="/komand" className="font-bold text-brand">
            {d.dunning.more(rest)}
          </Link>
        )}
      </div>
    </section>
  );
}

function FirstSteps({ business, productCount, orderCount }: { business: Business; productCount: number; orderCount: number }) {
  const d = useDict(DASHBOARD_COPY);
  const { share, copied, shareLabel } = useShareStore(business.slug);
  const computed = setupSteps({
    activeProducts: productCount,
    coverUrl: business.cover_url,
    logoUrl: business.logo_url,
    hasPayMethod: Boolean(
      business.moncash_number || business.natcash_number || business.bank_accounts || business.zelle_info || business.usdt_trc20_address,
    ),
    deliveryZones: business.delivery_zones?.length ?? 0,
    orders: orderCount,
  });
  const { done: doneCount, next } = setupProgress(computed);
  // Tout est fait : la carte n'a plus rien à dire, elle disparaît.
  if (next === null) return null;
  const steps = computed.map((s) => ({
    done: s.done,
    copy: d.firstSteps[s.key],
    href: s.key === "share" ? undefined : s.href,
    onClick: s.key === "share" ? share : undefined,
  }));

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-brand/20 bg-white p-5 shadow-[0_2px_10px_rgba(17,27,33,0.05)] md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-extrabold text-ink">{d.firstSteps.title}</h2>
          <p className="text-[13px] text-ink-muted">{d.firstSteps.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#E7F7F1] px-2.5 py-1 text-xs font-bold text-brand">
          {d.firstSteps.progress(doneCount, steps.length)}
        </span>
      </div>
      {!canSell(computed) && (
        <p className="rounded-xl bg-owed-bg px-3 py-2 text-[12.5px] font-semibold text-owed-text">{d.firstSteps.blocked}</p>
      )}
      <ol className="flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 ${s.done ? "border-transparent bg-[#F3F8F6]" : "border-line"}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.done ? "bg-brand text-white" : "bg-[#EEF2F3] text-ink-muted"}`}
            >
              {s.done ? <CheckIcon color="#fff" /> : i + 1}
            </span>
            <div className="flex min-w-[9rem] flex-1 flex-col">
              <span className={`text-sm font-bold ${s.done ? "text-ink-muted line-through decoration-ink-faint" : "text-ink"}`}>{s.copy.title}</span>
              {!s.done && <span className="text-xs text-ink-muted">{s.copy.desc}</span>}
            </div>
            {s.done ? (
              <span className="ml-auto text-xs font-semibold text-brand">{d.firstSteps.done}</span>
            ) : s.href ? (
              <Link href={s.href} className="ml-auto shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">
                {s.copy.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={s.onClick}
                className="ml-auto shrink-0 cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white"
              >
                {copied ? shareLabel : s.copy.cta}
              </button>
            )}
          </li>
        ))}
        {orderCount === 0 && (
          <li className="flex items-center gap-3 rounded-xl border border-dashed border-line p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F3] text-sm font-bold text-ink-muted">
              {steps.length + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-ink">{d.firstSteps.firstOrder.title}</span>
              <span className="text-xs text-ink-muted">{d.firstSteps.firstOrder.desc}</span>
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}

function StockAlerts({ alerts }: { alerts: ReturnType<typeof analyzeStockRisk> }) {
  const d = useDict(DASHBOARD_COPY);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#F4D9B8] bg-[#FFF8EF] p-4 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertIcon />
          <span className="text-sm font-extrabold text-[#8A4B08]">{d.stockAlerts.title(alerts.length)}</span>
        </div>
        <Link href="/stok" className="shrink-0 text-xs font-bold text-brand">
          {d.stockAlerts.cta}
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-[#F4E4CF] rounded-xl bg-white">
        {alerts.slice(0, 5).map((a) => (
          <li key={a.productId} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="truncate text-sm font-semibold text-ink">{a.productName}</span>
            <span className={`shrink-0 text-xs font-bold ${a.soldOut ? "text-[#C0392B]" : "text-[#B25E09]"}`}>
              {a.soldOut ? d.stockAlerts.out : d.stockAlerts.low(a.currentStock, a.stockThreshold)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekSales({ stats }: { stats: DashboardViewProps["stats"] }) {
  const d = useDict(DASHBOARD_COPY);
  const maxBar = Math.max(...stats.weekBars) || 1;
  const up = stats.weekTrendPct >= 0;
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-[18px] shadow-[0_2px_10px_rgba(17,27,33,0.06)] md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-muted">{d.metrics.weekSales}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            !stats.hasLastWeek ? "bg-[#EEF2F3] text-ink-muted" : up ? "bg-[#E7F7F1] text-brand" : "bg-[#FDECEC] text-[#C0392B]"
          }`}
        >
          {stats.hasLastWeek ? d.metrics.trend(stats.weekTrendPct) : d.metrics.noComparison}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[34px] font-extrabold -tracking-[1px] tabular-nums">
          {(stats.weekSalesCents / 100).toLocaleString("fr-HT")}
        </span>
        <span className="text-[15px] font-bold text-ink-muted">HTG</span>
      </div>
      <div className="flex h-14 items-end gap-[7px] pt-1">
        {stats.weekBars.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-[5px] ${v > 0 && v === maxBar ? "bg-brand-teal" : "bg-[#D9EFE8]"}`}
              style={{ height: `${Math.round((v / maxBar) * 46) + 6}px` }}
            />
            <span className="text-[10px] text-ink-faint">{d.days[i]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "owed" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
      <span className={`truncate text-lg font-extrabold tabular-nums sm:text-xl ${tone === "owed" ? "text-owed-text" : "text-ink"}`}>{value}</span>
      <span className="text-[11.5px] font-medium leading-tight text-ink-muted">{label}</span>
    </div>
  );
}

function RecentOrders({ orders }: { orders: DashboardOrder[] }) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle title={d.recent.title} href="/komand" linkLabel={c.actions.seeAll} />
      <Card>
        {orders.length === 0 ? (
          <p className="px-[15px] py-4 text-[13px] text-ink-muted">{d.recent.empty}</p>
        ) : (
          orders.map((o, i) => <OrderRow key={o.id} order={o} last={i === orders.length - 1} />)
        )}
      </Card>
    </section>
  );
}

function OrderRow({ order, last }: { order: DashboardOrder; last: boolean }) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  return (
    <Link href="/komand" className={`flex items-center gap-3 px-[15px] py-[12px] hover:bg-[#FAFBFB] ${last ? "" : "border-b border-[#F0F2F3]"}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{order.customerName || c.customerFallback}</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <span className="font-mono">#{order.ref}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{c.statuses[order.status]}</span>
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-bold tabular-nums">{formatMoney(order.totalCents)}</span>
        {order.owedCents > 0 && (
          <span className="text-[11px] font-semibold text-owed-text">
            {formatMoney(order.owedCents)} {d.recent.owed}
          </span>
        )}
      </div>
    </Link>
  );
}

function Funnel({ funnel }: { funnel: DashboardViewProps["funnel"] }) {
  const d = useDict(DASHBOARD_COPY);
  const max = Math.max(funnel.leads, funnel.orders) || 1;
  const rows = [
    { label: d.funnel.leads, value: funnel.leads, color: "#66D2A6" },
    { label: d.funnel.orders, value: funnel.orders, color: "#16B67C" },
    { label: d.funnel.paid, value: funnel.paid, color: "#0E9E6B" },
    { label: d.funnel.delivered, value: funnel.delivered, color: "#0A7D55" },
  ];
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle title={d.funnel.title} />
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(17,27,33,0.05)]">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-ink-soft">{r.label}</span>
              <span className="font-extrabold tabular-nums">{r.value.toLocaleString("fr-HT")}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF2F3]">
              <div className="h-full rounded-full" style={{ width: `${Math.round((r.value / max) * 100)}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sources({ sources }: { sources: SourceRow[] }) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-[15px] font-bold">{d.sources.title}</h2>
        <span className="text-[11px] font-semibold text-ink-faint">{d.sources.period}</span>
      </div>
      <Card>
        {sources.length === 0 ? (
          <p className="px-[15px] py-4 text-[13px] leading-relaxed text-ink-muted">{d.sources.empty}</p>
        ) : (
          sources.map((s, i) => (
            <div key={s.source || "direct"} className={`flex items-center gap-3 px-[15px] py-[13px] ${i < sources.length - 1 ? "border-b border-[#F0F2F3]" : ""}`}>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">{s.source || d.sources.direct}</span>
                <span className="text-xs text-ink-faint">{c.orders(s.orders)}</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{formatMoney(s.revenueCents)}</span>
            </div>
          ))
        )}
      </Card>
    </section>
  );
}

function TopCustomers({ customers, canOpen }: { customers: DashboardViewProps["topCustomers"]; canOpen: boolean }) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle title={d.topCustomers.title} href={canOpen ? "/kliyan" : undefined} linkLabel={c.actions.seeAll} />
      <Card>
        {customers.length === 0 ? (
          <p className="px-[15px] py-4 text-[13px] text-ink-muted">{d.topCustomers.empty}</p>
        ) : (
          customers.map((cu, i) => (
            <div key={cu.id} className={`flex items-center gap-3 px-[15px] py-[13px] ${i < customers.length - 1 ? "border-b border-[#F0F2F3]" : ""}`}>
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#DCF8C6] text-sm font-bold text-[#2A7D3F]">
                {cu.initials}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">{cu.full_name}</span>
                <span className="text-xs text-ink-faint">{c.orders(cu.orders)}</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{formatMoney(cu.totalCents)}</span>
            </div>
          ))
        )}
      </Card>
    </section>
  );
}

function AgentQueue({
  profile,
  columns,
  statusCounts,
  orders,
  canOpenOrders,
}: {
  profile: string;
  columns: OrderStatus[];
  statusCounts: Partial<Record<OrderStatus, number>>;
  orders: DashboardOrder[];
  canOpenOrders: boolean;
}) {
  const d = useDict(DASHBOARD_COPY);
  const c = useDict(COMMON_COPY);
  const mine = orders.filter((o) => columns.includes(o.status));
  // Un profil qui couvre tout le pipeline n'a pas besoin de voir les étapes closes en tête.
  const open = mine.filter((o) => !CLOSED.includes(o.status) || columns.length <= 2);

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-white p-4 shadow-2xs md:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-base font-extrabold text-ink">{d.agent.title(profile)}</h1>
            <p className="text-xs text-ink-muted">{d.agent.subtitle}</p>
          </div>
          {canOpenOrders && (
            <Link href="/komand" className="inline-flex h-9 items-center justify-center self-start rounded-xl bg-brand px-3.5 text-xs font-bold text-white hover:bg-brand-dark sm:self-auto">
              {d.agent.open}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full bg-[#F3F6F4] px-3 py-1.5 text-xs font-semibold text-ink-soft">
              {c.statuses[s]}
              <span className="rounded-full bg-white px-1.5 font-extrabold tabular-nums text-ink">{statusCounts[s] ?? 0}</span>
            </span>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3 md:col-span-2">
        <SectionTitle title={d.agent.queue} />
        <Card>
          {open.length === 0 ? (
            <p className="px-[15px] py-4 text-[13px] text-ink-muted">{d.agent.empty}</p>
          ) : (
            open.slice(0, 8).map((o, i, arr) => <OrderRow key={o.id} order={o} last={i === arr.length - 1} />)
          )}
        </Card>
      </section>
    </>
  );
}

/* ---------- Petits composants ---------- */

function useShareStore(slug: string) {
  const d = useDict(DASHBOARD_COPY);
  const [state, setState] = useState<"shared" | "copied" | null>(null);

  const confirm = (kind: "shared" | "copied") => {
    setState(kind);
    setTimeout(() => setState(null), 2500);
  };

  async function share() {
    const url = `${window.location.origin}/b/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: d.actions.shareTitle, text: d.actions.shareText, url });
        confirm("shared");
        return;
      } catch {
        /* partage annulé : on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      confirm("copied");
    } catch {
      /* presse-papier indisponible */
    }
  }

  // « copied » reste vrai pour les deux cas : le bouton montre la coche.
  return { share, copied: state !== null, shareLabel: state === "shared" ? d.actions.shared : d.actions.copied };
}

function BusinessMark({ business }: { business: Business }) {
  if (business.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={business.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-[13px] bg-white object-cover" />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white text-base font-extrabold text-brand">
      {initialsOf(business.name) || "C"}
    </div>
  );
}

function HeaderIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 active:scale-95">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </Link>
  );
}

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-xs font-semibold text-brand">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(17,27,33,0.05)]">{children}</div>;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function svgProps(size = 18, color = "currentColor") {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}
function SearchIcon() {
  return (
    <svg {...svgProps(18, "#D6F5EC")}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg {...svgProps()}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function CheckIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg {...svgProps(16, color)} strokeWidth={2.6}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg {...svgProps(18, "#008069")}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg {...svgProps(18, "#008069")}>
      <rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg {...svgProps(18, "#B25E09")}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
