"use client";

import { useState } from "react";
import { toPng, toBlob } from "html-to-image";
import { CvzMark } from "@/components/CvzMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useDict } from "@/components/LanguageContext";
import { INVOICE_COPY } from "@/lib/i18n/app/invoice";
import { parseBankAccounts } from "@/lib/bank";
import { formatMoney } from "@/lib/money";
import { getOrderSecurityCode } from "@/lib/order";
import { waMeLink } from "@/lib/whatsapp";
import type { Currency, PayMethod, PipelineCard } from "@/lib/types";

export interface InvoiceModalProps {
  card: PipelineCard;
  businessName: string;
  businessLogoUrl?: string | null;
  businessPhone?: string;
  businessAddress?: string;
  businessSlogan?: string | null;
  businessCurrency?: Currency;
  usdExchangeRate?: number | null;
  bankAccounts?: string | null;
  zelleInfo?: string | null;
  usdtAddress?: string | null;
  moncashNumber?: string | null;
  moncashName?: string | null;
  moncashQrUrl?: string | null;
  natcashNumber?: string | null;
  natcashName?: string | null;
  natcashQrUrl?: string | null;
  zelleQrUrl?: string | null;
  usdtQrUrl?: string | null;
  initialPayMethod?: PayMethod;
  type: "devis" | "facture";
  onClose: () => void;
}

