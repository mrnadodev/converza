import type { Language } from "../translations";
import type { PayMethod } from "../../types";

export interface InvoiceShareInput {
  name: string;
  ref: string;
  code: string;
  subtotal: string;
  delivery: string;
  total: string;
  method: string;
  rate?: string | null;
  usdtAddress?: string | null;
}

export interface InvoiceCopy {
  tabs: { invoice: string; receipt: string };
  actions: { download: string; print: string; close: string; send: (isInvoice: boolean) => string; generating: string };
  selectors: { payment: string; currency: string; format: string };
  currencies: { htg: string; usd: string; both: string };
  formats: { thermal80: string; thermal58: string; letter: string };
  payMethods: Record<PayMethod | "lot", string>;
  doc: {
    invoiceBadge: string;
    receiptBadge: string;
    number: string;
    phone: string;
    customer: string;
    paymentStatus: string;
    unpaid: string;
    paid: string;
    partial: string;
    deposit: string;
    remaining: string;
    rate: (rate: string) => string;
    securityCode: string;
    securityHint: string;
    product: string;
    qty: string;
    unitPrice: string;
    total: string;
    subtotal: string;
    delivery: string;
    totalDue: string;
    totalPaid: string;
    paymentMeans: (method: string) => string;
    holder: string;
    account: string;
    cash: string;
    other: string;
    receiptFor: (method: string) => string;
    notConfigured: (method: string) => string;
    stamp: string;
  };
  share: {
    invoice: (i: InvoiceShareInput) => string;
    receipt: (name: string, ref: string, code: string, business: string) => string;
  };
}

const payMethodsBase: Record<PayMethod | "lot", string> = {
  moncash: "MonCash",
  natcash: "NatCash",
  crypto_usdt: "USDT (TRC-20)",
  zelle: "Zelle",
  unibank_htg: "Unibank (HTG)",
  unibank_usd: "Unibank (USD)",
  buh_htg: "BUH (HTG)",
  buh_usd: "BUH (USD)",
  sogebank_htg: "Sogebank (HTG)",
  sogebank_usd: "Sogebank (USD)",
  banque_locale: "Banque locale",
  kach: "Cash",
  lot: "Autre",
};

const fr: InvoiceCopy = {
  tabs: { invoice: "Facture", receipt: "Reçu" },
  actions: {
    download: "Image",
    print: "Imprimer",
    close: "Fermer",
    send: (isInvoice) => (isInvoice ? "Envoyer la facture sur WhatsApp" : "Envoyer le reçu sur WhatsApp"),
    generating: "Génération de l'image…",
  },
  selectors: { payment: "Paiement", currency: "Devise", format: "Format" },
  currencies: { htg: "HTG (gourdes)", usd: "USD ($)", both: "HTG + USD" },
  formats: { thermal80: "Ticket 80 mm", thermal58: "Ticket 58 mm", letter: "Papier 8,5 × 11 po" },
  payMethods: { ...payMethodsBase, kach: "Cash à la livraison", banque_locale: "Banque locale", lot: "Autre" },
  doc: {
    invoiceBadge: "FACTURE",
    receiptBadge: "REÇU OFFICIEL",
    number: "N°",
    phone: "Tél.",
    customer: "Client",
    paymentStatus: "Statut du paiement",
    unpaid: "En attente de paiement",
    paid: "Payé",
    partial: "Paiement partiel",
    deposit: "Acompte reçu",
    remaining: "Reste à payer",
    rate: (rate) => `Taux : 1 USD = ${rate} HTG`,
    securityCode: "Code de retrait / livraison",
    securityHint: "À donner au livreur ou en boutique pour recevoir la commande.",
    product: "Produit",
    qty: "Qté",
    unitPrice: "Prix unit.",
    total: "Total",
    subtotal: "Sous-total",
    delivery: "Livraison",
    totalDue: "TOTAL À PAYER",
    totalPaid: "TOTAL PAYÉ",
    paymentMeans: (method) => `Moyen de paiement (${method})`,
    holder: "Titulaire",
    account: "Compte",
    cash: "Cash à la livraison",
    other: "Autre moyen de paiement convenu.",
    receiptFor: (method) => `Reçu officiel du paiement (${method}).`,
    notConfigured: (method) => `${method} n'est pas encore configuré dans vos paramètres.`,
    stamp: "PAYÉ",
  },
  share: {
    invoice: (i) =>
      `Bonjour ${i.name},\nVoici votre facture pour la commande #${i.ref}.\n\n🔑 *Code de retrait : ${i.code}*\nGardez ce code : vous le donnerez au livreur ou en boutique.\n\nSous-total : ${i.subtotal}\nLivraison : ${i.delivery}\nTotal à payer : ${i.total}` +
      (i.rate ? `\n(1 USD = ${i.rate} HTG)` : "") +
      `\nPaiement par ${i.method}` +
      (i.usdtAddress ? `\n\nAdresse USDT (TRC-20) :\n${i.usdtAddress}\nVérifiez l'adresse avant d'envoyer.` : ""),
    receipt: (name, ref, code, business) =>
      `Bonjour ${name}, nous avons bien reçu votre paiement pour la commande #${ref}. Voici votre reçu. Code de retrait : ${code}. — ${business}`,
  },
};

