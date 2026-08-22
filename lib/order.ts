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
export function buildOrderMessage(
  businessName: string,
  lines: CartLine[],
  currency: Currency = "HTG",
): string {
  const rows = lines.map((l) => {
    const unit = l.unit ? ` (${l.unit})` : "";
    const lineTotal = formatMoney(Math.round(l.unitPriceCents * l.qty), currency);
    return `• ${l.qty}× ${l.name}${unit} — ${lineTotal}`;
  });
  const totalCents = lines.reduce((a, l) => a + Math.round(l.unitPriceCents * l.qty), 0);
  return [
    `Bonjou ${businessName}! Mwen vle kòmande:`,
    ...rows,
    `Total: ${formatMoney(totalCents, currency)}`,
  ].join("\n");
}

/** Message de relance douce pour une dette (étape Follow-up). */
export function buildDebtReminder(customerName: string, owedCents: number, currency: Currency = "HTG"): string {
  return `Bonjou ${customerName}, se Ti Kòk Boutik. Nou espere w byen! Nou vle raple w ke gen yon balans ${formatMoney(owedCents, currency)} ki rete pou kòmand ou an. Ou ka regle l sou MonCash lè w pare. Mèsi anpil!`;
}

/** Message de re-commande pour un client fidèle inactif. */
export function buildReorderNudge(customerName: string): string {
  return `Bonjou ${customerName}! Sa gen kèk tan nou pa wè w. Nou fèk resevwa nouvo pwodwi fre. Èske w bezwen nou prepare kòmand abityèl ou an?`;
}
