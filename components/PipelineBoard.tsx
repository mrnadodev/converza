"use client";

import { useState, useTransition } from "react";
import { moveOrderStatus } from "@/app/komand/actions";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import { buildDebtReminder, buildStatusMessage, statusMessageLabel } from "@/lib/order";
import { PIPELINE_COLUMNS, ORDER_STATUS_LABEL, type OrderStatus, type PipelineCard } from "@/lib/types";

// Dégradé de verts : chaque étape du pipeline a son propre ton, du clair au profond.
const DOT: Record<OrderStatus, string> = {
  pou_konfime: "#66D2A6",
  peye: "#16B67C",
  livre: "#0E9E6B",
  swivi: "#0A7D55",
  anile: "#8696A0",
};

export function PipelineBoard({
  initial,
  businessName,
}: {
  initial: PipelineCard[];
  businessName: string;
}) {
  const [cards, setCards] = useState<PipelineCard[]>(initial);
  const [, startTransition] = useTransition();

  function advance(card: PipelineCard) {
    const idx = PIPELINE_COLUMNS.indexOf(card.status);
    if (idx < 0 || idx >= PIPELINE_COLUMNS.length - 1) return;
    const next = PIPELINE_COLUMNS[idx + 1];
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, status: next } : c))); // optimiste
    startTransition(() => {
      moveOrderStatus(card.id, next);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-3.5 pb-24 pt-4 [scrollbar-width:none]">
      {PIPELINE_COLUMNS.map((col) => {
        const colCards = cards.filter((c) => c.status === col);
        return (
          <div key={col} className="flex w-[288px] shrink-0 snap-start flex-col gap-2.5">
            <div className="flex items-center gap-2 px-0.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: DOT[col] }} />
              <span className="text-sm font-extrabold">{ORDER_STATUS_LABEL[col]}</span>
              <span className="rounded-[10px] bg-[#E7EBED] px-2 py-px text-xs font-bold text-ink-faint">
                {colCards.length}
              </span>
            </div>

            {colCards.map((card) => {
              const owed = card.owedCents > 0;
              const relanceHref = waMeLink(
                card.phone_e164,
                buildDebtReminder(card.customerName, card.owedCents),
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
                  className="flex flex-col gap-2 rounded-2xl bg-white p-[13px] shadow-[0_1px_4px_rgba(17,27,33,0.06)]"
                  style={owed ? { borderLeft: "3px solid #B25E09" } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{card.customerName}</span>
                    <span className="text-[11px] text-ink-faint">#{card.ref}</span>
                  </div>
                  {card.itemsSummary && (
                    <span className="text-[12.5px] text-ink-soft">{card.itemsSummary}</span>
                  )}

                  {owed ? (
                    <span className="text-[12px] font-semibold text-owed-text">
                      Dwe {formatMoney(card.owedCents)}
                    </span>
                  ) : (
                    <div className="flex items-center justify-between">
                      {card.badge ? (
                        <span className="rounded-md bg-[#E7F1FB] px-2 py-0.5 text-[10.5px] font-semibold text-[#1A6BB8]">
                          {card.badge}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="text-sm font-extrabold">{formatMoney(card.totalCents)}</span>
                    </div>
                  )}

                  {/* Message WhatsApp 1 clic (relance si dette, sinon message d'étape) */}
                  <a
                    href={owed ? relanceHref : msgHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex h-9 items-center justify-center gap-1.5 rounded-[9px] bg-brand-green"
                  >
                    <WaIcon />
                    <span className="text-[12.5px] font-bold text-white">
                      {owed ? "Relanse pou dèt" : statusMessageLabel(card.status)}
                    </span>
                  </a>

                  {canAdvance && (
                    <button
                      onClick={() => advance(card)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[9px] bg-[#E7F7F1] text-brand active:scale-[0.98]"
                    >
                      <span className="text-[12.5px] font-bold">
                        Deplase → {ORDER_STATUS_LABEL[PIPELINE_COLUMNS[PIPELINE_COLUMNS.indexOf(card.status) + 1]]}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}

            {colCards.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line py-6 text-center text-xs text-ink-faint">
                Vid
              </div>
            )}
          </div>
        );
      })}
      <div className="w-1 shrink-0" />
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
