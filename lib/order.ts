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

/** Libellés du message, pour l'écrire dans la langue choisie par le client. */
export interface OrderMessageLabels {
  greeting: (businessName: string) => string;
  delivery: string;
  total: string;
}

const KREYOL_LABELS: OrderMessageLabels = {
  greeting: (b) => `Bonjou ${b}! Mwen vle kòmande:`,
  delivery: "Livrezon",
  total: "Total",
};

export function buildOrderMessage(
  businessName: string,
  lines: CartLine[],
  opts?: { delivery?: DeliveryChoice; currency?: Currency; labels?: OrderMessageLabels },
): string {
  const currency = opts?.currency ?? "HTG";
  const labels = opts?.labels ?? KREYOL_LABELS;
  const rows = lines.map((l) => {
    const unit = l.unit ? ` (${l.unit})` : "";
    const lineTotal = formatMoney(Math.round(l.unitPriceCents * l.qty), currency);
    return `• ${l.qty}× ${l.name}${unit} — ${lineTotal}`;
  });
  const subtotal = lines.reduce((a, l) => a + Math.round(l.unitPriceCents * l.qty), 0);
  const parts = [labels.greeting(businessName), ...rows];

  let total = subtotal;
  const d = opts?.delivery;
  if (d) {
    if (d.feeCents > 0) {
      parts.push(`${labels.delivery} (${d.name}): ${formatMoney(d.feeCents, currency)}`);
      total += d.feeCents;
    } else {
      parts.push(`${labels.delivery}: ${d.name}`);
    }
  }
  parts.push(`${labels.total}: ${formatMoney(total, currency)}`);
  return parts.join("\n");
}

/** Message de relance douce pour une dette (étape Follow-up). */
export function buildDebtReminder(
  customerName: string,
  owedCents: number,
  currency: Currency = "HTG",
  businessName = "nou",
  m: MessageCopy = MESSAGE_COPY.ht,
): string {
  return m.debtReminder(customerName, formatMoney(owedCents, currency), businessName);
}

/** Message de re-commande pour un client fidèle inactif. */
export function buildReorderNudge(customerName: string, m: MessageCopy = MESSAGE_COPY.ht): string {
  return m.reorder(customerName);
}

/** Message WhatsApp d'alerte produit de nouveau en stock. */
export function buildBackInStockMessage(
  customerName: string,
  businessName: string,
  itemSummary?: string,
  m: MessageCopy = MESSAGE_COPY.ht,
): string {
  return m.backInStock(customerName, businessName, itemSummary);
}

/**
 * Bon de commande à envoyer au fournisseur, sur WhatsApp.
 *
 * Les lignes sont pré-remplies avec ce qui manque : l'application sait déjà
 * quels produits sont en stock faible ou épuisés, et le stockiste n'a aucune
 * raison de les retaper un à un. Il ne lui reste qu'à ajuster les quantités.
 *
 * La liste est plafonnée : au-delà d'une vingtaine de lignes, WhatsApp coupe
 * le message et le fournisseur reçoit une commande tronquée — pire que pas de
 * commande du tout, parce que personne ne s'en aperçoit.
 */
export function buildSupplierOrderMessage(
  supplierName: string,
  businessName: string,
  items: { name: string; qty: number }[],
  m: MessageCopy = MESSAGE_COPY.ht,
): string {
  const MAX = 20;
  const lignes = items.slice(0, MAX).map((it) => m.supplierOrderLine(it.name, it.qty));
  const reste = items.length - lignes.length;
  return [
    m.supplierOrderHead(supplierName, businessName),
    ...lignes,
    reste > 0 ? m.supplierOrderMore(reste) : null,
    lignes.length > 0 ? m.supplierOrderFoot() : m.supplierOrderEmpty(),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Message WhatsApp pour demander si le client est satisfait. */
export function buildSatisfactionMessage(customerName: string, businessName: string, m: MessageCopy = MESSAGE_COPY.ht): string {
  return m.satisfaction(customerName, businessName);
}

/** Message WhatsApp de promotion avec le lien de la vitrine. */
export function buildPromoMessage(
  customerName: string,
  businessName: string,
  slug: string,
  customText?: string | null,
  m: MessageCopy = MESSAGE_COPY.ht,
  baseUrl: string = storefrontBaseUrl(),
): string {
  const body = customText?.trim() || m.promoDefault(businessName);
  return `${m.promoGreeting(customerName)}\n\n${body}\n👉 ${baseUrl}/b/${slug}`;
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

import type { ActivePayMethodOption } from "./bank";
import { MESSAGE_COPY, type MessageCopy } from "./i18n/app/messages";

// Messages automatiques (1 clic) selon l'étape du pipeline.
export function buildContactPaymentMessage(
  name: string,
  ref: string,
  totalStr: string,
  activeOptions?: ActivePayMethodOption[],
  usdtAddress?: string | null,
  storedSecurityCode?: string | null,
  m: MessageCopy = MESSAGE_COPY.ht,
): string {
  const options =
    activeOptions && activeOptions.length > 0
      ? activeOptions.map((o) => `${o.num}. ${o.label}`).join(" / ")
      : `1. MonCash / 2. NatCash / 3. ${m.cashOnDelivery}`;
  const hasUsdt = activeOptions?.some((o) => o.id === "crypto_usdt");
  return m.contactPayment({
    name,
    ref,
    total: totalStr,
    code: getOrderSecurityCode(ref, storedSecurityCode),
    options,
    usdtAddress: hasUsdt && usdtAddress?.trim() ? usdtAddress.trim() : null,
  });
}

export function buildConfirmPaymentMessage(name: string, ref: string, businessName: string, m: MessageCopy = MESSAGE_COPY.ht): string {
  return m.confirmPayment(name, ref, businessName);
}

export function buildStatusMessage(
  status: string,
  opts: { business: string; name: string; ref: string; totalCents: number; currency?: Currency },
  m: MessageCopy = MESSAGE_COPY.ht,
): string {
  const { business, name, ref, totalCents } = opts;
  const total = formatMoney(totalCents, opts.currency ?? "HTG");
  switch (status) {
    case "demand_acha":
    case "pou_konfime":
      return m.newOrder(name, ref, total, business);
    case "kontak":
      return buildContactPaymentMessage(name, ref, total, undefined, null, null, m);
    case "konfime_peman":
    case "peye":
      return m.confirmPayment(name, ref, business);
    case "sou_wout":
      return m.onTheWay(name, business);
    case "livre":
      return m.delivered(name, business);
    case "swivi":
      return m.followUp(name, business);
    default:
      return m.hello(name, business);
  }
}