import { describe, expect, it } from "vitest";
import { buildLedger, ledgerCsv, ledgerFileName, ledgerTotals, type LedgerCsvLabels, type LedgerInput } from "./accounting";

const labels: LedgerCsvLabels = {
  headers: ["Date", "Journal", "Reference", "Tiers", "Libelle", "Entree", "Sortie", "Moyen", "Devise"],
  journals: { vente: "Vente", encaissement: "Encaissement", depense: "Depense", achat: "Achat" },
};

const input = (over: Partial<LedgerInput> = {}): LedgerInput => ({
  currency: "HTG",
  orders: [],
  payments: [],
  expenses: [],
  purchases: [],
  ...over,
});

describe("livre journal", () => {
  it("sépare la vente de son encaissement", () => {
    // La commande vaut 1 000, le client n'a versé que 400 : deux lignes, deux
    // montants. Les confondre fait croire à 1 000 de caisse.
    const entries = buildLedger(
      input({
        orders: [{ ref: "CMD-1", customer: "Wideline", totalCents: 100_000, status: "livre", createdAt: "2026-09-01T10:00:00Z", payMethod: "moncash" }],
        payments: [{ orderRef: "CMD-1", customer: "Wideline", amountCents: 40_000, method: "moncash", paidAt: "2026-09-02T09:00:00Z" }],
      }),
    );
    expect(entries.map((e) => [e.journal, e.inCents])).toEqual([
      ["vente", 100_000],
      ["encaissement", 40_000],
    ]);
    expect(ledgerTotals(entries)).toMatchObject({ sales: 100_000, cashIn: 40_000 });
  });

  it("ne sort en caisse que la part payée d'un achat", () => {
    const entries = buildLedger(
      input({
        purchases: [{ id: "abcdef1234", supplier: "Dépôt Delmas", totalCents: 500_000, paidCents: 200_000, method: "kach", receivedOn: "2026-09-03" }],
      }),
    );
    expect(entries[0]).toMatchObject({ journal: "achat", outCents: 200_000, party: "Dépôt Delmas" });
    expect(ledgerTotals(entries).purchases).toBe(200_000);
  });

  it("calcule ce qui reste réellement : encaissé moins dépenses et achats payés", () => {
    const entries = buildLedger(
      input({
        orders: [{ ref: "CMD-2", customer: "Jean", totalCents: 900_000, status: "livre", createdAt: "2026-09-05", payMethod: null }],
        payments: [{ orderRef: "CMD-2", customer: "Jean", amountCents: 300_000, method: "kach", paidAt: "2026-09-05" }],
        expenses: [{ id: "e1", category: "transport", note: "Course", amountCents: 20_000, method: "kach", spentOn: "2026-09-06" }],
        purchases: [{ id: "p1", supplier: "Dépôt", totalCents: 100_000, paidCents: 50_000, method: "kach", receivedOn: "2026-09-07" }],
      }),
    );
    // La vente de 9 000 n'entre pas en caisse : seuls 3 000 sont rentrés.
    expect(ledgerTotals(entries)).toEqual({ sales: 900_000, cashIn: 300_000, expenses: 20_000, purchases: 50_000, net: 230_000 });
  });

  it("classe par date, du plus ancien au plus récent", () => {
    const entries = buildLedger(
      input({
        expenses: [{ id: "tard", category: "loyer", note: null, amountCents: 1, method: null, spentOn: "2026-09-20" }],
        purchases: [{ id: "tot", supplier: "X", totalCents: 1, paidCents: 1, method: null, receivedOn: "2026-09-02" }],
      }),
    );
    expect(entries.map((e) => e.date)).toEqual(["2026-09-02", "2026-09-20"]);
  });

  it("ramène un horodatage complet à une date", () => {
    const entries = buildLedger(
      input({ orders: [{ ref: "CMD-3", customer: "", totalCents: 100, status: "livre", createdAt: "2026-09-08T23:45:12.345Z", payMethod: null }] }),
    );
    expect(entries[0].date).toBe("2026-09-08");
  });

  it("produit un fichier lisible par Excel, accents compris", () => {
    const csv = ledgerCsv(
      buildLedger(input({ expenses: [{ id: "e1", category: "électricité", note: 'Groupe "Nord"', amountCents: 12_345, method: "kach", spentOn: "2026-09-04" }] })),
      labels,
    );
    expect(csv.startsWith("﻿")).toBe(true);
    const rows = csv.replace("﻿", "").trim().split("\r\n");
    expect(rows[0]).toBe('"Date";"Journal";"Reference";"Tiers";"Libelle";"Entree";"Sortie";"Moyen";"Devise"');
    // Les guillemets du libellé sont doublés, le montant est en unités.
    expect(rows[1]).toContain('"électricité — Groupe ""Nord"""');
    expect(rows[1]).toContain(";123.45;");
  });

  it("laisse la case vide plutôt que d'écrire un zéro", () => {
    const csv = ledgerCsv(
      buildLedger(input({ orders: [{ ref: "CMD-4", customer: "A", totalCents: 5_000, status: "livre", createdAt: "2026-09-09", payMethod: null }] })),
      labels,
    );
    const row = csv.replace("﻿", "").trim().split("\r\n")[1];
    expect(row.endsWith(';50.00;;"";"HTG"')).toBe(true);
  });

  it("nomme le fichier avec la boutique et la période", () => {
    expect(ledgerFileName("Ti Kòk Boutik", "2026-09-01T00:00:00Z", "2026-09-30")).toBe("journal_tikkboutik_2026-09-01_2026-09-30.csv");
    expect(ledgerFileName("", "2026-09-01", "2026-09-30")).toBe("journal_boutik_2026-09-01_2026-09-30.csv");
  });

  it("rend un fichier avec seulement l'en-tête quand il n'y a rien", () => {
    const csv = ledgerCsv([], labels);
    expect(csv.replace("﻿", "").trim().split("\r\n")).toHaveLength(1);
    expect(ledgerTotals([])).toEqual({ sales: 0, cashIn: 0, expenses: 0, purchases: 0, net: 0 });
  });
});
