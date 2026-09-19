import type { Currency } from "./types";

// Livre journal : toutes les opérations d'une période, une ligne par mouvement.
//
// Un comptable haïtien ne veut ni tableau de bord ni graphique : il veut des
// lignes datées, avec un tiers, un libellé, une entrée ou une sortie. Tant que
// CONVERZA n'exporte pas cela, le marchand tient un cahier en parallèle — et
// les deux finissent par se contredire.
//
// Le fichier produit s'ouvre dans Excel, LibreOffice ou Google Sheets :
// point-virgule comme séparateur (usage francophone), UTF-8 avec BOM pour que
// les accents ne se cassent pas, dates ISO pour que le tri fonctionne.

export type Journal = "vente" | "encaissement" | "depense" | "achat";

export interface LedgerEntry {
  /** Date de l'opération, AAAA-MM-JJ. */
  date: string;
  journal: Journal;
  /** Référence de la pièce : commande, achat, ou identifiant interne. */
  ref: string;
  /** Client ou fournisseur. */
  party: string;
  label: string;
  /** Argent qui entre (encaissement, vente). */
  inCents: number;
  /** Argent qui sort (dépense, achat). */
  outCents: number;
  method: string;
  currency: Currency;
}

export interface LedgerInput {
  currency: Currency;
  orders: { ref: string; customer: string; totalCents: number; status: string; createdAt: string; payMethod: string | null }[];
  payments: { orderRef: string; customer: string; amountCents: number; method: string | null; paidAt: string }[];
  expenses: { id: string; category: string; note: string | null; amountCents: number; method: string | null; spentOn: string }[];
  purchases: { id: string; supplier: string; totalCents: number; paidCents: number; method: string | null; receivedOn: string }[];
}

export interface LedgerTotals {
  sales: number;
  cashIn: number;
  expenses: number;
  purchases: number;
  /** Ce qui est réellement entré moins ce qui est sorti sur la période. */
  net: number;
}

const day = (iso: string) => (iso || "").slice(0, 10);

/**
 * Une vente et son encaissement sont deux lignes différentes : la première dit
 * ce qui a été vendu, la seconde ce qui est réellement rentré. Les confondre
 * est la faute la plus commune d'un cahier tenu à la main.
 */
export function buildLedger(input: LedgerInput): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  for (const o of input.orders) {
    entries.push({
      date: day(o.createdAt),
      journal: "vente",
      ref: o.ref,
      party: o.customer,
      label: o.status,
      inCents: o.totalCents,
      outCents: 0,
      method: o.payMethod ?? "",
      currency: input.currency,
    });
  }

  for (const p of input.payments) {
    entries.push({
      date: day(p.paidAt),
      journal: "encaissement",
      ref: p.orderRef,
      party: p.customer,
      label: "",
      inCents: p.amountCents,
      outCents: 0,
      method: p.method ?? "",
      currency: input.currency,
    });
  }

  for (const e of input.expenses) {
    entries.push({
      date: day(e.spentOn),
      journal: "depense",
      ref: e.id.slice(0, 8),
      party: "",
      label: [e.category, e.note].filter(Boolean).join(" — "),
      inCents: 0,
      outCents: e.amountCents,
      method: e.method ?? "",
      currency: input.currency,
    });
  }

  for (const a of input.purchases) {
    entries.push({
      date: day(a.receivedOn),
      journal: "achat",
      ref: a.id.slice(0, 8),
      party: a.supplier,
      label: "",
      inCents: 0,
      // Seul ce qui a été payé est une sortie d'argent ; le reste est une dette
      // fournisseur, elle n'appartient pas au journal de caisse.
      outCents: a.paidCents,
      method: a.method ?? "",
      currency: input.currency,
    });
  }

  return entries.sort((a, b) => (a.date === b.date ? a.journal.localeCompare(b.journal) : a.date.localeCompare(b.date)));
}

export function ledgerTotals(entries: LedgerEntry[]): LedgerTotals {
  const sum = (j: Journal, key: "inCents" | "outCents") =>
    entries.filter((e) => e.journal === j).reduce((n, e) => n + e[key], 0);
  const cashIn = sum("encaissement", "inCents");
  const expenses = sum("depense", "outCents");
  const purchases = sum("achat", "outCents");
  return { sales: sum("vente", "inCents"), cashIn, expenses, purchases, net: cashIn - expenses - purchases };
}

/** Une cellule CSV : les guillemets se doublent, tout le reste passe tel quel. */
function cell(value: string | number): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

/** Montant en unités entières, avec deux décimales et le point décimal. */
function amount(cents: number): string {
  return cents === 0 ? "" : (cents / 100).toFixed(2);
}

export interface LedgerCsvLabels {
  headers: [string, string, string, string, string, string, string, string, string];
  journals: Record<Journal, string>;
}

export function ledgerCsv(entries: LedgerEntry[], labels: LedgerCsvLabels): string {
  const lines = [labels.headers.map(cell).join(";")];
  for (const e of entries) {
    lines.push(
      [
        cell(e.date),
        cell(labels.journals[e.journal]),
        cell(e.ref),
        cell(e.party),
        cell(e.label),
        amount(e.inCents),
        amount(e.outCents),
        cell(e.method),
        cell(e.currency),
      ].join(";"),
    );
  }
  // BOM : sans lui, Excel ouvre les accents en caractères illisibles.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Nom de fichier lisible : boutique, période, date d'export. */
export function ledgerFileName(shopSlug: string, from: string, to: string): string {
  const clean = (s: string) => s.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "boutik";
  return `journal_${clean(shopSlug)}_${day(from)}_${day(to)}.csv`;
}
