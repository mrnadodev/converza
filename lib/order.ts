import { formatMoney, type Currency } from "./money";

export interface CartLine {
  name: string;
  unit: string | null;
  qty: number;
  unitPriceCents: number;
}

/**
 * Construit le message WhatsApp d'une commande passée depuis la vitrine.
 * Ex:
 *   Bonjou Ti Kòk Boutik! Mwen vle kòmande:
 *   • 3× Ze fre (douzèn) — 540 HTG
 *   • 2× Pen konplè — 310 HTG
 *   Total: 850 HTG
 */
export interface DeliveryChoice {
  name: string;
  feeCents: number;
}

export function buildOrderMessage(
  businessName: string,
  lines: CartLine[],
  opts?: { delivery?: DeliveryChoice; currency?: Currency },
): string {
  const currency = opts?.currency ?? "HTG";
  const rows = lines.map((l) => {
    const unit = l.unit ? ` (${l.unit})` : "";
    const lineTotal = formatMoney(Math.round(l.unitPriceCents * l.qty), currency);
    return `• ${l.qty}× ${l.name}${unit} — ${lineTotal}`;
  });
  const subtotal = lines.reduce((a, l) => a + Math.round(l.unitPriceCents * l.qty), 0);
  const parts = [`Bonjou ${businessName}! Mwen vle kòmande:`, ...rows];

  let total = subtotal;
  const d = opts?.delivery;
  if (d) {
    if (d.feeCents > 0) {
      parts.push(`Livrezon (${d.name}): ${formatMoney(d.feeCents, currency)}`);
      total += d.feeCents;
    } else {
      parts.push(`Livrezon: ${d.name}`);
    }
  }
  parts.push(`Total: ${formatMoney(total, currency)}`);
  return parts.join("\n");
}

/** Message de relance douce pour une dette (étape Follow-up). */
export function buildDebtReminder(
  customerName: string,
  owedCents: number,
  currency: Currency = "HTG",
  businessName = "nou",
): string {
  return `Bonjou ${customerName}, se ${businessName}. Nou espere w byen! Nou vle raple w ke gen yon balans ${formatMoney(owedCents, currency)} ki rete pou kòmand ou an. Ou ka regle l lè w pare. Mèsi anpil!`;
}

/** Message de re-commande pour un client fidèle inactif. */
export function buildReorderNudge(customerName: string): string {
  return `Bonjou ${customerName}! Sa gen kèk tan nou pa wè w. Nou fèk resevwa nouvo pwodwi fre. Èske w bezwen nou prepare kòmand abityèl ou an?`;
}

/** Message WhatsApp d'alerte produit réapprovisionné / de nouveau en stock. */
export function buildBackInStockMessage(customerName: string, businessName: string, itemSummary?: string): string {
  const itemText = itemSummary ? ` (${itemSummary})` : "";
  return `Bonjou ${customerName} 👋 🔔 Nou kontan raple w ke pwodwi ou te mande a${itemText} rive epi li disponib ankò nan ${businessName}! Èske w ta renmen nou prepare kòmand ou an kounye a?`;
}

/** Message WhatsApp pour demander si le client est satisfait. */
export function buildSatisfactionMessage(customerName: string, businessName: string): string {
  return `Bonjou ${customerName} 👋 Se ${businessName} ki t ap kontakte w. Nou t ap tcheke si ou byen resevwa kòmand ou an e si w satisfè ak pwodwi yo? Opinyon ou enpòtan anpil pou nou! ⭐`;
}

/** Message WhatsApp de promotion de nouveaux produits avec lien de la vitrine. */
export function buildPromoMessage(
  customerName: string,
  businessName: string,
  slug: string,
  customText?: string | null,
): string {
  const storefrontUrl = `${storefrontBaseUrl()}/b/${slug}`;
  const header = `Bonjou ${customerName} 👋\n\n`;
  const basePromo = customText?.trim()
    ? customText.trim()
    : `🔥 *NOUVO PWODWI AK PROMOSYON NAN ${businessName.toUpperCase()}!* 🔥\n\nNou fèk resevwa nouvo pwodwi ak bèl rabi nan boutik la! 🎁\n\nVini tcheke vitrin nou an kounye a sou lyen sa a:`;

  return `${header}${basePromo}\n👉 ${storefrontUrl}`;
}

/**
 * Base publique de la vitrine. Configurable par déploiement — sans ça, les liens
 * promo pointeraient vers un domaine codé en dur.
 */
export function storefrontBaseUrl(): string {
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  const raw = process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "");
  return raw.trim().replace(/\/+$/, "") || "https://converza.app";
}

