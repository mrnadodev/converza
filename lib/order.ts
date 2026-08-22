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
export function buildDebtReminder(customerName: string, owedCents: number, currency: Currency = "HTG"): string {
  return `Bonjou ${customerName}, se Ti Kòk Boutik. Nou espere w byen! Nou vle raple w ke gen yon balans ${formatMoney(owedCents, currency)} ki rete pou kòmand ou an. Ou ka regle l sou MonCash lè w pare. Mèsi anpil!`;
}

/** Message de re-commande pour un client fidèle inactif. */
export function buildReorderNudge(customerName: string): string {
  return `Bonjou ${customerName}! Sa gen kèk tan nou pa wè w. Nou fèk resevwa nouvo pwodwi fre. Èske w bezwen nou prepare kòmand abityèl ou an?`;
}

// Messages automatiques (1 clic) selon l'étape du pipeline.
export function buildStatusMessage(
  status: string,
  opts: { business: string; name: string; ref: string; totalCents: number; currency?: Currency },
): string {
  const { business, name, ref, totalCents } = opts;
  const total = formatMoney(totalCents, opts.currency ?? "HTG");
  switch (status) {
    case "pou_konfime":
      return `Bonjou ${name} 👋\nNou resevwa kòmand ou #${ref}.\nTotal: ${total}.\nN ap konfime livrezon an byento.\n— ${business}`;
    case "peye":
      return `✅ Nou resevwa peman an.\nKòmand #${ref} konfime. Mèsi ${name}!\n— ${business}`;
    case "livre":
      return `🚚 Bonjou ${name}, kòmand #${ref} ou an sou wout!\n— ${business}`;
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
      pou_konfime: "Voye konfimasyon",
      peye: "Voye resi peman",
      livre: "Voye « sou wout »",
      swivi: "Voye relans",
    }[status] ?? "Voye mesaj"
  );
}
