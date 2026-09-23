import { NextResponse } from "next/server";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { getMyBusiness } from "@/lib/data";
import { getLedger } from "@/lib/ledger";
import { buildLedger, ledgerCsv, ledgerFileName, type LedgerCsvLabels } from "@/lib/accounting";
import { KES_PERIODS, type KesPeriod } from "@/lib/kes-period";
import { COMMON_COPY } from "@/lib/i18n/app/common";
import type { Language } from "@/lib/i18n/translations";
import { effectivePlan } from "@/lib/plans";
import type { Currency } from "@/lib/types";

// Livre journal de la période, en CSV : le fichier que le marchand remet à son
// comptable. Réservé à qui peut voir les chiffres du commerce — il expose la
// caisse, les dépenses et les prix payés aux fournisseurs.
export async function GET(request: Request) {
  const me = await getMemberContext();
  if (!me) return new NextResponse("Non connecté", { status: 401 });

  const permissions = await getMemberPermissions();
  if (permissions && !permissions.canViewFinancialTurnover) {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const url = new URL(request.url);
  const asked = url.searchParams.get("p") ?? "month";
  const period: KesPeriod = KES_PERIODS.includes(asked as KesPeriod) ? (asked as KesPeriod) : "month";
  const lang = url.searchParams.get("lang") ?? "fr";

  const business = await getMyBusiness();
  if (effectivePlan(business.plan, business.plan_until) !== "premium") {
    return new NextResponse("Le livre journal fait partie du plan Premium.", { status: 403 });
  }
  const { input, from } = await getLedger(me.businessId, (business.default_currency as Currency) ?? "HTG", period);
  const statuses = (COMMON_COPY[lang as Language] ?? COMMON_COPY.fr).statuses as Record<string, string>;
  const readable = {
    ...input,
    orders: input.orders.map((o) => ({ ...o, status: statuses[o.status] ?? o.status })),
  };
  const csv = ledgerCsv(buildLedger(readable), LABELS[lang] ?? LABELS.fr);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ledgerFileName(business.slug ?? "boutik", from, today)}"`,
      "Cache-Control": "no-store",
    },
  });
}

// En-têtes du fichier : c'est un comptable qui les lit, pas l'application.
const LABELS: Record<string, LedgerCsvLabels> = {
  fr: {
    headers: ["Date", "Journal", "Référence", "Tiers", "Libellé", "Entrée", "Sortie", "Moyen", "Devise"],
    journals: { vente: "Vente", encaissement: "Encaissement", depense: "Dépense", achat: "Achat" },
  },
  ht: {
    headers: ["Dat", "Jounal", "Referans", "Moun", "Deskripsyon", "Antre", "Soti", "Mwayen", "Lajan"],
    journals: { vente: "Vant", encaissement: "Peman resevwa", depense: "Depans", achat: "Acha" },
  },
  en: {
    headers: ["Date", "Journal", "Reference", "Party", "Description", "In", "Out", "Method", "Currency"],
    journals: { vente: "Sale", encaissement: "Payment received", depense: "Expense", achat: "Purchase" },
  },
};