/** Code de sécurité à 4 chiffres, imprévisible, tiré une seule fois à la création. */
export function generateOrderSecurityCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(1000 + (buf[0] % 9000));
}

/**
 * Code de sécurité d'une commande : celui stocké en base fait foi.
 * Le repli déterministe ne sert qu'aux commandes de démo créées avant la
 * migration — il est devinable et ne doit jamais protéger une vraie livraison.
 */
export function getOrderSecurityCode(ref: string | number, stored?: string | null): string {
  if (stored && /^\d{4}$/.test(stored)) return stored;
  const numStr = String(ref).replace(/\D/g, "");
  const num = parseInt(numStr || "144", 10);
  const pin = ((num * 17 + 389) % 9000) + 1000;
  return String(pin);
}

import { getActivePayMethods, type ActivePayMethodOption } from "./bank";

// Messages automatiques (1 clic) selon l'étape du pipeline.
export function buildContactPaymentMessage(
  name: string,
  ref: string,
  totalStr: string,
  activeOptions?: ActivePayMethodOption[],
  usdtAddress?: string | null,
  storedSecurityCode?: string | null,
): string {
  const securityCode = getOrderSecurityCode(ref, storedSecurityCode);
  const optionsList =
    activeOptions && activeOptions.length > 0
      ? activeOptions.map((o) => `${o.num}. ${o.label}`).join(" / ")
      : "1. MonCash / 2. Natcash / 3. Kach nan livrezon";

  let usdtDetails = "";
  const hasUsdtInOptions = activeOptions?.some((o) => o.id === "crypto_usdt");
  if (hasUsdtInOptions && usdtAddress && usdtAddress.trim().length > 0) {
    usdtDetails = `\n\n🪙 *Adrès USDT (TRC-20):*\n${usdtAddress.trim()}\n⚠️ *(NB: verifier avant de copier)*`;
  }

  return `Bonjou ${name} 👋 Nou resevwa Kòmand ou #${ref}, Total: ${totalStr}.\n\n🔑 *Kòd Sekirite ou: ${securityCode}*\n⚠️ *(Gade kòd sa a! Ou ap bay livrè a oswa ajan nan boutik la li pou w ka resevwa pwodwi ou yo).* \n\nPa ki mwayen ou ta renmen peye? “ ${optionsList} "${usdtDetails}`;
}

export function buildConfirmPaymentMessage(name: string, ref: string, businessName: string): string {
  return `Bonjou ${name} Nou resevwa pèman ou #${ref}. Nou voye resi a pou ou. N ap konfime livrezon an byento. — ${businessName}`;
}

export function buildStatusMessage(
  status: string,
  opts: { business: string; name: string; ref: string; totalCents: number; currency?: Currency },
): string {
  const { business, name, ref, totalCents } = opts;
  const total = formatMoney(totalCents, opts.currency ?? "HTG");
  switch (status) {
    case "demand_acha":
    case "pou_konfime":
      return `Bonjou ${name} 👋\nNou resevwa kòmand ou #${ref}.\nTotal: ${total}.\nN ap konfime livrezon an byento.\n— ${business}`;
    case "kontak":
      return buildContactPaymentMessage(name, ref, total);
    case "konfime_peman":
    case "peye":
      return buildConfirmPaymentMessage(name, ref, business);
    case "sou_wout":
      return `Bonjou ${name} 👋 Acha ou a deja kite lokal nou, w ap resevwa l byento. Mèsi pou pasyans ou! — ${business}`;
    case "livre":
      return `Bonjou ${name} 👋 ${business} te kontan fè tranzaksyon avèk ou. Mèsi, n ap ret tann ou ankò!`;
    case "swivi":
      return `Bonjou ${name} 👋 Nou t ap tcheke si ou toujou enterese nan sa ou te mande a. Nou la pou ede w!\n— ${business}`;
    default:
      return `Bonjou ${name}! — ${business}`;
  }
}

// Libellé du bouton d'envoi selon l'étape.
export function statusMessageLabel(status: string): string {
  return (
    {
      demand_acha: "Deplase – Kontak",
      pou_konfime: "Akize resepsyon",
      kontak: "Akize resepsyon - Metod pèman",
      metod_peman: "Voye Fakti pa WhatsApp",
      konfime_peman: "Konfime Pèman",
      peye: "Resi peman",
      sou_wout: "Voye « sou wout »",
      livre: "Voye « konfime livrezon »",
      swivi: "Voye relans",
    }[status] ?? "Voye mesaj"
  );
}
