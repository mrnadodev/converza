import { describe, expect, it } from "vitest";
import { csvCell, generateSalesReportCSV, reportColumns } from "./reports";
import { REPORT_COPY } from "./i18n/app/reports";
import type { PipelineCard, Product } from "./types";

const CARDS: PipelineCard[] = [
  { id: "o1", ref: "CMD-1", status: "livre", customerName: "Marie", phone_e164: "+50937124488", itemsSummary: "2 × Chemiz", totalCents: 1_800_000, owedCents: 1_800_000 },
  { id: "o2", ref: "CMD-2", status: "peye", customerName: "Jean", phone_e164: "+50931112222", itemsSummary: "1 × Soulye", totalCents: 500_000, owedCents: 0 },
];

const PRODUITS: Product[] = [
  { id: "p1", business_id: "b1", name: "Chemiz", category: "Homme · Vêtements", price_cents: 900_000, currency: "HTG", unit: null, stock_qty: 4, stock_state: "en_stok", photo_url: null, sold_count: 2, is_active: true },
  { id: "p2", business_id: "b1", name: "Soulye", category: null, price_cents: 500_000, currency: "HTG", unit: null, stock_qty: 0, stock_state: "fini", photo_url: null, sold_count: 1, is_active: true },
];

describe("csvCell", () => {
  it("entoure la valeur de guillemets et double ceux qui s'y trouvent", () => {
    expect(csvCell('Diri "Tchako"')).toBe('"Diri ""Tchako"""');
  });

  it("neutralise une cellule qui serait interprétée comme formule Excel", () => {
    for (const start of ["=", "+", "-", "@"]) {
      expect(csvCell(`${start}HYPERLINK("http://x")`)).toMatch(/^"'\\?/);
    }
    expect(csvCell("=1+1")).toBe("\"'=1+1\"");
  });

  it("laisse une valeur ordinaire intacte", () => {
    expect(csvCell("Wideline Pierre")).toBe('"Wideline Pierre"');
    expect(csvCell(0)).toBe('"0"');
    expect(csvCell(null)).toBe('""');
  });
});

describe("le CSV et la version imprimable sont le même rapport", () => {
  // Les deux avaient dérivé : l'étape avant le détail d'un côté, après de
  // l'autre, et deux chiffres du résumé absents de l'impression. Ce test tient
  // le CSV — la version imprimable lit les mêmes tableaux, par construction.
  const r = REPORT_COPY.fr;

  it("les en-têtes du CSV sont ceux de la définition partagée", () => {
    const csv = generateSalesReportCSV(CARDS, PRODUITS, "month", "Boutik", "fr");
    const lignes = csv.replace(/^﻿/, "").split("\r\n");
    const cols = reportColumns(r);
    expect(lignes).toContain(cols.products.map(csvCell).join(";"));
    expect(lignes).toContain(cols.orders.map(csvCell).join(";"));
  });

  it("le détail des articles précède l'étape, comme à l'impression", () => {
    const cols = reportColumns(r);
    expect(cols.orders.indexOf(r.orders.items)).toBeLessThan(cols.orders.indexOf(r.orders.stage));
  });

  it("les six chiffres du résumé sont tous présents", () => {
    const csv = generateSalesReportCSV(CARDS, PRODUITS, "month", "Boutik", "fr");
    for (const label of [r.summary.revenue, r.summary.paid, r.summary.owed, r.summary.stockValue, r.summary.orders, r.summary.lowStock]) {
      expect(csv).toContain(label);
    }
  });
});
