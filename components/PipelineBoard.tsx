"use client";

import { useState, useRef, useTransition } from "react";
import { moveOrderStatus } from "@/app/komand/actions";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import {
  buildDebtReminder,
  buildStatusMessage,
  buildBackInStockMessage,
  buildSatisfactionMessage,
  buildContactPaymentMessage,
  buildConfirmPaymentMessage,
  statusMessageLabel,
  getOrderSecurityCode,
} from "@/lib/order";
import { PIPELINE_COLUMNS, ORDER_STATUS_LABEL, type Currency, type OrderStatus, type PayMethod, type PipelineCard } from "@/lib/types";
import { InvoiceModal } from "@/components/InvoiceModal";
import { resizeImageTo600x900 } from "@/lib/image";
import { getActivePayMethods } from "@/lib/bank";
import { getRolePermissions } from "@/lib/rbac";

// Couleurs de pastille par étape du Pipeline
const DOT: Record<OrderStatus, string> = {
  demand_acha: "#06B6D4", // Bleu Turquoise
  kontak: "#94A3B8",      // Blanc / Gris clair
  metod_peman: "#EF4444", // Rouge
  konfime_peman: "#2563EB", // Bleu
  sou_wout: "#8B5CF6",    // Mauve / Violet
  livre: "#10B981",       // Vert
  swivi: "#6B7280",       // Gris
  anile: "#9CA3AF",
  pou_konfime: "#06B6D4",
  peye: "#2563EB",
};

const COLUMN_BADGE_STYLE: Record<OrderStatus, string> = {
  demand_acha: "bg-cyan-100 text-cyan-950 border border-cyan-300",
  kontak: "bg-slate-100 text-slate-900 border border-slate-300",
  metod_peman: "bg-red-100 text-red-950 border border-red-300",
  konfime_peman: "bg-blue-100 text-blue-950 border border-blue-300",
  sou_wout: "bg-purple-100 text-purple-900 border border-purple-300/80",
  livre: "bg-emerald-100 text-emerald-900 border border-emerald-300/80",
  swivi: "bg-gray-200 text-gray-800 border border-gray-300/80",
  anile: "bg-gray-100 text-gray-700",
  pou_konfime: "bg-cyan-100 text-cyan-950 border border-cyan-300",
  peye: "bg-blue-100 text-blue-950 border border-blue-300",
};

// Styles thématiques complets des Cartes pour chaque colonne
const CARD_THEME: Record<
  OrderStatus,
  {
    cardBg: string;
    border: string;
    waBtnBg: string;
    priceText: string;
    advanceBg: string;
    advanceText: string;
  }
