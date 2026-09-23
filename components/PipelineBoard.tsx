"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { closeOrder, confirmDeliveryWithCode, markOrderPaid, moveOrderStatus, setCourier } from "@/app/komand/actions";
import { InvoiceModal } from "@/components/InvoiceModal";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict, useLanguage } from "@/components/LanguageContext";
import { getActivePayMethods } from "@/lib/bank";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import { MESSAGE_COPY } from "@/lib/i18n/app/messages";
import { ORDERS_COPY } from "@/lib/i18n/app/orders";
import { scaleImage } from "@/lib/image";
import { formatMoney } from "@/lib/money";
import {
  buildBackInStockMessage,
  buildConfirmPaymentMessage,
  buildContactPaymentMessage,
  buildDebtReminder,
  buildSatisfactionMessage,
  buildStatusMessage,
  getOrderSecurityCode,
} from "@/lib/order";
import { getRolePermissions } from "@/lib/rbac";
import { PIPELINE_COLUMNS, type Currency, type OrderStatus, type PayMethod, type PipelineCard } from "@/lib/types";
import { waMeLink } from "@/lib/whatsapp";

// Pastille et accent de couleur par étape : la couleur situe l'étape d'un coup
// d'œil, le fond des cartes reste blanc pour que le texte se lise.
const STAGE_COLOR: Record<OrderStatus, string> = {
  demand_acha: "#06B6D4",
  kontak: "#64748B",
  metod_peman: "#EF4444",
  konfime_peman: "#2563EB",
  sou_wout: "#8B5CF6",
  livre: "#10B981",
  swivi: "#6B7280",
  anile: "#9CA3AF",
  pou_konfime: "#06B6D4",
  peye: "#2563EB",
};

// Étapes couvertes par chaque profil d'agent, pour le filtre du propriétaire.
const PROFILE_COLUMNS: Record<string, OrderStatus[]> = {
  marie: ["konfime_peman"],
  jean: ["demand_acha", "kontak", "metod_peman"],
  pierre: ["sou_wout", "livre"],
  florence: ["swivi"],
};

export interface PipelineBoardProps {
  initial: PipelineCard[];
  userSession?: { full_name: string; role: "owner" | "agent"; specialty?: string; agentId?: string };
  businessName: string;
  businessLogoUrl?: string | null;
  businessPhone?: string;
  businessSlogan?: string | null;
  businessSlug?: string;
  businessPromoText?: string | null;
  businessCurrency?: Currency;
  businessUsdExchangeRate?: number | null;
  businessBankAccounts?: string | null;
  businessZelleInfo?: string | null;
  businessUsdtAddress?: string | null;
  businessMoncashNumber?: string | null;
  businessMoncashName?: string | null;
  businessMoncashQrUrl?: string | null;
  businessNatcashNumber?: string | null;
  businessNatcashName?: string | null;
  businessNatcashQrUrl?: string | null;
  businessZelleQrUrl?: string | null;
  businessUsdtQrUrl?: string | null;
}