const ht: InvoiceCopy = {
  tabs: { invoice: "Fakti", receipt: "Resi" },
  actions: {
    download: "Imaj",
    print: "Enprime",
    close: "Fèmen",
    send: (isInvoice) => (isInvoice ? "Voye fakti a sou WhatsApp" : "Voye resi a sou WhatsApp"),
    generating: "N ap kreye imaj la…",
  },
  selectors: { payment: "Pèman", currency: "Deviz", format: "Fòma" },
  currencies: { htg: "HTG (goud)", usd: "USD ($)", both: "HTG + USD" },
  formats: { thermal80: "Tikè 80 mm", thermal58: "Tikè 58 mm", letter: "Papye 8,5 × 11 po" },
  payMethods: { ...payMethodsBase, kach: "Kach nan livrezon", banque_locale: "Bank lokal", lot: "Lòt" },
  doc: {
    invoiceBadge: "FAKTI",
    receiptBadge: "RESI OFISYÈL",
    number: "Nimewo",
    phone: "Tel.",
    customer: "Kliyan",
    paymentStatus: "Estati pèman",
    unpaid: "Poko peye",
    paid: "Peye",
    partial: "Peman pasyèl",
    deposit: "Avans resevwa",
    remaining: "Rete pou peye",
    rate: (rate) => `To : 1 USD = ${rate} HTG`,
    securityCode: "Kòd ranmase / livrezon",
    securityHint: "Bay livrè a oswa moun nan boutik la li pou w resevwa kòmand lan.",
    product: "Pwodwi",
    qty: "Kantite",
    unitPrice: "Pri inite",
    total: "Total",
    subtotal: "Sou-total",
    delivery: "Livrezon",
    totalDue: "TOTAL POU PEYE",
    totalPaid: "TOTAL KI PEYE",
    paymentMeans: (method) => `Mwayen pèman (${method})`,
    holder: "Titilè",
    account: "Kont",
    cash: "Kach nan livrezon",
    other: "Yon lòt mwayen pèman antann.",
    receiptFor: (method) => `Resi ofisyèl pèman an (${method}).`,
    notConfigured: (method) => `${method} poko konfigire nan reglaj ou yo.`,
    stamp: "PEYE",
  },
  share: {
    invoice: (i) =>
      `Bonjou ${i.name},\nMen fakti ou pou kòmand #${i.ref}.\n\n🔑 *Kòd ranmase : ${i.code}*\nKenbe kòd sa a : w ap bay livrè a oswa moun nan boutik la li.\n\nSou-total : ${i.subtotal}\nLivrezon : ${i.delivery}\nTotal pou peye : ${i.total}` +
      (i.rate ? `\n(1 USD = ${i.rate} HTG)` : "") +
      `\nPèman ak ${i.method}` +
      (i.usdtAddress ? `\n\nAdrès USDT (TRC-20) :\n${i.usdtAddress}\nVerifye adrès la anvan w voye.` : ""),
    receipt: (name, ref, code, business) =>
      `Bonjou ${name}, nou resevwa pèman ou pou kòmand #${ref}. Men resi a. Kòd ranmase : ${code}. — ${business}`,
  },
};

const en: InvoiceCopy = {
  tabs: { invoice: "Invoice", receipt: "Receipt" },
  actions: {
    download: "Image",
    print: "Print",
    close: "Close",
    send: (isInvoice) => (isInvoice ? "Send the invoice on WhatsApp" : "Send the receipt on WhatsApp"),
    generating: "Creating the image…",
  },
  selectors: { payment: "Payment", currency: "Currency", format: "Format" },
  currencies: { htg: "HTG (gourdes)", usd: "USD ($)", both: "HTG + USD" },
  formats: { thermal80: "80 mm receipt", thermal58: "58 mm receipt", letter: "Letter 8.5 × 11 in" },
  payMethods: { ...payMethodsBase, kach: "Cash on delivery", banque_locale: "Local bank", lot: "Other" },
  doc: {
    invoiceBadge: "INVOICE",
    receiptBadge: "OFFICIAL RECEIPT",
    number: "No.",
    phone: "Phone",
    customer: "Customer",
    paymentStatus: "Payment status",
    unpaid: "Awaiting payment",
    paid: "Paid",
    partial: "Partial payment",
    deposit: "Deposit received",
    remaining: "Left to pay",
    rate: (rate) => `Rate: 1 USD = ${rate} HTG`,
    securityCode: "Pickup / delivery code",
    securityHint: "Give it to the courier or at the store to receive the order.",
    product: "Product",
    qty: "Qty",
    unitPrice: "Unit price",
    total: "Total",
    subtotal: "Subtotal",
    delivery: "Delivery",
    totalDue: "TOTAL DUE",
    totalPaid: "TOTAL PAID",
    paymentMeans: (method) => `Payment method (${method})`,
    holder: "Account holder",
    account: "Account",
    cash: "Cash on delivery",
    other: "Another agreed payment method.",
    receiptFor: (method) => `Official payment receipt (${method}).`,
    notConfigured: (method) => `${method} is not set up in your settings yet.`,
    stamp: "PAID",
  },
  share: {
    invoice: (i) =>
      `Hello ${i.name},\nHere is your invoice for order #${i.ref}.\n\n🔑 *Pickup code: ${i.code}*\nKeep this code: give it to the courier or at the store.\n\nSubtotal: ${i.subtotal}\nDelivery: ${i.delivery}\nTotal due: ${i.total}` +
      (i.rate ? `\n(1 USD = ${i.rate} HTG)` : "") +
      `\nPayment by ${i.method}` +
      (i.usdtAddress ? `\n\nUSDT address (TRC-20):\n${i.usdtAddress}\nDouble-check the address before sending.` : ""),
    receipt: (name, ref, code, business) =>
      `Hello ${name}, we received your payment for order #${ref}. Here is your receipt. Pickup code: ${code}. — ${business}`,
  },
};

export const INVOICE_COPY: Record<Language, InvoiceCopy> = { fr, ht, en };