> = {
  demand_acha: {
    cardBg: "bg-[#ECFEFF]",
    border: "border-cyan-400/90",
    waBtnBg: "bg-[#0891B2] hover:bg-[#0E7490]",
    priceText: "text-[#0E7490]",
    advanceBg: "bg-cyan-200/90 hover:bg-cyan-300",
    advanceText: "text-cyan-950 font-black",
  },
  kontak: {
    cardBg: "bg-[#FFFFFF]",
    border: "border-slate-300",
    waBtnBg: "bg-[#334155] hover:bg-[#1E293B]",
    priceText: "text-slate-900",
    advanceBg: "bg-slate-100 hover:bg-slate-200 border border-slate-300",
    advanceText: "text-slate-950 font-black",
  },
  metod_peman: {
    cardBg: "bg-[#FEF2F2]",
    border: "border-red-400/90",
    waBtnBg: "bg-[#DC2626] hover:bg-[#B91C1C]",
    priceText: "text-[#B91C1C]",
    advanceBg: "bg-red-200/90 hover:bg-red-300",
    advanceText: "text-red-950 font-black",
  },
  konfime_peman: {
    cardBg: "bg-[#EFF6FF]",
    border: "border-blue-400/90",
    waBtnBg: "bg-[#2563EB] hover:bg-[#1D4ED8]",
    priceText: "text-[#1D4ED8]",
    advanceBg: "bg-blue-200/90 hover:bg-blue-300",
    advanceText: "text-blue-950 font-black",
  },
  sou_wout: {
    cardBg: "bg-[#F9F5FF]",
    border: "border-purple-300/90",
    waBtnBg: "bg-[#8B5CF6] hover:bg-[#7C3AED]",
    priceText: "text-[#6D28D9]",
    advanceBg: "bg-purple-100/90 hover:bg-purple-200",
    advanceText: "text-purple-950 font-extrabold",
  },
  livre: {
    cardBg: "bg-[#F0FDF4]",
    border: "border-emerald-300/90",
    waBtnBg: "bg-[#059669] hover:bg-[#047857]",
    priceText: "text-[#047857]",
    advanceBg: "bg-emerald-100/90 hover:bg-emerald-200",
    advanceText: "text-emerald-950 font-extrabold",
  },
  swivi: {
    cardBg: "bg-[#F8FAFC]",
    border: "border-slate-300/90",
    waBtnBg: "bg-[#4B5563] hover:bg-[#374151]",
    priceText: "text-[#374151]",
    advanceBg: "bg-slate-200/90 hover:bg-slate-300",
    advanceText: "text-slate-900 font-extrabold",
  },
  anile: {
    cardBg: "bg-gray-50",
    border: "border-gray-200",
    waBtnBg: "bg-gray-400",
    priceText: "text-gray-500",
    advanceBg: "bg-gray-100",
    advanceText: "text-gray-500",
  },
  pou_konfime: {
    cardBg: "bg-[#ECFEFF]",
    border: "border-cyan-400/90",
    waBtnBg: "bg-[#0891B2] hover:bg-[#0E7490]",
    priceText: "text-[#0E7490]",
    advanceBg: "bg-cyan-200/90 hover:bg-cyan-300",
    advanceText: "text-cyan-950 font-black",
  },
  peye: {
    cardBg: "bg-[#EFF6FF]",
    border: "border-blue-400/90",
    waBtnBg: "bg-[#2563EB] hover:bg-[#1D4ED8]",
    priceText: "text-[#1D4ED8]",
    advanceBg: "bg-blue-200/90 hover:bg-blue-300",
    advanceText: "text-blue-950 font-black",
  },
};