export function PipelineBoard(props: PipelineBoardProps) {
  const {
    initial,
    businessName,
    businessSlug = "",
    businessCurrency = "HTG",
    businessPhone,
    businessBankAccounts,
    businessZelleInfo,
    businessUsdtAddress,
    businessMoncashNumber,
    businessMoncashName,
    businessNatcashNumber,
    businessNatcashName,
    userSession,
  } = props;

  const { language } = useLanguage();
  const o = useDict(ORDERS_COPY);
  const c = useDict(COMMON_COPY);
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;

  const [cards, setCards] = useState<PipelineCard[]>(initial);
  const [activeModal, setActiveModal] = useState<{ card: PipelineCard; type: "invoice" | "receipt"; payMethod?: PayMethod } | null>(null);
  const [promoCard, setPromoCard] = useState<PipelineCard | null>(null);
  const [owedOnly, setOwedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const permissions = userSession ? getRolePermissions(userSession) : null;
  const canFilterByProfile = permissions ? permissions.canSwitchPipelineAgentFilter : true;
  const canMarkPaid =
    !permissions ||
    permissions.canViewFinancialTurnover ||
    permissions.allowedPipelineColumns.includes("konfime_peman") ||
    permissions.allowedPipelineColumns.includes("swivi");
  const [profileFilter, setProfileFilter] = useState("all");

  const visibleColumns = useMemo(() => {
    if (permissions && !canFilterByProfile) {
      return PIPELINE_COLUMNS.filter((col) => permissions.allowedPipelineColumns.includes(col));
    }
    const cols = PROFILE_COLUMNS[profileFilter];
    return cols ? PIPELINE_COLUMNS.filter((col) => cols.includes(col)) : PIPELINE_COLUMNS;
  }, [permissions, canFilterByProfile, profileFilter]);

  const activePayMethods = getActivePayMethods(
    {
      phone_e164: businessPhone,
      bank_accounts: businessBankAccounts,
      zelle_info: businessZelleInfo,
      usdt_trc20_address: businessUsdtAddress,
      moncash_number: businessMoncashNumber,
      moncash_name: businessMoncashName,
      natcash_number: businessNatcashNumber,
      natcash_name: businessNatcashName,
    },
    { cashOnDelivery: m.cashOnDelivery },
  );

  const owedCount = cards.filter((card) => card.owedCents > 0).length;
  const shown = owedOnly ? cards.filter((card) => card.owedCents > 0) : cards;

  function advance(card: PipelineCard) {
    const idx = PIPELINE_COLUMNS.indexOf(card.status);
    if (idx < 0 || idx >= PIPELINE_COLUMNS.length - 1) return;
    const next = PIPELINE_COLUMNS[idx + 1];
    const previous = card.status;
    setError(null);
    setCards((cs) => cs.map((x) => (x.id === card.id ? { ...x, status: next } : x)));
    startTransition(async () => {
      const res = await moveOrderStatus(card.id, next);
      // Sans ce retour en arrière, l'interface affirmait un déplacement que la
      // base avait refusé (droits, commande d'un autre marchand…).
      if (!res?.ok) {
        setCards((cs) => cs.map((x) => (x.id === card.id ? { ...x, status: previous } : x)));
        setError(o.errors.move);
      }
    });
  }

  function settle(card: PipelineCard) {
    if (!window.confirm(o.card.markPaidConfirm(card.customerName, formatMoney(card.owedCents, card.currency ?? businessCurrency)))) return;
    const previous = card.owedCents;
    setError(null);
    setCards((cs) => cs.map((x) => (x.id === card.id ? { ...x, owedCents: 0 } : x)));
    startTransition(async () => {
      const res = await markOrderPaid(card.id);
      if (!res?.ok) {
        setCards((cs) => cs.map((x) => (x.id === card.id ? { ...x, owedCents: previous } : x)));
        setError(o.errors.markPaid);
      }
    });
  }

  function close(card: PipelineCard) {
    if (!window.confirm(o.card.archiveConfirm)) return;
    setError(null);
    setCards((cs) => cs.filter((x) => x.id !== card.id));
    startTransition(async () => {
      const res = await closeOrder(card.id);
      if (!res?.ok) {
        setCards((cs) => (cs.some((x) => x.id === card.id) ? cs : [...cs, card]));
        setError(o.errors.move);
      }
    });
  }

  function scrollToColumn(col: OrderStatus) {
    columnRefs.current[col]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 bg-brand px-4 pb-4 pt-5">
        <div className="flex flex-col">
          <h1 className="text-[19px] font-extrabold text-white">{o.title}</h1>
          <span className="text-[11.5px] text-[#B9F5E4]">{o.subtitle}</span>
        </div>
        <div className="md:hidden">
          <LanguageToggle />
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
          <h2 className="text-base font-extrabold text-ink">{o.emptyBoard.title}</h2>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-ink-muted">{o.emptyBoard.desc}</p>
          <Link href="/" className="mt-1 flex h-11 items-center rounded-2xl bg-brand px-5 text-sm font-bold text-white">
            {o.emptyBoard.cta}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Filtres et repères d'étapes */}
          <div className="flex flex-col gap-2 px-4 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOwedOnly(false)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${!owedOnly ? "bg-brand text-white" : "border border-line bg-white text-ink-muted"}`}
              >
                {o.filters.all(cards.length)}
              </button>
              <button
                type="button"
                onClick={() => setOwedOnly(true)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${owedOnly ? "bg-owed-text text-white" : "border border-line bg-white text-ink-muted"}`}
              >
                {o.filters.owed(owedCount)}
              </button>
              {canFilterByProfile ? (
                <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <span className="hidden sm:inline">{o.stageFilter.label}</span>
                  <select
                    value={profileFilter}
                    onChange={(e) => setProfileFilter(e.target.value)}
                    className="h-9 cursor-pointer rounded-xl border border-line bg-white px-2 text-xs font-bold text-ink outline-none"
                  >
                    <option value="all">{o.stageFilter.everything}</option>
                    {Object.keys(PROFILE_COLUMNS).map((key) => (
                      <option key={key} value={key}>
                        {c.profiles[key]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="ml-auto text-xs font-semibold text-ink-muted">
                  {o.restricted(c.profiles[userSession?.agentId ?? "agent"] ?? userSession?.specialty ?? c.profiles.agent)}
                </span>
              )}
            </div>

            {/* Repères d'étapes : un aperçu des volumes, et un raccourci vers la colonne. */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {visibleColumns.map((col) => {
                const n = shown.filter((card) => card.status === col).length;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => scrollToColumn(col)}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-soft"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[col] }} />
                    {c.statuses[col]}
                    <span className="font-extrabold tabular-nums text-ink">{n}</span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                {error}
              </p>
            )}
          </div>

          {/* Colonnes */}
          <div ref={boardRef} className="flex gap-3.5 overflow-x-auto px-3.5 pb-24 pt-1 scroll-smooth [scrollbar-width:thin]">
            {visibleColumns.map((col, colIndex) => {
              const colCards = shown.filter((card) => card.status === col);
              return (
                <div
                  key={col}
                  ref={(el) => {
                    columnRefs.current[col] = el;
                  }}
                  className="flex w-[295px] shrink-0 flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: STAGE_COLOR[col] }} />
                      <h2 className="text-sm font-extrabold tracking-tight">{c.statuses[col]}</h2>
                    </div>
                    <span className="rounded-xl bg-white px-2.5 py-0.5 text-xs font-extrabold text-ink-soft">{colCards.length}</span>
                  </div>

                  {colCards.map((card) => (
                    <OrderCard
                      key={card.id}
                      card={card}
                      column={col}
                      props={props}
                      activePayMethods={activePayMethods}
                      canMarkPaid={canMarkPaid}
                      onAdvance={() => advance(card)}
                      onSettle={() => settle(card)}
                      onClose={() => close(card)}
                      onInvoice={(type, payMethod) => setActiveModal({ card, type, payMethod })}
                      onPromo={() => setPromoCard(card)}
                    />
                  ))}

                  {colCards.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-xs leading-relaxed text-ink-faint">
                      {colIndex === 0 ? o.emptyColumn.first : o.emptyColumn.other}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="w-1 shrink-0" />
          </div>
        </div>
      )}

      {activeModal && (
        <InvoiceModal
          card={activeModal.card}
          type={activeModal.type}
          initialPayMethod={activeModal.payMethod}
          businessName={businessName}
          businessLogoUrl={props.businessLogoUrl}
          businessPhone={businessPhone}
          businessSlogan={props.businessSlogan}
          businessCurrency={businessCurrency}
          usdExchangeRate={props.businessUsdExchangeRate}
          bankAccounts={businessBankAccounts}
          zelleInfo={businessZelleInfo}
          usdtAddress={businessUsdtAddress}
          moncashNumber={businessMoncashNumber}
          moncashName={businessMoncashName}
          moncashQrUrl={props.businessMoncashQrUrl}
          natcashNumber={businessNatcashNumber}
          natcashName={businessNatcashName}
          natcashQrUrl={props.businessNatcashQrUrl}
          zelleQrUrl={props.businessZelleQrUrl}
          usdtQrUrl={props.businessUsdtQrUrl}
          onClose={() => setActiveModal(null)}
        />
      )}

      {promoCard && (
        <PromoModal
          customerName={promoCard.customerName}
          customerPhone={promoCard.phone_e164}
          businessName={businessName}
          businessSlug={businessSlug}
          initialPromoText={props.businessPromoText}
          onClose={() => setPromoCard(null)}
        />
      )}
    </div>
  );
}

/* ---------- Carte d'une commande ---------- */

function OrderCard({
  card,
  column,
  props,
  activePayMethods,
  canMarkPaid,
  onAdvance,
  onSettle,
  onClose,
  onInvoice,
  onPromo,
}: {
  card: PipelineCard;
  column: OrderStatus;
  props: PipelineBoardProps;
  activePayMethods: ReturnType<typeof getActivePayMethods>;
  canMarkPaid: boolean;
  onAdvance: () => void;
  onSettle: () => void;
  onClose: () => void;
  onInvoice: (type: "invoice" | "receipt", payMethod?: PayMethod) => void;
  onPromo: () => void;
}) {
  const { language } = useLanguage();
  const o = useDict(ORDERS_COPY);
  const c = useDict(COMMON_COPY);
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;
  const currency = card.currency ?? props.businessCurrency ?? "HTG";
  const owed = card.owedCents > 0;
  const isPaymentStage = column === "konfime_peman" || column === "peye";
  const canAdvance = PIPELINE_COLUMNS.indexOf(card.status) < PIPELINE_COLUMNS.length - 1;

  const messageHref = (() => {
    if (column === "kontak") {
      return waMeLink(
        card.phone_e164,
        buildContactPaymentMessage(
          card.customerName,
          card.ref,
          formatMoney(card.totalCents, currency),
          activePayMethods,
          props.businessUsdtAddress,
          card.securityCode,
          m,
        ),
      );
    }
    if (isPaymentStage) {
      return waMeLink(card.phone_e164, buildConfirmPaymentMessage(card.customerName, card.ref, props.businessName, m));
    }
    if (owed) {
      return waMeLink(card.phone_e164, buildDebtReminder(card.customerName, card.owedCents, currency, props.businessName, m));
    }
    return waMeLink(
      card.phone_e164,
      buildStatusMessage(card.status, { business: props.businessName, name: card.customerName, ref: card.ref, totalCents: card.totalCents, currency }, m),
    );
  })();

  const sendLabel = (() => {
    if (column === "kontak") return o.card.send.contact;
    if (isPaymentStage) return o.card.send.confirmPayment;
    if (owed) return o.card.send.debtReminder;
    if (column === "sou_wout") return o.card.send.onTheWay;
    if (column === "livre") return o.card.send.delivered;
    if (column === "swivi") return o.card.send.followUp;
    return o.card.send.generic;
  })();

  return (
    <article
      className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.06)]"
      style={{ borderLeft: `4px solid ${owed ? "#B25E09" : STAGE_COLOR[column]}` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-sm font-bold text-ink">{card.customerName || c.customerFallback}</span>
        <span className="shrink-0 text-[11px] font-semibold text-ink-faint">#{card.ref}</span>
      </div>
      {card.itemsSummary && <span className="truncate text-[12.5px] text-ink-soft">{card.itemsSummary}</span>}

      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-1 rounded bg-[#E7F7F1] px-1.5 py-0.5 font-mono text-[10.5px] font-black text-brand"
          title={o.card.securityCode}
        >
          <KeyIcon />
          {getOrderSecurityCode(card.ref, card.securityCode)}
        </span>
        <span className="text-sm font-black text-ink">{formatMoney(card.totalCents, currency)}</span>
      </div>

      {owed && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-owed-bg px-2.5 py-1.5">
          <span className="text-[12px] font-extrabold text-owed-text">{o.card.owed(formatMoney(card.owedCents, currency))}</span>
          {canMarkPaid && (
            <button
              type="button"
              onClick={onSettle}
              className="h-7 shrink-0 cursor-pointer rounded-lg bg-white px-2 text-[10.5px] font-extrabold text-brand active:scale-95"
            >
              {o.card.markPaid}
            </button>
          )}
        </div>
      )}

      {/* Un message n'a de sens qu'une fois la commande accusée ; à la première
          étape, le marchand n'a encore rien à annoncer. */}
      {column !== "demand_acha" && column !== "pou_konfime" && column !== "metod_peman" && (
        <a
          href={messageHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-green text-[12px] font-extrabold text-white active:scale-[0.98]"
        >
          <WaIcon />
          <span className="truncate px-1">{sendLabel}</span>
        </a>
      )}

      {column === "sou_wout" && <DeliveryBlock card={card} businessName={props.businessName} currency={currency} />}
      {column === "livre" && card.deliveredWithCode && (
        <span className="w-fit rounded-full bg-[#E7F7F1] px-2 py-0.5 text-[10.5px] font-bold text-brand">✓ {o.delivery.withCode}</span>
      )}

      {column === "metod_peman" && (
        <div className="flex flex-col gap-1.5 border-t border-line/70 pt-2">
          <span className="text-[11px] font-bold text-ink-soft">{o.card.payMethodsTitle}</span>
          {activePayMethods.length === 0 ? (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">{o.card.noPayMethods}</span>
              <Link href="/reglaj" className="text-[11px] font-bold text-brand">
                {o.card.openSettings}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {activePayMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onInvoice("invoice", method.id)}
                  className="flex h-7 cursor-pointer items-center justify-center truncate rounded-lg border border-line bg-white px-1 text-[10px] font-bold text-ink active:scale-95"
                >
                  {method.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(column === "demand_acha" || column === "pou_konfime") && (
        <SecondaryButton onClick={() => onInvoice("invoice")} label={o.card.invoice} icon={<DocIcon />} />
      )}

      {isPaymentStage && <SecondaryButton onClick={() => onInvoice("receipt")} label={o.card.receipt} icon={<DocIcon />} />}

      {column === "swivi" && (
        <div className="flex flex-col gap-1.5 border-t border-line/70 pt-2">
          <div className="grid grid-cols-2 gap-1.5">
            <SecondaryButton onClick={onPromo} label={o.card.promo} />
            <SecondaryLink
              href={waMeLink(card.phone_e164, buildBackInStockMessage(card.customerName, props.businessName, card.itemsSummary, m))}
              label={o.card.backInStock}
            />
            <SecondaryLink
              href={waMeLink(card.phone_e164, buildSatisfactionMessage(card.customerName, props.businessName, m))}
              label={o.card.satisfaction}
            />
            <SecondaryButton onClick={() => onInvoice("receipt")} label={o.card.receipt} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-brand/40 bg-[#E7F7F1] text-[10.5px] font-extrabold text-brand active:scale-95"
          >
            {o.card.archive}
          </button>
        </div>
      )}

      {canAdvance && (
        <button
          type="button"
          onClick={onAdvance}
          className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#EEF5F2] text-[12.5px] font-extrabold text-brand-dark active:scale-[0.98]"
        >
          {o.card.advance(c.statuses[PIPELINE_COLUMNS[PIPELINE_COLUMNS.indexOf(card.status) + 1]])}
        </button>
      )}
    </article>
  );
}

/**
 * Livraison d'une commande en route : livreur, fiche envoyée au livreur,
 * lien de suivi pour le client, validation par le code du client.
 */
function DeliveryBlock({ card, businessName, currency }: { card: PipelineCard; businessName: string; currency: Currency }) {
  const o = useDict(ORDERS_COPY);
  const d = o.delivery;
  const [editing, setEditing] = useState(!card.courierName);
  const [name, setName] = useState(card.courierName ?? "");
  const [phone, setPhone] = useState(card.courierPhone ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const trackLink = card.trackingToken ? `${origin}/suivi/${card.trackingToken}` : null;
  const errorText = (e?: string) => (e === "badCode" ? d.badCode : e === "forbidden" ? d.forbidden : e === "migration" ? d.migration : o.errors.move);

  function saveCourier() {
    setError(null);
    start(async () => {
      const res = await setCourier(card.id, name, phone);
      if (res.ok) setEditing(false);
      else setError(errorText(res.error));
    });
  }

  function validate() {
    setError(null);
    start(async () => {
      const res = await confirmDeliveryWithCode(card.id, code);
      if (!res.ok) setError(errorText(res.error));
      else window.location.reload();
    });
  }

  const courierText = d.courierMessage({
    shop: businessName,
    ref: card.ref,
    customer: card.customerName,
    phone: card.phone_e164,
    address: card.deliveryAddr ?? "",
    items: card.itemsSummary,
    collect: card.owedCents > 0 ? formatMoney(card.owedCents, currency) : null,
  });
  const trackText = trackLink
    ? d.trackMessage({ customer: card.customerName, ref: card.ref, shop: businessName, link: trackLink, courier: card.courierName ?? (name || null) })
    : null;
  const input = "h-8 w-full rounded-lg border border-line bg-white px-2 text-[12px] text-ink outline-none focus:border-brand";

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-[#F7F8F9] p-2">
      <span className="text-[11px] font-extrabold uppercase text-ink-soft">🛵 {d.title}</span>

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={d.name} aria-label={d.name} maxLength={60} className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={d.phone} aria-label={d.phone} inputMode="tel" className={input} />
          <button type="button" onClick={saveCourier} disabled={pending || !name.trim()} className="h-8 cursor-pointer rounded-lg bg-brand text-[11.5px] font-extrabold text-white disabled:opacity-50">
            {d.save}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[12px] font-bold text-ink">
            {name}
            {phone ? <span className="font-medium text-ink-muted"> · {phone}</span> : null}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="shrink-0 cursor-pointer text-[11px] font-bold text-brand">
            {d.edit}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-1">
        {!editing && phone && (
          <a href={waMeLink(phone, courierText)} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-line bg-white text-[11.5px] font-bold text-ink">
            {d.sheet}
          </a>
        )}
        {trackText && card.phone_e164 && (
          <a href={waMeLink(card.phone_e164, trackText)} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-line bg-white text-[11.5px] font-bold text-ink">
            {d.track}
          </a>
        )}
      </div>

      <div className="flex gap-1">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="••••"
          aria-label={d.code}
          className={`${input} w-20 shrink-0 text-center font-mono tracking-widest`}
        />
        <button type="button" onClick={validate} disabled={pending || code.length !== 4} className="h-8 flex-1 cursor-pointer rounded-lg bg-brand-green px-2 text-[11.5px] font-extrabold text-white disabled:opacity-50">
          {pending ? d.validating : d.validate}
        </button>
      </div>

      {error && <span className="text-[11px] font-semibold text-[#C0392B]">{error}</span>}
    </div>
  );
}

function SecondaryButton({ onClick, label, icon }: { onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 cursor-pointer items-center justify-center gap-1 truncate rounded-lg border border-line bg-white px-1.5 text-[10.5px] font-bold text-ink active:scale-95"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-8 items-center justify-center gap-1 truncate rounded-lg border border-line bg-white px-1.5 text-[10.5px] font-bold text-ink active:scale-95"
    >
      <span className="truncate">{label}</span>
    </a>
  );
}

/* ---------- Message promo ---------- */

function PromoModal({
  customerName,
  customerPhone,
  businessName,
  businessSlug,
  initialPromoText,
  onClose,
}: {
  customerName: string;
  customerPhone: string;
  businessName: string;
  businessSlug: string;
  initialPromoText?: string | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const o = useDict(ORDERS_COPY);
  const c = useDict(COMMON_COPY);
  const m = MESSAGE_COPY[language] ?? MESSAGE_COPY.fr;

  const [body, setBody] = useState(initialPromoText?.trim() || m.promoDefault(businessName));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Le lien part du domaine réellement servi : en test comme en production, il
  // pointe vers la vitrine que le client va ouvrir.
  const storefrontUrl = typeof window === "undefined" ? `/b/${businessSlug}` : `${window.location.origin}/b/${businessSlug}`;
  const fullMessage = `${m.promoGreeting(customerName)}\n\n${body}\n👉 ${storefrontUrl}`;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files).slice(0, 3);
    const resized = await Promise.all(picked.map((f: File) => scaleImage(f, 1200)));
    setFiles(resized);
    setPreviews(resized.map((f) => URL.createObjectURL(f)));
  }

  async function send() {
    if (files.length > 0 && navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, title: businessName, text: fullMessage });
        onClose();
        return;
      } catch {
        /* partage annulé : on continue vers WhatsApp */
      }
    }
    if (files.length > 0) {
      files.forEach((file, i) => {
        const link = document.createElement("a");
        link.download = `promo-${i + 1}-${file.name}`;
        link.href = URL.createObjectURL(file);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
    window.open(waMeLink(customerPhone, fullMessage), "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-extrabold text-ink">{o.promoModal.title}</h2>
          <button type="button" onClick={onClose} aria-label={c.actions.close} className="cursor-pointer font-bold text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold text-ink-muted">{o.promoModal.text}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[110px] w-full rounded-2xl border border-line p-3 text-xs font-medium text-ink outline-none focus:border-brand"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold text-ink-muted">
            {o.promoModal.photos} <span className="font-medium">· {o.promoModal.photosHint}</span>
          </span>
          <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-[#F8FAFC] text-xs font-bold text-ink-soft hover:bg-gray-50">
            <span>{files.length > 0 ? o.promoModal.chosen(files.length) : o.promoModal.photos}</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
          {previews.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-14 w-14 rounded-xl border border-line object-contain" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-[#F3F8F6] p-2.5 text-[11.5px]">
          <span className="font-extrabold text-ink-soft">{o.promoModal.linkPreview}</span>
          <span className="truncate font-bold text-brand">{storefrontUrl}</span>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-11 flex-1 cursor-pointer rounded-2xl border border-line text-xs font-bold text-ink-muted active:scale-95">
            {c.actions.cancel}
          </button>
          <button
            type="button"
            onClick={send}
            className="flex h-11 flex-[2] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-green text-xs font-extrabold text-white active:scale-95"
          >
            <WaIcon />
            {o.promoModal.send}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Icônes ---------- */

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M14 9l2 2" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