interface InvoiceLine {
  name: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

/**
 * Lignes de la facture.
 * Quand la commande porte ses articles (cas normal), on les reprend tels quels.
 * Le repli ne sert qu'aux commandes qui n'ont qu'un résumé texte : il répartit
 * le total au prorata des quantités, ce qui reste une approximation.
 */
function invoiceLines(card: PipelineCard, deliveryFeeCents: number): InvoiceLine[] {
  if (card.items && card.items.length > 0) {
    return card.items.map((it) => ({
      name: it.name,
      qty: it.qty,
      unitPriceCents: it.unitPriceCents,
      totalCents: Math.round(it.unitPriceCents * it.qty),
    }));
  }

  const itemsTotalCents = Math.max(0, card.totalCents - deliveryFeeCents);
  const summary = card.itemsSummary?.trim() ?? "";
  if (!summary) return [];

  const parts = summary.split(/[·,]/).map((s) => s.trim()).filter(Boolean);
  const raw = parts.map((part) => {
    const match = part.match(/^(\d+)\s*[x×*]\s*(.+)$/i) || part.match(/^(\d+)\s+(.+)$/);
    return match ? { qty: Math.max(1, parseInt(match[1], 10) || 1), name: match[2].trim() } : { qty: 1, name: part };
  });
  const totalQty = raw.reduce((acc, it) => acc + it.qty, 0) || 1;

  return raw.map((it) => {
    const totalCents = Math.round((itemsTotalCents * it.qty) / totalQty);
    return { name: it.name, qty: it.qty, unitPriceCents: Math.round(totalCents / (it.qty || 1)), totalCents };
  });
}

export function InvoiceModal({
  card,
  businessName,
  businessLogoUrl,
  businessPhone,
  businessAddress,
  businessSlogan,
  businessCurrency = "HTG",
  usdExchangeRate,
  bankAccounts,
  zelleInfo,
  usdtAddress,
  moncashNumber,
  moncashName,
  moncashQrUrl,
  natcashNumber,
  natcashName,
  natcashQrUrl,
  initialPayMethod,
  type,
  onClose,
}: InvoiceModalProps) {
  const v = useDict(INVOICE_COPY);
  const [docType, setDocType] = useState<"devis" | "facture">(type);
  const [payMethod, setPayMethod] = useState<PayMethod>(initialPayMethod ?? card.pay_method ?? "moncash");
  const [displayCurrency, setDisplayCurrency] = useState<"HTG" | "USD" | "BOTH">("HTG");
  const [printMode, setPrintMode] = useState<"thermal_80mm" | "thermal_58mm" | "letter">("thermal_80mm");
  const [isGenerating, setIsGenerating] = useState(false);

  const isInvoice = docType === "devis";
  const isThermal = printMode.startsWith("thermal");
  // Sans taux saisi par le marchand, on ne convertit rien : un taux inventé
  // afficherait un prix en dollars que le client ne paiera jamais.
  const rate = usdExchangeRate && usdExchangeRate > 0 ? usdExchangeRate : null;
  const canConvert = rate !== null;
  const currency = card.currency ?? businessCurrency;
  const showRate = canConvert && (displayCurrency === "USD" || displayCurrency === "BOTH");

  const dateStr = new Date().toLocaleDateString("fr-HT", { year: "numeric", month: "long", day: "numeric" });
  const deliveryFeeCents = card.deliveryFeeCents ?? 0;
  const lines = invoiceLines(card, deliveryFeeCents);
  const subtotalCents = lines.reduce((acc, it) => acc + it.totalCents, 0) || Math.max(0, card.totalCents - deliveryFeeCents);
  const securityCode = getOrderSecurityCode(card.ref, card.securityCode);
  const payLabel = v.payMethods[payMethod] ?? v.payMethods.lot;

  const money = (cents: number) => {
    if (displayCurrency === "USD" && rate) return `$${(cents / 100 / rate).toFixed(2)}`;
    if (displayCurrency === "BOTH" && rate) return `${formatMoney(cents, currency)} ($${(cents / 100 / rate).toFixed(2)})`;
    return formatMoney(cents, currency);
  };

  const shareText = isInvoice
    ? v.share.invoice({
        name: card.customerName,
        ref: card.ref,
        code: securityCode,
        subtotal: money(subtotalCents),
        delivery: money(deliveryFeeCents),
        total: money(card.totalCents),
        method: payLabel,
        rate: showRate && rate ? String(rate) : null,
        usdtAddress: payMethod === "crypto_usdt" && usdtAddress?.trim() ? usdtAddress.trim() : null,
      })
    : v.share.receipt(card.customerName, card.ref, securityCode, businessName);

  const waHref = waMeLink(card.phone_e164, shareText);
  const fileBase = `${isInvoice ? v.tabs.invoice : v.tabs.receipt}-${card.ref}`;

  async function handleDownloadImage() {
    const node = document.getElementById("printable-invoice");
    if (!node) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(node, { quality: 0.98, pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${fileBase}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleShareWhatsApp() {
    const node = document.getElementById("printable-invoice");
    if (!node) {
      window.open(waHref, "_blank");
      return;
    }
    try {
      setIsGenerating(true);
      const blob = await toBlob(node, { quality: 0.98, pixelRatio: 2, cacheBust: true });
      if (!blob) {
        window.open(waHref, "_blank");
        return;
      }
      const file = new File([blob], `${fileBase}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${fileBase}`, text: shareText });
        return;
      }
      const link = document.createElement("a");
      link.download = file.name;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.open(waHref, "_blank");
    } catch {
      window.open(waHref, "_blank");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-xs sm:p-4">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white p-3.5 shadow-2xl sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1">
            {(["devis", "facture"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setDocType(key)}
                aria-pressed={docType === key}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  docType === key ? (key === "devis" ? "bg-brand text-white" : "bg-brand-green text-white") : "text-ink-muted"
                }`}
              >
                {key === "devis" ? v.tabs.invoice : v.tabs.receipt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageToggle variant="compact" />
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex h-9 cursor-pointer items-center rounded-xl border border-line bg-white px-2.5 text-xs font-bold text-ink active:scale-95 disabled:opacity-50 sm:px-3"
            >
              {v.actions.download}
            </button>
            <button
              onClick={() => window.print()}
              className="flex h-9 cursor-pointer items-center rounded-xl bg-brand px-2.5 text-xs font-bold text-white active:scale-95 sm:px-3"
            >
              {v.actions.print}
            </button>
            <button
              onClick={onClose}
              aria-label={v.actions.close}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-100 font-bold text-ink-muted active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-0.5 pt-2.5">
          <label className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
            {v.selectors.payment}
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PayMethod)}
              className="rounded-xl border border-line bg-gray-50 px-2 py-1 text-xs font-bold text-ink outline-none focus:border-brand"
            >
              {(["moncash", "natcash", "banque_locale", "zelle", "crypto_usdt", "kach", "lot"] as const).map((m) => (
                <option key={m} value={m}>
                  {v.payMethods[m]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
            {v.selectors.currency}
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as typeof displayCurrency)}
              className="rounded-xl border border-line bg-[#E7F7F1] px-2 py-1 text-xs font-bold text-brand outline-none"
            >
              <option value="HTG">{v.currencies.htg}</option>
              <option value="USD" disabled={!canConvert}>
                {v.currencies.usd}
              </option>
              <option value="BOTH" disabled={!canConvert}>
                {v.currencies.both}
              </option>
            </select>
          </label>

          <label className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
            {v.selectors.format}
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as typeof printMode)}
              className="rounded-xl border border-line bg-gray-50 px-2 py-1 text-xs font-bold text-ink outline-none"
            >
              <option value="thermal_80mm">{v.formats.thermal80}</option>
              <option value="thermal_58mm">{v.formats.thermal58}</option>
              <option value="letter">{v.formats.letter}</option>
            </select>
          </label>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body { background: #fff !important; color: #000 !important; }
            body * { visibility: hidden !important; }
            #printable-invoice-container, #printable-invoice-container * { visibility: visible !important; }
            #printable-invoice-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; max-height: none !important; }
            #printable-invoice {
              border: ${isThermal ? "none" : "1px solid #e5e7eb"} !important;
              box-shadow: none !important; border-radius: 0 !important;
              padding: ${printMode === "thermal_58mm" ? "4px" : printMode === "thermal_80mm" ? "8px" : "24px"} !important;
              width: ${printMode === "thermal_58mm" ? "58mm" : printMode === "thermal_80mm" ? "80mm" : "100%"} !important;
              max-width: ${printMode === "thermal_58mm" ? "58mm" : printMode === "thermal_80mm" ? "80mm" : "100%"} !important;
              margin: 0 auto !important;
            }
            .no-print { display: none !important; }
            @page { size: ${printMode === "thermal_58mm" ? "58mm auto" : printMode === "thermal_80mm" ? "80mm auto" : "8.5in 11in portrait"}; margin: ${isThermal ? "2mm" : "10mm"}; }
          }
        `,
          }}
        />

        <div className="my-3 max-h-[60vh] overflow-y-auto pr-1 [scrollbar-width:thin]" id="printable-invoice-container">
          <div
            id="printable-invoice"
            className={`relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white ${
              printMode === "thermal_58mm"
                ? "mx-auto max-w-[260px] gap-3 p-2.5 text-[10.5px]"
                : printMode === "thermal_80mm"
                ? "mx-auto max-w-[340px] gap-4 p-3.5 text-xs"
                : "w-full gap-5 p-5"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 z-30 flex select-none items-center justify-center overflow-hidden opacity-[0.038]">
              <span className="whitespace-nowrap rotate-[-22deg] text-4xl font-black uppercase tracking-widest text-ink sm:text-7xl">{businessName}</span>
            </div>

            <div className={`relative z-10 flex flex-col ${isThermal ? "gap-3" : "gap-5"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-[#F7F8F9] ${
                      printMode === "thermal_58mm" ? "h-9 w-9" : printMode === "thermal_80mm" ? "h-11 w-11" : "h-14 w-14"
                    }`}
                  >
                    {businessLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={businessLogoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CvzMark size={isThermal ? 28 : 40} id="invoice-mark" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className={`truncate font-extrabold tracking-tight text-brand ${printMode === "thermal_58mm" ? "text-xs" : printMode === "thermal_80mm" ? "text-sm" : "text-xl"}`}>
                      {businessName}
                    </span>
                    {businessAddress && <span className={`leading-tight text-ink-muted ${isThermal ? "text-[10px]" : "text-[12px]"}`}>{businessAddress}</span>}
                    {businessPhone && (
                      <span className={`leading-tight text-ink-muted ${isThermal ? "text-[10px]" : "text-[12px]"}`}>
                        {v.doc.phone} {businessPhone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`rounded-lg font-extrabold uppercase tracking-wider ${isInvoice ? "bg-amber-100 text-amber-900" : "bg-[#E7F7F1] text-brand"} ${
                      isThermal ? "px-2 py-0.5 text-[9.5px]" : "px-3 py-1 text-xs"
                    }`}
                  >
                    {isInvoice ? v.doc.invoiceBadge : v.doc.receiptBadge}
                  </span>
                  <span className={`font-bold text-ink ${isThermal ? "text-[10.5px]" : "text-xs"}`}>
                    {v.doc.number} #{card.ref}
                  </span>
                  <span className={`text-ink-faint ${isThermal ? "text-[9.5px]" : "text-[11px]"}`}>{dateStr}</span>
                </div>
              </div>

              <div className="h-px bg-line" />

              <div className={`flex justify-between gap-2 rounded-xl bg-[#F7F8F9] ${isThermal ? "p-2.5 text-[10.5px]" : "p-3.5 text-xs"}`}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">{v.doc.customer}</span>
                  <span className={`truncate font-extrabold text-ink ${isThermal ? "text-xs" : "text-sm"}`}>{card.customerName}</span>
                  <span className="text-ink-muted">{card.phone_e164}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">{v.doc.paymentStatus}</span>
                  <span className={`font-extrabold ${isInvoice ? "text-amber-800" : "text-brand"}`}>{isInvoice ? v.doc.unpaid : v.doc.paid}</span>
                  {showRate && rate && <span className="text-[9.5px] font-semibold text-ink-faint">{v.doc.rate(String(rate))}</span>}
                </div>
              </div>

              <div className={`flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 ${isThermal ? "p-2 text-[10.5px]" : "p-3 text-xs"}`}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10.5px] font-extrabold text-emerald-950">{v.doc.securityCode}</span>
                  <span className="text-[9.5px] font-medium leading-tight text-emerald-800">{v.doc.securityHint}</span>
                </div>
                <span
                  className={`shrink-0 rounded-lg border border-emerald-300 bg-white font-mono font-black tracking-widest text-emerald-950 ${
                    isThermal ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-base"
                  }`}
                >
                  {securityCode}
                </span>
              </div>

              <div className="flex flex-col overflow-hidden rounded-xl border border-line">
                <div className={`grid grid-cols-12 bg-[#E7F7F1] font-bold uppercase tracking-wider text-brand ${isThermal ? "px-2 py-1.5 text-[9.5px]" : "px-3.5 py-2 text-[11px]"}`}>
                  <span className="col-span-5 truncate">{v.doc.product}</span>
                  <span className="col-span-2 text-center">{v.doc.qty}</span>
                  <span className="col-span-2 truncate text-right">{v.doc.unitPrice}</span>
                  <span className="col-span-3 text-right">{v.doc.total}</span>
                </div>
                <div className="divide-y divide-line bg-white">
                  {lines.map((it, idx) => (
                    <div key={idx} className={`grid grid-cols-12 items-center ${isThermal ? "px-2 py-1.5 text-[10.5px]" : "px-3.5 py-2.5 text-xs"}`}>
                      <span className="col-span-5 break-words font-semibold leading-tight text-ink">{it.name}</span>
                      <span className="col-span-2 text-center font-bold text-ink-soft">×{it.qty}</span>
                      <span className="col-span-2 text-right text-[10px] text-ink-muted sm:text-xs">{money(it.unitPriceCents)}</span>
                      <span className="col-span-3 text-right font-extrabold text-ink">{money(it.totalCents)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`flex w-full flex-col gap-1 self-end pt-1 ${isThermal ? "max-w-[200px] text-[10.5px]" : "max-w-[260px] text-xs"}`}>
                <div className="flex justify-between font-medium text-ink-muted">
                  <span>{v.doc.subtotal}</span>
                  <span className="font-bold text-ink">{money(subtotalCents)}</span>
                </div>
                {deliveryFeeCents > 0 && (
                  <div className="flex justify-between font-medium text-ink-muted">
                    <span>{v.doc.delivery}</span>
                    <span className="font-bold text-ink">{money(deliveryFeeCents)}</span>
                  </div>
                )}
              </div>

              {isInvoice ? (
                <div className={`flex flex-col gap-1.5 rounded-xl border border-line bg-[#F7F8F9] ${isThermal ? "p-2 text-[10px]" : "p-3.5 text-xs"}`}>
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-ink-muted">{v.doc.paymentMeans(payLabel)}</span>

                  {/* On n'affiche un moyen que si le marchand l'a réellement
                      renseigné : reprendre son numéro de boutique comme numéro
                      MonCash enverrait le client payer au mauvais endroit. */}
                  {payMethod === "moncash" &&
                    (moncashNumber?.trim() ? (
                      <PayBlock title="MonCash (Digicel)" qrUrl={moncashQrUrl} name={moncashName || businessName} value={moncashNumber} holderLabel={v.doc.holder} />
                    ) : (
                      <NotConfigured text={v.doc.notConfigured("MonCash")} />
                    ))}
                  {payMethod === "natcash" &&
                    (natcashNumber?.trim() ? (
                      <PayBlock title="NatCash (Natcom)" qrUrl={natcashQrUrl} name={natcashName || businessName} value={natcashNumber} holderLabel={v.doc.holder} />
                    ) : (
                      <NotConfigured text={v.doc.notConfigured("NatCash")} />
                    ))}
                  {payMethod === "banque_locale" && (
                    <div className="flex flex-col gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-[10.5px]">
                      {parseBankAccounts(bankAccounts).map((b, i) => (
                        <div key={i} className="flex flex-col gap-0.5 rounded border border-emerald-200/70 bg-white p-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-emerald-900">{b.bank}</span>
                            <span className="rounded bg-emerald-100 px-1 text-[9px] font-black text-emerald-800">{b.currency}</span>
                          </div>
                          {b.accountName && (
                            <span className="text-[9.5px] text-ink-muted">
                              {v.doc.holder} : <strong>{b.accountName}</strong>
                            </span>
                          )}
                          <span className="font-mono text-[10.5px] font-bold text-ink">
                            {v.doc.account} : {b.accountNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {payMethod === "zelle" && !zelleInfo?.trim() && <NotConfigured text={v.doc.notConfigured("Zelle")} />}
                  {payMethod === "crypto_usdt" && !usdtAddress?.trim() && <NotConfigured text={v.doc.notConfigured("USDT")} />}
                  {payMethod === "banque_locale" && parseBankAccounts(bankAccounts).length === 0 && (
                    <NotConfigured text={v.doc.notConfigured(v.payMethods.banque_locale)} />
                  )}
                  {payMethod === "zelle" && zelleInfo && (
                    <div className="flex flex-col rounded-lg border border-purple-200 bg-purple-50/60 p-2 text-[10.5px]">
                      <span className="font-extrabold text-purple-950">Zelle</span>
                      <span className="break-all font-bold text-purple-900">{zelleInfo}</span>
                    </div>
                  )}
                  {payMethod === "crypto_usdt" && usdtAddress && (
                    <div className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50/80 p-2 text-[10.5px]">
                      <span className="font-extrabold text-amber-950">USDT (TRC-20)</span>
                      <span className="select-all break-all font-mono text-[10px] font-black text-amber-950">{usdtAddress}</span>
                    </div>
                  )}
                  {payMethod === "kach" && <span className="rounded-lg border border-line bg-white p-2 text-[10.5px] font-bold text-ink">{v.doc.cash}</span>}
                  {payMethod === "lot" && <span className="rounded-lg border border-line bg-white p-2 text-[10.5px] font-bold text-ink">{v.doc.other}</span>}
                </div>
              ) : (
                <div className="rounded-lg bg-[#E7F7F1] px-3 py-1.5 text-[10.5px] font-bold text-brand">{v.doc.receiptFor(payLabel)}</div>
              )}

              <div className={`relative flex items-center justify-between gap-2 border-t border-line ${isThermal ? "min-h-[60px] pt-2" : "min-h-[90px] pt-3"}`}>
                <span className={`shrink-0 font-extrabold uppercase text-ink-muted ${isThermal ? "text-[10px]" : "text-xs"}`}>
                  {isInvoice ? v.doc.totalDue : v.doc.totalPaid}
                </span>

                {!isInvoice && <PaidStamp businessName={businessName} slogan={businessSlogan} label={v.doc.stamp} isThermal={isThermal} />}

                <span
                  className={`shrink-0 whitespace-nowrap font-black tracking-tight text-[#0B6638] ${
                    printMode === "thermal_58mm" ? "text-base sm:text-lg" : printMode === "thermal_80mm" ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
                  }`}
                >
                  {money(card.totalCents)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="no-print mt-2 flex gap-3">
          <button
            onClick={handleShareWhatsApp}
            disabled={isGenerating}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-green active:scale-[0.98] disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" />
            </svg>
            <span className="text-sm font-extrabold text-white">{isGenerating ? v.actions.generating : v.actions.send(isInvoice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NotConfigured({ text }: { text: string }) {
  return <span className="rounded-lg border border-dashed border-line bg-white p-2 text-[10.5px] font-semibold text-ink-muted">{text}</span>;
}

function PayBlock({
  title,
  qrUrl,
  name,
  value,
  holderLabel,
}: {
  title: string;
  qrUrl?: string | null;
  name?: string | null;
  value?: string | null;
  holderLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-2">
      {qrUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrUrl} alt="" className="h-14 w-14 shrink-0 rounded border border-line object-contain" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] font-black text-ink">{title}</span>
        {name && (
          <span className="truncate text-[10.5px] font-bold text-ink-soft">
            {holderLabel} : {name}
          </span>
        )}
        {value && <span className="text-[10.5px] font-extrabold text-brand">{value}</span>}
      </div>
    </div>
  );
}

function PaidStamp({
  businessName,
  slogan,
  label,
  isThermal,
}: {
  businessName: string;
  slogan?: string | null;
  label: string;
  isThermal: boolean;
}) {
  const nameUpper = businessName.toUpperCase();
  const sloganUpper = (slogan ?? "").toUpperCase();
  const size = isThermal ? 80 : 120;

  return (
    <div className="pointer-events-none z-20 my-0.5 flex shrink-0 select-none items-center justify-center opacity-95">
      <svg width={size} height={size} viewBox="0 0 160 160" className="rotate-[-8deg]" aria-hidden="true">
        <circle cx="80" cy="80" r="74" fill="none" stroke="#0B6638" strokeWidth="4.5" />
        <circle cx="80" cy="80" r="67" fill="none" stroke="#0B6638" strokeWidth="1.8" />
        <circle cx="80" cy="80" r="49" fill="none" stroke="#0B6638" strokeWidth="1.8" />

        <path id="stampTopArc" d="M 20,80 A 60,60 0 1,1 140,80" fill="none" />
        <text fill="#0B6638" fontSize="12" fontWeight="900" letterSpacing="1.2">
          <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
            {nameUpper.length > 20 ? nameUpper.slice(0, 18) : nameUpper}
          </textPath>
        </text>

        <text x="14" y="84" fill="#0B6638" fontSize="12" fontWeight="900">
          ★
        </text>
        <text x="138" y="84" fill="#0B6638" fontSize="12" fontWeight="900">
          ★
        </text>

        {sloganUpper && (
          <>
            <path id="stampBottomArc" d="M 140,80 A 60,60 0 0,1 20,80" fill="none" />
            <text fill="#0B6638" fontSize="11" fontWeight="900" letterSpacing="1.1">
              <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
                {sloganUpper.length > 22 ? sloganUpper.slice(0, 20) : sloganUpper}
              </textPath>
            </text>
          </>
        )}

        <g transform="rotate(-7 80 80)">
          <rect x="25" y="57" width="110" height="46" rx="10" fill="#FFFFFF" stroke="#0B6638" strokeWidth="3.6" />
          <text x="80" y="88" fill="#0B6638" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
            {label}
          </text>
        </g>
      </svg>
    </div>
  );
}
