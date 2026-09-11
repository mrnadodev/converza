"use client";

import { useState } from "react";
import { toPng, toBlob } from "html-to-image";
import { formatMoney } from "@/lib/money";
import { waMeLink } from "@/lib/whatsapp";
import type { Currency, PayMethod, PipelineCard } from "@/lib/types";
import { getOrderSecurityCode } from "@/lib/order";
import { parseBankAccounts } from "@/lib/bank";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/components/LanguageContext";

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

export function getPayMethodLabel(method: PayMethod): string {
  switch (method) {
    case "moncash": return "MONCASH";
    case "natcash": return "NATCASH";
    case "crypto_usdt": return "USDT";
    case "zelle": return "ZELLE";
    case "unibank_htg": return "UNIBANK (HTG)";
    case "unibank_usd": return "UNIBANK (USD)";
    case "buh_htg": return "BUH (HTG)";
    case "buh_usd": return "BUH (USD)";
    case "sogebank_htg": return "SOGEBANK (HTG)";
    case "sogebank_usd": return "SOGEBANK (USD)";
    case "kach": return "KACH";
    case "banque_locale": return "BANQUE LOCALE";
    default: return "LÒT";
  }
}

interface ParsedInvoiceItem {
  name: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

function parseInvoiceItems(summary: string, totalCents: number, deliveryFeeCents: number): ParsedInvoiceItem[] {
  const itemsTotalCents = Math.max(0, totalCents - deliveryFeeCents);

  if (!summary || !summary.trim()) {
    return [{ name: "Kòmand Pwodwi yo", qty: 1, unitPriceCents: itemsTotalCents, totalCents: itemsTotalCents }];
  }

  // Séparer les articles par '·' ou ','
  const parts = summary.split(/[·,]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    return [{ name: summary.trim(), qty: 1, unitPriceCents: itemsTotalCents, totalCents: itemsTotalCents }];
  }

  // Tenter d'extraire la quantité "3× Non" ou "3x Non" ou "3 Non"
  const rawItems: { name: string; qty: number }[] = parts.map((part) => {
    const match = part.match(/^(\d+)\s*[x×*]\s*(.+)$/i) || part.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return { qty: Math.max(1, parseInt(match[1], 10) || 1), name: match[2].trim() };
    }
    return { qty: 1, name: part };
  });

  const totalQty = rawItems.reduce((acc, it) => acc + it.qty, 0);

  return rawItems.map((it) => {
    const itemTotalCents = Math.round((itemsTotalCents * it.qty) / (totalQty || 1));
    const unitPriceCents = Math.round(itemTotalCents / (it.qty || 1));
    return {
      name: it.name,
      qty: it.qty,
      unitPriceCents,
      totalCents: itemTotalCents,
    };
  });
}