export function PipelineBoard({
  initial,
  businessName,
  businessLogoUrl,
  businessPhone,
  businessSlogan,
  businessSlug = "ti-kok-boutik",
  businessPromoText,
  businessCurrency = "HTG",
  businessUsdExchangeRate = 132.5,
  businessBankAccounts,
  businessZelleInfo,
  businessUsdtAddress,
  businessMoncashNumber,
  businessMoncashName,
  businessMoncashQrUrl,
  businessNatcashNumber,
  businessNatcashName,
  businessNatcashQrUrl,
  businessZelleQrUrl,
  businessUsdtQrUrl,
  userSession,
  businessPlan = "gratis",
}: {
  initial: PipelineCard[];
  userSession?: { full_name: string; role: "owner" | "agent"; specialty?: string; agentId?: string };
  businessPlan?: string;
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
}) {
  const [cards, setCards] = useState<PipelineCard[]>(initial);
  const [activeModal, setActiveModal] = useState<{ card: PipelineCard; type: "devis" | "facture"; payMethod?: PayMethod } | null>(null);
  const [promoModalCard, setPromoModalCard] = useState<PipelineCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "rupture" | "dette">("all");
  const permissions = userSession ? getRolePermissions(userSession) : null;
  const canSwitchRoleFilter = permissions ? permissions.canSwitchPipelineAgentFilter : true;
  const defaultAgentFilter = userSession?.agentId && userSession.agentId !== "andro" ? userSession.agentId : "all";
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>(defaultAgentFilter);
  const [, startTransition] = useTransition();
  const boardRef = useRef<HTMLDivElement>(null);

  const visibleColumns = PIPELINE_COLUMNS.filter((col) => {
    if (!canSwitchRoleFilter && permissions) {
      return permissions.allowedPipelineColumns.includes(col);
    }
    if (selectedAgentFilter === "marie") return col === "konfime_peman";
    if (selectedAgentFilter === "jean") return ["demand_acha", "kontak", "metod_peman"].includes(col);
    if (selectedAgentFilter === "pierre") return ["sou_wout", "livre"].includes(col);
    if (selectedAgentFilter === "florence") return ["swivi"].includes(col);
    return true;
  });

  // Détections dynamiques des méthodes de paiement activées par le marchand
  const activePayMethods = getActivePayMethods({
    phone_e164: businessPhone,
    bank_accounts: businessBankAccounts,
    zelle_info: businessZelleInfo,
    usdt_trc20_address: businessUsdtAddress,
    moncash_number: businessMoncashNumber,
    moncash_name: businessMoncashName,
    natcash_number: businessNatcashNumber,
    natcash_name: businessNatcashName,
  });

  const ruptureCount = cards.filter((c) => c.badge?.toLowerCase().includes("rupture")).length;
  const detteCount = cards.filter((c) => c.owedCents > 0).length;

  const filteredCards = cards.filter((c) => {
    if (activeFilter === "rupture") return c.badge?.toLowerCase().includes("rupture");
    if (activeFilter === "dette") return c.owedCents > 0;
    return true;
  });

  function advance(card: PipelineCard) {
    const idx = PIPELINE_COLUMNS.indexOf(card.status);
    if (idx < 0 || idx >= PIPELINE_COLUMNS.length - 1) return;
    const next = PIPELINE_COLUMNS[idx + 1];
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, status: next } : c))); // optimiste
    startTransition(() => {
      moveOrderStatus(card.id, next);
    });
  }

  function handleClearDebt(cardId: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, owedCents: 0, badge: "✅ Dèt Solde" } : c)),
    );
  }

  function handleSetDebt(cardId: string) {
    const val = prompt("Antre montan dèt la ke kliyan an dwe an Gourdes HTG (ekzanp: 600) :");
    if (val === null) return;
    const amountHtg = parseFloat(val);
    if (isNaN(amountHtg) || amountHtg <= 0) return;
    const owedCents = Math.round(amountHtg * 100);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, owedCents, badge: `Dèt ${amountHtg} HTG` } : c)),
    );
  }

  function handleEditBadge(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const val = prompt(
      `Antre yon badge pou kat kòmand #${card.ref} (ekzanp: VIP, → Jean, Ranmase Store, MonCash 8842) :`,
      card.badge || "",
    );
    if (val === null) return;
    const badge = val.trim() || undefined;
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, badge } : c)));
  }

  function archiveCard(card: PipelineCard) {
    setCards((cs) =>
      cs.map((c) =>
        c.id === card.id ? { ...c, badge: "✅ Tranzaksyon Fini / Achive" } : c,
      ),
    );
  }

  function scrollLeft() {
    boardRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  }

  function scrollRight() {
    boardRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-2">
      {businessPlan.toLowerCase() === "gratis" && (
        <div className="mx-4 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 p-3.5 text-white shadow-md border border-emerald-500/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black text-xl">
              👑
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-amber-300">MODALITE PLAN GRATIS :</span>
              <p className="text-xs text-slate-200">
                Pase sou <strong className="text-emerald-300">Plan Pro (750 HTG/mwa)</strong> oswa <strong className="text-emerald-300">Premium</strong> pou debloke tout opsyon Pipeline ak Relans Otomatik sou WhatsApp.
              </p>
            </div>
          </div>
          <a
            href="/abonman"
            className="shrink-0 rounded-xl bg-brand-green px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-600 transition-all cursor-pointer text-center"
          >
            🚀 Upgrade Plan
          </a>
        </div>
      )}

      {/* Barre d'outils supérieure : Filtres Rapides & Flèches de Direction */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-1">
        {/* Chips de filtre rapide */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeFilter === "all" ? "bg-brand text-white shadow-sm" : "bg-white border border-line text-ink-muted"
            }`}
          >
            Tout ({cards.length})
          </button>
          <button
            onClick={() => setActiveFilter("rupture")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeFilter === "rupture"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            ⚠️ Rupture stok ({ruptureCount})
          </button>
          <button
            onClick={() => setActiveFilter("dette")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeFilter === "dette"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-amber-50 border border-amber-200 text-amber-900"
            }`}
          >
            💸 Dèt ({detteCount})
          </button>
        </div>

        {/* Flèches de navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="flex h-8 items-center gap-1 rounded-xl border border-line bg-white px-3 text-xs font-extrabold text-ink shadow-sm active:scale-95 cursor-pointer"
            title="Navige a gòch (Pou konfime / Peye / Sou wout)"
          >
            <span>‹ Gòch</span>
          </button>
          <button
            onClick={scrollRight}
            className="flex h-8 items-center gap-1 rounded-xl border border-line bg-[#008069] px-3 text-xs font-extrabold text-white shadow-sm active:scale-95 cursor-pointer"
            title="Navige a dwat (Livre / Swivi)"
          >
            <span>Dwat ›</span>
          </button>
        </div>
      </div>

      {/* Selector Ròl Ajan (UNIQUEMENT VISIBLE POUR L'ADMINISTRATEUR / OWNER) */}
      {canSwitchRoleFilter ? (
        <div className="flex flex-col gap-2 px-4 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-white border border-brand/20 p-2 shadow-2xs">
            <span className="text-[11.5px] font-extrabold text-ink pr-1 shrink-0">👁️ Filtre pa Ròl Ajan (Admin View) :</span>
            <button
              onClick={() => setSelectedAgentFilter("all")}
              className={`rounded-xl px-2.5 py-1 text-[11.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                selectedAgentFilter === "all" ? "bg-brand text-white shadow-2xs" : "bg-gray-100 text-ink-muted hover:bg-gray-200"
              }`}
            >
              👑 Tout Etap (Admin)
            </button>
            <button
              onClick={() => setSelectedAgentFilter("marie")}
              className={`rounded-xl px-2.5 py-1 text-[11.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                selectedAgentFilter === "marie" ? "bg-blue-600 text-white shadow-2xs" : "bg-blue-50 text-blue-900 border border-blue-200"
              }`}
            >
              💳 Caissier (Konfime Pèman)
            </button>
            <button
              onClick={() => setSelectedAgentFilter("jean")}
              className={`rounded-xl px-2.5 py-1 text-[11.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                selectedAgentFilter === "jean" ? "bg-slate-800 text-white shadow-2xs" : "bg-slate-100 text-slate-900 border border-slate-200"
              }`}
            >
              💬 Commercial (Kontak & Vant)
            </button>
            <button
              onClick={() => setSelectedAgentFilter("pierre")}
              className={`rounded-xl px-2.5 py-1 text-[11.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                selectedAgentFilter === "pierre" ? "bg-purple-600 text-white shadow-2xs" : "bg-purple-50 text-purple-900 border border-purple-200"
              }`}
            >
              📦 Livreur (Sou Wout & Livre)
            </button>
            <button
              onClick={() => setSelectedAgentFilter("florence")}
              className={`rounded-xl px-2.5 py-1 text-[11.5px] font-extrabold transition-all cursor-pointer shrink-0 ${
                selectedAgentFilter === "florence" ? "bg-amber-600 text-white shadow-2xs" : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              🏷️ Sèvis Kliyan (Swivi & Dèt)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 pt-1">
          <div className="flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-200/90 px-3.5 py-2 text-xs font-extrabold text-blue-950 shadow-2xs">
            <span>🔒 Espas Pipeline Spécifik — Dwa Aksè {userSession?.specialty || "Ajan"} (Gade sèlman etap pa w yo)</span>
          </div>
        </div>
      )}

      {/* Conteneur Kanban défilant horizontalement */}
      <div
        ref={boardRef}
        className="flex gap-3.5 overflow-x-auto px-3.5 pb-24 pt-1 [scrollbar-width:thin] scroll-smooth"
      >
        {visibleColumns.map((col) => {
          const colCards = filteredCards.filter((c) => c.status === col);
          const theme = CARD_THEME[col];

          return (
            <div key={col} className="flex w-[295px] shrink-0 snap-start flex-col gap-2.5">
              {/* Entête d'étape avec Pastille de Couleur Dédiée */}
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shadow-sm ring-2 ring-white"
                    style={{ background: DOT[col] }}
                  />
                  <span className="text-sm font-extrabold tracking-tight">{ORDER_STATUS_LABEL[col]}</span>
                </div>
                <span className={`rounded-xl px-2.5 py-0.5 text-xs font-extrabold ${COLUMN_BADGE_STYLE[col]}`}>
                  {colCards.length}
                </span>
              </div>

              {/* Liste des Cartes de la colonne avec thème couleur par colonne */}
              {colCards.map((card) => {
                const owed = card.owedCents > 0;
                const isRupture = card.badge?.toLowerCase().includes("rupture");
                const relanceHref = waMeLink(
                  card.phone_e164,
                  buildDebtReminder(card.customerName, card.owedCents, card.currency ?? "HTG", businessName),
                );
                const msgHref = waMeLink(
                  card.phone_e164,
                  buildStatusMessage(card.status, {
                    business: businessName,
                    name: card.customerName,
                    ref: card.ref,
                    totalCents: card.totalCents,
                  }),
                );
                const canAdvance = PIPELINE_COLUMNS.indexOf(card.status) < PIPELINE_COLUMNS.length - 1;

                return (
                  <div
                    key={card.id}
                    className={`flex flex-col gap-2 rounded-2xl p-3.5 shadow-[0_2px_10px_rgba(17,27,33,0.06)] border ${theme.cardBg} ${theme.border}`}
                    style={
                      isRupture
                        ? { borderLeft: "4px solid #DC2626" }
                        : owed
                        ? { borderLeft: "4px solid #B25E09" }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-ink truncate">{card.customerName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-950 border border-emerald-300/80 font-mono shadow-2xs" title="Kòd sekirite livrezon / ranmase nan boutik">
                          🔑 {getOrderSecurityCode(card.ref, card.securityCode)}
                        </span>
                        <span className="text-[11px] font-semibold text-ink-faint">#{card.ref}</span>
                      </div>
                    </div>
                    {card.itemsSummary && (
                      <span className="text-[12.5px] text-ink-soft truncate">{card.itemsSummary}</span>
                    )}

                    {owed ? (
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[12px] font-extrabold text-owed-text">
                          Dwe {formatMoney(card.owedCents)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearDebt(card.id)}
                          className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[10.5px] font-extrabold text-emerald-950 border border-emerald-300 active:scale-95 cursor-pointer hover:bg-emerald-100 shadow-2xs"
                          title="Klire dèt sa a epi solde li kòm peye an antye"
                        >
                          <span>✓ Regle Dèt</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleEditBadge(card.id)}
                            className={`rounded-md px-2 py-0.5 text-[10.5px] font-extrabold cursor-pointer active:scale-95 transition-colors shrink-0 ${
                              isRupture
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : card.badge
                                ? "bg-white/90 border border-line text-ink hover:bg-gray-100"
                                : "bg-gray-100 text-ink-muted border border-dashed border-line hover:bg-gray-200"
                            }`}
                            title="Chanje oswa ajoute yon badge pou kat sa a"
                          >
                            {card.badge ? card.badge : "+ Badge"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetDebt(card.id)}
                            className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-950 border border-amber-300 active:scale-95 cursor-pointer hover:bg-amber-100 shadow-2xs shrink-0"
                            title="Mete yon dèt oswa avans sou kòmand sa a"
                          >
                            + Ajoute Dèt
                          </button>
                        </div>
                        <span className={`text-sm font-black ${theme.priceText} shrink-0`}>
                          {formatMoney(card.totalCents)}
                        </span>
                      </div>
                    )}

                    {/* Actions spécifiques selon la colonne du Pipeline */}

                    {/* 1. Demand Acha : AUCUN bouton WhatsApp intermédiaire */}
                    {col !== "demand_acha" && col !== "pou_konfime" && col !== "metod_peman" && (
                      <a
                        href={
                          col === "kontak"
                            ? waMeLink(
                                card.phone_e164,
                                buildContactPaymentMessage(card.customerName, card.ref, formatMoney(card.totalCents), activePayMethods, businessUsdtAddress, card.securityCode),
                              )
                            : col === "konfime_peman" || col === "peye"
                            ? waMeLink(
                                card.phone_e164,
                                buildConfirmPaymentMessage(card.customerName, card.ref, businessName),
                              )
                            : owed
                            ? relanceHref
                            : msgHref
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-0.5 flex h-9 items-center justify-center gap-1.5 rounded-xl shadow-sm active:scale-98 transition-colors ${theme.waBtnBg}`}
                      >
                        <WaIcon />
                        <span className="text-[12px] font-extrabold text-white">
                          {col === "kontak"
                            ? "Akize resepsyon - Metod pèman"
                            : col === "konfime_peman" || col === "peye"
                            ? "Konfime Pèman"
                            : owed
                            ? "Relanse pou dèt"
                            : statusMessageLabel(card.status)}
                        </span>
                      </a>
                    )}

                    {/* 2. Pou Konfime : Bouton Facture */}
                    {col === "pou_konfime" && (
                      <div className="pt-1.5 border-t border-line/60">
                        <button
                          onClick={() => setActiveModal({ card, type: "devis" })}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line/80 bg-white text-[11px] font-bold text-ink active:scale-95 cursor-pointer shadow-2xs"
                          title="Jenerè Fakti ak QR Code MonCash & Natcash"
                        >
                          <span>📋 Fakti</span>
                        </button>
                      </div>
                    )}

                    {/* 3. Mwayen Peman : Label + Boutons dynamiques SEULEMENT des méthodes activées */}
                    {col === "metod_peman" && (
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-red-200">
                        <span className="text-[11px] font-black text-red-950 uppercase tracking-tight">
                          Voye Fakti pou metod kliyan chwazi a :
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          {activePayMethods.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setActiveModal({ card, type: "devis", payMethod: m.id })}
                              className="flex h-7 items-center justify-center rounded-lg border border-red-300 bg-white text-[10px] font-black text-red-900 shadow-2xs hover:bg-red-100 active:scale-95 cursor-pointer truncate px-0.5"
                            >
                              <span>{m.label.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Konfime Peman : Bouton Resi */}
                    {(col === "konfime_peman" || col === "peye") && (
                      <div className="pt-1.5 border-t border-line/60">
                        <button
                          onClick={() => setActiveModal({ card, type: "facture" })}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-white text-[11px] font-extrabold text-blue-950 active:scale-95 cursor-pointer shadow-2xs"
                          title="Jenerè Resi Ofisyèl Pèman"
                        >
                          <span>📄 Resi</span>
                        </button>
                      </div>
                    )}

                    {col === "swivi" && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
                        {/* Rangée 1: Action Promosyon & Stok Disponib */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* Bouton Promosyon Nouvo Pwodwi (ouvre le modal d'édition rapide avec lien vitrine) */}
                          <button
                            onClick={() => setPromoModalCard(card)}
                            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-pink-300 bg-pink-50 text-[10.5px] font-extrabold text-pink-950 active:scale-95 cursor-pointer shadow-2xs hover:bg-pink-100 truncate px-1"
                            title="Ouvri edite ak voye mesay promosyon pa WhatsApp ak lyen vitrin"
                          >
                            <span>📣 Promo Pwodwi</span>
                          </button>

                          {/* Bouton d'alerte Pwodwi disponib nan stok */}
                          <a
                            href={waMeLink(
                              card.phone_e164,
                              buildBackInStockMessage(card.customerName, businessName, card.itemsSummary),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 text-[10.5px] font-extrabold text-purple-950 active:scale-95 cursor-pointer shadow-2xs hover:bg-purple-100 truncate px-1"
                            title="Nofié kliyan an ke pwodwi ki te fini an disponib kounye a"
                          >
                            <span>🔔 Stok disponib</span>
                          </a>
                        </div>

                        {/* Rangée 2: Satisfaksyon & Documents */}
                        <div className="grid grid-cols-3 gap-1">
                          <a
                            href={waMeLink(
                              card.phone_e164,
                              buildSatisfactionMessage(card.customerName, businessName),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 items-center justify-center gap-0.5 rounded-lg border border-amber-300 bg-amber-50 text-[10px] font-extrabold text-amber-950 active:scale-95 cursor-pointer shadow-2xs hover:bg-amber-100 truncate px-0.5"
                            title="Mande si kliyan an satisfè"
                          >
                            <span>⭐ Satisfè</span>
                          </a>
                          <button
                            onClick={() => setActiveModal({ card, type: "devis" })}
                            className="flex h-8 items-center justify-center gap-0.5 rounded-lg border border-line/80 bg-white text-[10px] font-bold text-ink active:scale-95 cursor-pointer shadow-2xs"
                            title="Jenerè Fakti"
                          >
                            <span>📋 Fakti</span>
                          </button>
                          <button
                            onClick={() => setActiveModal({ card, type: "facture" })}
                            className="flex h-8 items-center justify-center gap-0.5 rounded-lg border border-line/80 bg-white text-[10px] font-extrabold text-ink active:scale-95 cursor-pointer shadow-2xs"
                            title="Jenerè Resi"
                          >
                            <span>📄 Resi</span>
                          </button>
                        </div>

                        {/* Rangée 3: Bouton de clôture & archivage de la transaction */}
                        <button
                          onClick={() => archiveCard(card)}
                          className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-emerald-400 bg-emerald-100 text-[10.5px] font-extrabold text-emerald-950 shadow-2xs active:scale-95 cursor-pointer hover:bg-emerald-200"
                          title="Kloti epi achive kòmand sa a"
                        >
                          <span>✅ Tranzaksyon Fini / Achive</span>
                        </button>
                      </div>
                    )}

                    {canAdvance && (
                      <button
                        onClick={() => advance(card)}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-xl active:scale-[0.98] cursor-pointer transition-colors ${theme.advanceBg} ${theme.advanceText}`}
                      >
                        <span className="text-[12.5px]">
                          Deplase → {ORDER_STATUS_LABEL[PIPELINE_COLUMNS[PIPELINE_COLUMNS.indexOf(card.status) + 1]]}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}

              {colCards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-ink-faint">
                  Vid
                </div>
              )}
            </div>
          );
        })}
        <div className="w-1 shrink-0" />
      </div>

      {/* Modal Fakti & Resi */}
      {activeModal && (
        <InvoiceModal
          card={activeModal.card}
          type={activeModal.type}
          initialPayMethod={activeModal.payMethod}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          businessPhone={businessPhone}
          businessSlogan={businessSlogan}
          businessCurrency={businessCurrency}
          usdExchangeRate={businessUsdExchangeRate}
          bankAccounts={businessBankAccounts}
          zelleInfo={businessZelleInfo}
          usdtAddress={businessUsdtAddress}
          moncashNumber={businessMoncashNumber}
          moncashName={businessMoncashName}
          moncashQrUrl={businessMoncashQrUrl}
          natcashNumber={businessNatcashNumber}
          natcashName={businessNatcashName}
          natcashQrUrl={businessNatcashQrUrl}
          zelleQrUrl={businessZelleQrUrl}
          usdtQrUrl={businessUsdtQrUrl}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Modal d'Édition Rapide de Promosyon */}
      {promoModalCard && (
        <PromoModal
          customerName={promoModalCard.customerName}
          customerPhone={promoModalCard.phone_e164}
          businessName={businessName}
          businessSlug={businessSlug}
          initialPromoText={businessPromoText}
          onClose={() => setPromoModalCard(null)}
        />
      )}
    </div>
  );
}

// Mini Modal d'Édition du Message Promo avec sélection de 1 à 3 photos de produits
function PromoModal({
  customerName,
  customerPhone,
  businessName,
  businessSlug = "ti-kok-boutik",
  initialPromoText,
  onClose,
}: {
  customerName: string;
  customerPhone: string;
  businessName: string;
  businessSlug?: string;
  initialPromoText?: string | null;
  onClose: () => void;
}) {
  const defaultText = initialPromoText?.trim()
    ? initialPromoText.trim()
    : `🔥 *NOUVO PWODWI AK PROMOSYON NAN ${businessName.toUpperCase()}!* 🔥\n\nNou fèk resevwa nouvo pwodwi ak bèl rabi nan boutik la! 🎁\n\nVini vizite vitrin nou an kounye a sou lyen sa a:`;

  const [customBody, setCustomBody] = useState(defaultText);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const storefrontUrl = `https://converza.app/b/${businessSlug}`;
  const fullMessage = `Bonjou ${customerName} 👋\n\n${customBody}\n👉 ${storefrontUrl}`;
  const waHref = waMeLink(customerPhone, fullMessage);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files).slice(0, 3); // Max 3 photos
    const resizedFiles = await Promise.all(filesArray.map((f) => resizeImageTo600x900(f)));
    setSelectedFiles(resizedFiles);
    const urls = resizedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
  }

  async function handleSendWhatsApp() {
    // 1. Si Mobile (iPhone / Android) & Photos sélectionnées : partage direct avec fichiers joints + texte
    if (
      selectedFiles.length > 0 &&
      navigator.canShare &&
      navigator.canShare({ files: selectedFiles })
    ) {
      try {
        await navigator.share({
          files: selectedFiles,
          title: `Promosyon ${businessName}`,
          text: fullMessage,
        });
        onClose();
        return;
      } catch (err) {
        console.error("Erreur partage:", err);
      }
    }

    // 2. Si Desktop avec photos sélectionnées : télécharge les photos pour glisser-déposer facile
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file, index) => {
        const link = document.createElement("a");
        link.download = `Promo_Pwodwi_${index + 1}_${file.name}`;
        link.href = URL.createObjectURL(file);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // Ouvrir le chat WhatsApp
    window.open(waHref, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-pink-600">📣 Promo Pwodwi</span>
            <span className="text-xs font-bold text-ink-muted">({customerName})</span>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink font-bold cursor-pointer">✕</button>
        </div>

        {/* Zone d'édition du texte */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-extrabold text-ink-muted uppercase">
            1. Edite Tèks Promosyon an :
          </label>
          <textarea
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            className="w-full min-h-[100px] rounded-2xl border border-line p-3 text-xs font-medium text-ink outline-none focus:border-brand"
            placeholder="Ekri promosyon ou an la..."
          />
        </div>

        {/* Sélection des photos de produits (1 à 3 photos) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-extrabold text-ink-muted uppercase">
            2. Ajoute foto pwodwi yo (max 3 foto) :
          </label>
          <label className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-pink-300 bg-pink-50/70 text-pink-900 text-xs font-extrabold cursor-pointer hover:bg-pink-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>{selectedFiles.length > 0 ? `${selectedFiles.length} foto chwazi` : "📸 Chwazi 1 a 3 foto pwodwi"}</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {/* Aperçu des photos sélectionnées */}
          {previews.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {previews.map((src, idx) => (
                <div key={idx} className="relative h-14 w-14 overflow-hidden rounded-xl border border-line bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Aperçu ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-pink-50 p-2.5 text-[11.5px] border border-pink-200">
          <span className="font-extrabold text-pink-950">Apesi lyen vitrin ki ap ajoute otomatikman :</span>
          <span className="font-bold text-pink-700 underline truncate">👉 {storefrontUrl}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-line text-xs font-bold text-ink-muted active:scale-95 cursor-pointer"
          >
            Anile
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex-[2] flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-green text-xs font-extrabold text-white shadow-md active:scale-95 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>
            <span>Voye pa WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
    </svg>
  );
}