export function InvoiceModal({
  card,
  businessName,
  businessLogoUrl,
  businessPhone = "+509 3712 4488",
  businessAddress = "Delmas, Port-au-Prince, Haïti",
  businessSlogan = "Boutik paw la",
  businessCurrency = "HTG",
  usdExchangeRate = 132.5,
  bankAccounts = "Unibank HTG: 123-456-7890 | Sogebank USD: 987-654-3210",
  zelleInfo = "pay@tikokboutik.com / Ti Kòk Boutik LLC",
  usdtAddress = "T9yD14Nj9j7x2VbK4mL8pQnRtWz3v5XsYp",
  moncashNumber,
  moncashName,
  moncashQrUrl,
  natcashNumber,
  natcashName,
  natcashQrUrl,
  zelleQrUrl,
  usdtQrUrl,
  initialPayMethod,
  type,
  onClose,
}: InvoiceModalProps) {
  const { t } = useTranslation();
  // "devis" = Fakti, "facture" = Resi
  const [docType, setDocType] = useState<"devis" | "facture">(type);
  const [payMethod, setPayMethod] = useState<PayMethod>(initialPayMethod ?? card.pay_method ?? "moncash");
  const [displayCurrency, setDisplayCurrency] = useState<"HTG" | "USD" | "BOTH">("HTG");
  const [printMode, setPrintMode] = useState<"thermal_80mm" | "thermal_58mm" | "letter_8.5x11">("thermal_80mm");
  const [isGenerating, setIsGenerating] = useState(false);

  const isFakti = docType === "devis";
  const rate = usdExchangeRate && usdExchangeRate > 0 ? usdExchangeRate : 132.5;

  // RÈGLE STRICTE: Le taux s'affiche UNIQUEMENT si la boutique vend en USD ET que le client paie en HTG
  const isShopUSD = card.currency === "USD" || businessCurrency === "USD";
  const isPayingHTG = displayCurrency === "HTG" || displayCurrency === "BOTH";
  const shouldShowTaux = isShopUSD && isPayingHTG;

  const dateStr = new Date().toLocaleDateString("fr-HT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deliveryFeeCents = card.deliveryFeeCents ?? 0;
  const items = parseInvoiceItems(card.itemsSummary, card.totalCents, deliveryFeeCents);
  const subtotalCents = items.reduce((acc, it) => acc + it.totalCents, 0);

  // Conversion Taux du Jour USD / HTG
  const totalHTGAmount = card.totalCents / 100;
  const totalUSDAmount = totalHTGAmount / rate;

  const formattedTotalDisplay =
    displayCurrency === "USD"
      ? `$${totalUSDAmount.toFixed(2)} USD`
      : displayCurrency === "BOTH"
      ? `${formatMoney(card.totalCents)} ($${totalUSDAmount.toFixed(2)} USD)`
      : formatMoney(card.totalCents);

  const tauxLine = shouldShowTaux ? `\n*(Taux du jour: 1 USD = ${rate} HTG)*` : "";
  const payLabel = getPayMethodLabel(payMethod);

  const securityCode = getOrderSecurityCode(card.ref, card.securityCode);

  let usdtExtraMsg = "";
  if (payMethod === "crypto_usdt" && usdtAddress) {
    usdtExtraMsg = `\n\n🪙 *Adrès Portefeuille USDT (TRC-20):*\n${usdtAddress.trim()}\n⚠️ *(NB: verifier avant de copier)*`;
  }

  const shareText = isFakti
    ? `Bonjou ${card.customerName},\nMen fakti ou pou kòmand #${card.ref}.\n\n🔑 *Kòd Sekirite: ${securityCode}*\n⚠️ *(Gade kòd sa a! Bay livrè a oswa moun nan boutik la li pou w resevwa pwodwi ou yo)*\n\nSous-total: ${formatMoney(subtotalCents)}\nLivrezon: ${formatMoney(deliveryFeeCents)}\nTotal pou peye: ${formattedTotalDisplay}${tauxLine}\nEstati Pèman: ⏳ POKO PEYE\nPeye pa ${payLabel} (Ref: #${card.ref})${usdtExtraMsg}`
    : `Bonjou ${card.customerName} Nou resevwa pèman ou #${card.ref}. 🔑 Kòd Sekirite: ${securityCode}. Nou voye resi a pou ou. N ap konfime livrezon an byento. — ${businessName}`;

  const waHref = waMeLink(card.phone_e164, shareText);

  // Générer et Télécharger l'image PNG HD de la facture/reçu
  async function handleDownloadImage() {
    const node = document.getElementById("printable-invoice");
    if (!node) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(node, { quality: 0.98, pixelRatio: 2, cacheBust: true });
      const fileName = `${isFakti ? "Fakti" : "Resi"}_${card.ref}_${card.customerName.replace(/\s+/g, "_")}.png`;

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur lors de la création de l'image:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  // Action principale "Voye pa WhatsApp" avec Capture d'Image PNG + Partage Direct / Téléchargement
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

      const file = new File([blob], `${isFakti ? "Fakti" : "Resi"}_${card.ref}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${isFakti ? "Fakti" : "Resi"} #${card.ref}`,
          text: shareText,
        });
        return;
      }

      const link = document.createElement("a");
      link.download = file.name;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.open(waHref, "_blank");
    } catch (err) {
      console.error("Erreur lors du partage:", err);
      window.open(waHref, "_blank");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-xl flex-col rounded-3xl bg-white p-3.5 sm:p-5 shadow-2xl overflow-hidden">
        {/* Entête avec Sélecteurs de Type, Pèman et Devise */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => setDocType("devis")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${isFakti ? "bg-brand text-white shadow-sm" : "text-ink-muted"}`}
            >
              📋 Fakti
            </button>
            <button
              onClick={() => setDocType("facture")}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${!isFakti ? "bg-brand-green text-white shadow-sm" : "text-ink-muted"}`}
            >
              📄 Resi
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageToggle variant="compact" />
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 sm:px-3 text-xs font-bold text-ink active:scale-95 cursor-pointer disabled:opacity-50"
              title={t("invoice", "downloadPhoto")}
            >
              📸 {t("invoice", "downloadPhoto").split(" ")[0]}
            </button>
            <button
              onClick={() => window.print()}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-brand bg-brand px-2.5 sm:px-3 text-xs font-bold text-white shadow-xs active:scale-95 cursor-pointer"
              title={t("invoice", "print")}
            >
              🖨️ {t("invoice", "print")}
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-ink-muted font-bold active:scale-95 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barre de Sélection Dynamique : Peman, Devise, ak Format Enpresyon POS / Papye */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 px-0.5 no-print">
          {/* Choisir le mode de paiement spécifique */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-ink-muted uppercase">Peman:</span>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PayMethod)}
              className="rounded-xl border border-line bg-gray-50 px-2 py-1 text-xs font-bold text-ink outline-none focus:border-brand"
            >
              <option value="moncash">MonCash</option>
              <option value="natcash">Natcash</option>
              <option value="banque_locale">Banque Locale (Unibank/Sogebank/BUH)</option>
              <option value="zelle">Zelle (USD)</option>
              <option value="crypto_usdt">USDT Crypto (TRC-20)</option>
              <option value="kach">Lajan Kach</option>
              <option value="lot">Lòt</option>
            </select>
          </div>

          {/* Affichage Taux du Jour / Devise */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-ink-muted uppercase">Devise:</span>
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as typeof displayCurrency)}
              className="rounded-xl border border-line bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-950 outline-none"
            >
              <option value="HTG">HTG (Goud)</option>
              <option value="USD">USD ($)</option>
              <option value="BOTH">HTG + USD (Tout 2)</option>
            </select>
          </div>

          {/* Format Enpresyon POS Thermal (80mm / 58mm) vs Papye Normal 8.5x11 in */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-ink-muted uppercase">Format:</span>
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as typeof printMode)}
              className="rounded-xl border border-line bg-amber-50 px-2 py-1 text-xs font-bold text-amber-950 outline-none"
            >
              <option value="thermal_80mm">🖨️ POS Tèmik (80mm)</option>
              <option value="thermal_58mm">🖨️ POS Tèmik (58mm)</option>
              <option value="letter_8.5x11">📄 Papye (8.5 x 11 in)</option>
            </select>
          </div>
        </div>

        {/* Style CSS dynamique pour l'impression POS Thermal / Papye Standard */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: #fff !important;
              color: #000 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-container, #printable-invoice-container * {
              visibility: visible !important;
            }
            #printable-invoice-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              max-height: none !important;
            }
            #printable-invoice {
              border: ${printMode.startsWith("thermal") ? "none" : "1px solid #e5e7eb"} !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: ${printMode === "thermal_58mm" ? "4px" : printMode === "thermal_80mm" ? "8px" : "24px"} !important;
              width: ${printMode === "thermal_58mm" ? "58mm" : printMode === "thermal_80mm" ? "80mm" : "100%"} !important;
              max-width: ${printMode === "thermal_58mm" ? "58mm" : printMode === "thermal_80mm" ? "80mm" : "100%"} !important;
              margin: 0 auto !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${printMode === "thermal_58mm" ? "58mm auto" : printMode === "thermal_80mm" ? "80mm auto" : "8.5in 11in portrait"};
              margin: ${printMode.startsWith("thermal") ? "2mm" : "10mm"};
            }
          }
        ` }} />

        {/* CONTENEUR AVEC BARRE DE DÉFILEMENT POUR ÉVITER TOUT DÉBORDEMENT A L'ÉCRAN */}
        <div className="my-3 max-h-[60vh] overflow-y-auto pr-1 [scrollbar-width:thin]" id="printable-invoice-container">

          {/* DOCUMENT A IMPRIMER OU CAPTURER EN IMAGE PNG */}
          <div
            className={`relative flex flex-col rounded-2xl border border-line bg-white shadow-sm overflow-hidden transition-all ${
              printMode === "thermal_58mm"
                ? "max-w-[260px] mx-auto p-2.5 text-[10.5px] gap-3"
                : printMode === "thermal_80mm"
                ? "max-w-[340px] mx-auto p-3.5 text-xs gap-4"
                : "w-full p-5 gap-5"
            }`}
            id="printable-invoice"
          >

            {/* Watermark (Filigrane) Nom du Biznis PAR-DESSUS LE DOCUMENT avec faible opacité */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.038] select-none z-30">
              <span className="rotate-[-22deg] text-4xl sm:text-7xl font-black uppercase tracking-widest text-ink whitespace-nowrap">
                {businessName}
              </span>
            </div>

            <div className={`relative z-10 flex flex-col ${printMode.startsWith("thermal") ? "gap-3" : "gap-5"}`}>
              {/* Entête avec Logo Biznis + Informations */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Logo du Biznis (ou Rooster Logo par défaut) */}
                  <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-[#F7F8F9] ${
                    printMode === "thermal_58mm" ? "h-9 w-9" : printMode === "thermal_80mm" ? "h-11 w-11" : "h-14 w-14"
                  }`}>
                    {businessLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={businessLogoUrl} alt={businessName} className="h-full w-full object-cover" />
                    ) : (
                      <RoosterLogo />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-extrabold tracking-tight text-brand truncate ${
                      printMode === "thermal_58mm" ? "text-xs" : printMode === "thermal_80mm" ? "text-sm" : "text-xl"
                    }`}>
                      {businessName}
                    </span>
                    <span className={`text-ink-muted leading-tight ${printMode.startsWith("thermal") ? "text-[10px]" : "text-[12px]"}`}>{businessAddress}</span>
                    <span className={`text-ink-muted leading-tight ${printMode.startsWith("thermal") ? "text-[10px]" : "text-[12px]"}`}>Tel: {businessPhone}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className={`rounded-lg font-extrabold uppercase tracking-wider ${
                    isFakti ? "bg-amber-100 text-amber-900" : "bg-[#E7F7F1] text-brand"
                  } ${printMode.startsWith("thermal") ? "px-2 py-0.5 text-[9.5px]" : "px-3 py-1 text-xs"}`}>
                    {isFakti ? "FAKTI" : "RESI OFISYÈL"}
                  </span>
                  <span className={`font-bold text-ink ${printMode.startsWith("thermal") ? "text-[10.5px]" : "text-xs"}`}>N° #{card.ref}</span>
                  <span className={`text-ink-faint ${printMode.startsWith("thermal") ? "text-[9.5px]" : "text-[11px]"}`}>{dateStr}</span>
                </div>
              </div>

              <div className="h-px bg-line" />

              {/* Section Kliyan & Estati Pèman */}
              <div className={`flex justify-between rounded-xl bg-[#F7F8F9] ${printMode.startsWith("thermal") ? "p-2.5 text-[10.5px]" : "p-3.5 text-xs"}`}>
                <div className="flex flex-col">
                  <span className="text-[9.5px] font-bold text-ink-faint uppercase tracking-wider">Kliyan:</span>
                  <span className={`font-extrabold text-ink ${printMode.startsWith("thermal") ? "text-xs" : "text-sm"}`}>{card.customerName}</span>
                  <span className="text-ink-muted">{card.phone_e164}</span>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <span className="text-[9.5px] font-bold text-ink-faint uppercase tracking-wider">Estati Pèman:</span>
                  <span className={`font-extrabold ${isFakti ? "text-amber-800" : "text-[#008069]"}`}>
                    {isFakti ? "⏳ Poko Peye" : "✅ Peye ak Siksè"}
                  </span>
                  {shouldShowTaux && (
                    <span className="text-[9.5px] text-ink-faint font-semibold">Taux: 1 USD = {rate} HTG</span>
                  )}
                </div>
              </div>

              {/* Badge Kòd Sekirite Livrezon / Ranmase Store */}
              <div className={`flex items-center justify-between rounded-xl bg-emerald-50/90 border border-emerald-200/80 ${printMode.startsWith("thermal") ? "p-2 text-[10.5px]" : "p-3 text-xs"}`}>
                <div className="flex items-center gap-2">
                  <span className={printMode.startsWith("thermal") ? "text-sm" : "text-lg"}>🔑</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-emerald-950 text-[10.5px]">Kòd Sekirite Livrezon:</span>
                    <span className="text-[9.5px] text-emerald-800 font-medium leading-tight">Bay moun nan boutik la oswa livrè a li.</span>
                  </div>
                </div>
                <span className={`font-mono font-black text-emerald-950 bg-white rounded-lg border border-emerald-300 shadow-2xs tracking-widest shrink-0 ${
                  printMode.startsWith("thermal") ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-base"
                }`}>
                  {securityCode}
                </span>
              </div>

              {/* Table des Produits Commandés */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-line">
                <div className={`grid grid-cols-12 bg-[#E7F7F1] font-bold text-brand uppercase tracking-wider ${
                  printMode.startsWith("thermal") ? "px-2 py-1.5 text-[9.5px]" : "px-3.5 py-2 text-[11px]"
                }`}>
                  <span className="col-span-5 truncate">Pwodwi / Deskripsyon</span>
                  <span className="col-span-2 text-center">Qté</span>
                  <span className="col-span-2 text-right truncate">Pri Unit.</span>
                  <span className="col-span-3 text-right">Total</span>
                </div>
                <div className="divide-y divide-line bg-white">
                  {items.map((it, idx) => (
                    <div key={idx} className={`grid grid-cols-12 items-center ${
                      printMode.startsWith("thermal") ? "px-2 py-1.5 text-[10.5px]" : "px-3.5 py-2.5 text-xs"
                    }`}>
                      <span className="col-span-5 font-semibold text-ink leading-tight break-words">{it.name}</span>
                      <span className="col-span-2 text-center font-bold text-ink-soft">x{it.qty}</span>
                      <span className="col-span-2 text-right text-ink-muted text-[10px] sm:text-xs">
                        {displayCurrency === "USD"
                          ? `$${((it.unitPriceCents / 100) / rate).toFixed(2)}`
                          : (it.unitPriceCents / 100).toFixed(0)}
                      </span>
                      <span className="col-span-3 text-right font-extrabold text-ink">
                        {displayCurrency === "USD"
                          ? `$${((it.totalCents / 100) / rate).toFixed(2)}`
                          : (it.totalCents / 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sous-total & Livrezon */}
              <div className={`flex flex-col gap-1 self-end w-full pt-1 ${
                printMode.startsWith("thermal") ? "max-w-[200px] text-[10.5px]" : "max-w-[240px] text-xs"
              }`}>
                <div className="flex justify-between text-ink-muted font-medium">
                  <span>Sous-total:</span>
                  <span className="font-bold text-ink">
                    {displayCurrency === "USD"
                      ? `$${((subtotalCents / 100) / rate).toFixed(2)}`
                      : formatMoney(subtotalCents)}
                  </span>
                </div>

                {deliveryFeeCents > 0 && (
                  <div className="flex justify-between text-ink-muted font-medium">
                    <span>Livrezon:</span>
                    <span className="font-bold text-ink">
                      {displayCurrency === "USD"
                        ? `$${((deliveryFeeCents / 100) / rate).toFixed(2)}`
                        : formatMoney(deliveryFeeCents)}
                    </span>
                  </div>
                )}
              </div>

              {/* Section d'Instructions de Paiement Spécifiques */}
              {isFakti ? (
                <div className={`flex flex-col gap-1.5 rounded-xl bg-[#F7F8F9] border border-line ${
                  printMode.startsWith("thermal") ? "p-2 text-[10px]" : "p-3.5 text-xs"
                }`}>
                  <span className="font-extrabold text-ink-muted uppercase tracking-wider text-[9.5px]">
                    Mwayen Peman ({payMethod.toUpperCase()}) :
                  </span>

                  {payMethod === "moncash" && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-white p-2 shadow-xs">
                      {moncashQrUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={moncashQrUrl} alt="MonCash QR Code" className="h-14 w-14 shrink-0 rounded object-contain border border-line" />
                      ) : null}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-red-600">MonCash (Digicel)</span>
                        <span className="text-[10.5px] font-bold text-ink truncate">Non: {moncashName || businessName}</span>
                        <span className="text-[10.5px] font-extrabold text-red-700">Tel: {moncashNumber || businessPhone}</span>
                      </div>
                    </div>
                  )}

                  {payMethod === "natcash" && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white p-2 shadow-xs">
                      {natcashQrUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={natcashQrUrl} alt="Natcash QR Code" className="h-14 w-14 shrink-0 rounded object-contain border border-line" />
                      ) : null}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-blue-600">Natcash (Natcom)</span>
                        <span className="text-[10.5px] font-bold text-ink truncate">Non: {natcashName || businessName}</span>
                        <span className="text-[10.5px] font-extrabold text-blue-700">Tel: {natcashNumber || businessPhone}</span>
                      </div>
                    </div>
                  )}

                  {payMethod === "banque_locale" && (
                    <div className="flex flex-col gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-[10.5px]">
                      <span className="font-extrabold text-emerald-950">🏦 Virement Banque Locale :</span>
                      {parseBankAccounts(bankAccounts).map((b, i) => (
                        <div key={i} className="flex flex-col gap-0.5 rounded border border-emerald-200/70 bg-white p-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-emerald-900">{b.bank}</span>
                            <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-black text-emerald-800">{b.currency}</span>
                          </div>
                          {b.accountName && <span className="text-ink-muted text-[9.5px]">Titulaire: <strong>{b.accountName}</strong></span>}
                          <span className="font-mono font-bold text-ink text-[10.5px]">Compte: {b.accountNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {payMethod === "zelle" && (
                    <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/60 p-2 text-[10.5px]">
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-purple-950">⚡ Zelle (USD) :</span>
                        <span className="font-bold text-purple-900">{zelleInfo}</span>
                      </div>
                    </div>
                  )}

                  {payMethod === "crypto_usdt" && (
                    <div className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50/80 p-2 text-[10.5px]">
                      <span className="font-extrabold text-amber-950">🪙 USDT (TRC-20) :</span>
                      <span className="font-mono text-[10px] font-black text-amber-950 break-all select-all">{usdtAddress}</span>
                    </div>
                  )}

                  {payMethod === "kach" && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-line bg-white p-2 text-[10.5px] font-bold text-ink">
                      <span>💵 Lajan kach nan livrezon (COD)</span>
                    </div>
                  )}

                  {payMethod === "lot" && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-line bg-white p-2 text-[10.5px] font-bold text-ink">
                      <span>Lòt mwayen peman akòde.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex items-center justify-between rounded-lg bg-[#E7F7F1] px-3 py-1.5 text-[10.5px] text-brand font-bold">
                  <span>Resi ofisyèl pèman ({payMethod.toUpperCase()}).</span>
                </div>
              )}

              {/* Total Final avec Sceau Officiel */}
              <div className={`relative flex items-center justify-between border-t border-line ${
                printMode.startsWith("thermal") ? "pt-2 min-h-[60px]" : "pt-3 min-h-[90px]"
              }`}>
                <span className={`font-extrabold text-ink-muted uppercase shrink-0 ${
                  printMode.startsWith("thermal") ? "text-[10px]" : "text-xs"
                }`}>
                  {isFakti ? "TOTAL POU PEYE" : "TOTAL KI PEYE"}
                </span>

                {/* Sceau / Tampon Officiel PEYE */}
                {!isFakti && <OfficialPaidStamp businessName={businessName} slogan={businessSlogan} isThermal={printMode.startsWith("thermal")} />}

                <div className="flex flex-col items-end shrink-0">
                  <span className={`font-black text-[#0B6638] tracking-tight whitespace-nowrap ${
                    printMode === "thermal_58mm" ? "text-base sm:text-lg" : printMode === "thermal_80mm" ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
                  }`}>
                    {formattedTotalDisplay}
                  </span>
                  {shouldShowTaux && displayCurrency !== "BOTH" && (
                    <span className="text-[10px] font-extrabold text-ink-muted">
                      ($${totalUSDAmount.toFixed(2)} USD)
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bouton WhatsApp avec Génération & Partage d'Image PNG */}
        <div className="mt-2 flex gap-3 no-print">
          <button
            onClick={handleShareWhatsApp}
            disabled={isGenerating}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-green shadow-lg shadow-brand-green/30 active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>
            <span className="text-sm font-extrabold text-white">
              {isGenerating
                ? "⏳ Jenerasyon Foto a..."
                : `Voye ${isFakti ? "Fakti a" : "Resi a"} ak Foto pa WhatsApp`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

// Composant Sceau / Tampon Officiel Circulaire (Template exact de l'image)
function OfficialPaidStamp({
  businessName,
  slogan = "Boutik paw la",
  isThermal = false,
}: {
  businessName: string;
  slogan?: string | null;
  isThermal?: boolean;
}) {
  const nameUpper = businessName.toUpperCase();
  const sloganUpper = (slogan || "Boutik paw la").toUpperCase();
  const stampSize = isThermal ? 80 : 120;

  return (
    <div className="pointer-events-none z-20 flex items-center justify-center opacity-95 select-none my-0.5 shrink-0">
      <svg width={stampSize} height={stampSize} viewBox="0 0 160 160" className="drop-shadow-xs rotate-[-8deg]">
        {/* Cercles Extérieurs Vert Sceau Impérial (#0B6638) */}
        <circle cx="80" cy="80" r="74" fill="none" stroke="#0B6638" strokeWidth="4.5" />
        <circle cx="80" cy="80" r="67" fill="none" stroke="#0B6638" strokeWidth="1.8" />
        <circle cx="80" cy="80" r="49" fill="none" stroke="#0B6638" strokeWidth="1.8" />

        {/* Top Arc - Nom du Biznis (ex: TI KOK BOUTIK) */}
        <path id="stampTopArc" d="M 20,80 A 60,60 0 1,1 140,80" fill="none" />
        <text fill="#0B6638" fontSize="12" fontWeight="900" letterSpacing="1.2">
          <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
            {nameUpper.length > 20 ? nameUpper.slice(0, 18) : nameUpper}
          </textPath>
        </text>

        {/* Etoiles Latérales Left & Right ★ */}
        <text x="14" y="84" fill="#0B6638" fontSize="12" fontWeight="900">★</text>
        <text x="138" y="84" fill="#0B6638" fontSize="12" fontWeight="900">★</text>

        {/* Bottom Arc - Slogan du Biznis (ex: BOUTIK PAW LA) */}
        <path id="stampBottomArc" d="M 140,80 A 60,60 0 0,1 20,80" fill="none" />
        <text fill="#0B6638" fontSize="11" fontWeight="900" letterSpacing="1.1">
          <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
            {sloganUpper.length > 22 ? sloganUpper.slice(0, 20) : sloganUpper}
          </textPath>
        </text>

        {/* Badge Central Incliné Rectangulaire ✓ PEYE avec Fond Blanc et Contour Epais */}
        <g transform="rotate(-7 80 80)">
          <rect x="25" y="57" width="110" height="46" rx="10" fill="#FFFFFF" stroke="#0B6638" strokeWidth="3.6" />
          <text x="80" y="88" fill="#0B6638" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
            ✓ PEYE
          </text>
        </g>
      </svg>
    </div>
  );
}

function RoosterLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
      <circle cx="34" cy="13" r="4.5" fill="#FFD34E" />
      <circle cx="41" cy="11" r="4" fill="#FFD34E" />
      <circle cx="47" cy="14" r="3.5" fill="#FFD34E" />
      <path d="M44 20a10 10 0 0 1 3 7c6 1 11 6 11 14 0 9-8 15-18 15-11 0-19-6-19-16 0-6 3-11 8-13-1-4 0-9 4-12 3-2 8-2 11 5z" fill="#008069" />
      <path d="M51 22l9 1-8 5z" fill="#FF8C42" />
      <path d="M50 28c0 4-2 6-4 6s-2-4 0-6 4-2 4 0z" fill="#FF6B6B" />
      <circle cx="45" cy="22" r="2.4" fill="#FFFFFF" />
    </svg>
  );
}
