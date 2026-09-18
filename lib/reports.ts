import { formatMoney } from "./money";
import { COMMON_COPY } from "./i18n/app/common";
import { REPORT_COPY, type ReportCopy } from "./i18n/app/reports";
import type { Language } from "./i18n/translations";
import type { PipelineCard, Product } from "./types";

/**
 * Prépare une valeur pour une cellule CSV. Le préfixe `'` neutralise
 * l'injection de formule : Excel exécute une cellule qui commence par
 * `=`, `+`, `-` ou `@`, et ces valeurs viennent en partie des clients.
 */
export function csvCell(value: unknown): string {
  const s = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/**
 * Échappe une valeur avant insertion dans le HTML du rapport imprimable.
 * Les noms de produits et de clients peuvent venir d'une commande passée depuis
 * la vitrine publique : sans échappement, un nom contenant du balisage
 * s'exécuterait dans la fenêtre d'impression du marchand.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Timeframe = "week" | "month" | "all";

interface ReportTotals {
  revenueCents: number;
  paidCents: number;
  owedCents: number;
  stockValueCents: number;
  lowStockCount: number;
}

function totalsOf(cards: PipelineCard[], products: Product[]): ReportTotals {
  const revenueCents = cards.reduce((acc, c) => acc + c.totalCents, 0);
  const owedCents = cards.reduce((acc, c) => acc + c.owedCents, 0);
  return {
    revenueCents,
    owedCents,
    paidCents: revenueCents - owedCents,
    stockValueCents: products.reduce((acc, p) => acc + p.price_cents * (p.stock_qty ?? 0), 0),
    lowStockCount: products.filter((p) => p.stock_state === "ba_stok" || p.stock_state === "fini").length,
  };
}

function dateStr(language: Language): string {
  const locale = language === "en" ? "en-US" : "fr-FR";
  return new Date().toLocaleDateString(locale);
}

/**
 * Rapport ventes et stock au format CSV (UTF-8 avec BOM, lisible par Excel).
 * Les libellés suivent la langue choisie par le marchand : le rapport n'était
 * disponible qu'en créole, quelle que soit la langue de l'application.
 */
export function generateSalesReportCSV(
  cards: PipelineCard[],
  products: Product[],
  timeframe: Timeframe = "month",
  businessName = "",
  language: Language = "fr",
): string {
  const r: ReportCopy = REPORT_COPY[language] ?? REPORT_COPY.fr;
  const statuses = (COMMON_COPY[language] ?? COMMON_COPY.fr).statuses;
  const t = totalsOf(cards, products);
  const lines: string[] = [];

  lines.push(csvCell(r.title(businessName)));
  lines.push(csvCell(r.period(r.periods[timeframe], dateStr(language))));
  lines.push("");

  lines.push(csvCell(r.summary.title));
  lines.push([csvCell(r.summary.revenue), csvCell(formatMoney(t.revenueCents))].join(";"));
  lines.push([csvCell(r.summary.paid), csvCell(formatMoney(t.paidCents))].join(";"));
  lines.push([csvCell(r.summary.owed), csvCell(formatMoney(t.owedCents))].join(";"));
  lines.push([csvCell(r.summary.stockValue), csvCell(formatMoney(t.stockValueCents))].join(";"));
  lines.push([csvCell(r.summary.orders), csvCell(cards.length)].join(";"));
  lines.push([csvCell(r.summary.lowStock), csvCell(t.lowStockCount)].join(";"));
  lines.push("");

  lines.push(csvCell(r.products.title(products.length)));
  lines.push(
    [
      r.products.name,
      r.products.category,
      r.products.unitPrice,
      r.products.currency,
      r.products.remaining,
      r.products.sold,
      r.products.state,
    ]
      .map(csvCell)
      .join(";"),
  );
  for (const p of products) {
    lines.push(
      [
        csvCell(p.name),
        csvCell(p.category || r.products.other),
        csvCell((p.price_cents / 100).toFixed(2)),
        csvCell(p.currency),
        csvCell(p.stock_qty ?? 0),
        csvCell(p.sold_count ?? 0),
        csvCell(r.products.states[p.stock_state]),
      ].join(";"),
    );
  }
  lines.push("");

  lines.push(csvCell(r.orders.title(cards.length)));
  lines.push(
    [r.orders.ref, r.orders.customer, r.orders.phone, r.orders.stage, r.orders.items, r.orders.total, r.orders.owed]
      .map(csvCell)
      .join(";"),
  );
  for (const c of cards) {
    lines.push(
      [
        csvCell(`#${c.ref}`),
        csvCell(c.customerName),
        csvCell(c.phone_e164),
        csvCell(statuses[c.status] ?? c.status),
        csvCell(c.itemsSummary || r.orders.itemsFallback),
        csvCell(formatMoney(c.totalCents)),
        csvCell(formatMoney(c.owedCents)),
      ].join(";"),
    );
  }

  return "﻿" + lines.join("\r\n");
}

/** Ouvre la version imprimable (PDF via l'impression du navigateur). */
export function triggerSalesReportPDF(
  cards: PipelineCard[],
  products: Product[],
  timeframe: Timeframe = "month",
  businessName = "",
  language: Language = "fr",
) {
  if (typeof window === "undefined") return;

  const r: ReportCopy = REPORT_COPY[language] ?? REPORT_COPY.fr;
  const statuses = (COMMON_COPY[language] ?? COMMON_COPY.fr).statuses;
  const t = totalsOf(cards, products);

  const printWin = window.open("", "_blank");
  if (!printWin) return;

  const stockBadge = (p: Product) =>
    p.stock_state === "fini" ? "badge-danger" : p.stock_state === "ba_stok" ? "badge-warning" : "badge-success";

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="${esc(language)}">
      <head>
        <meta charset="utf-8" />
        <title>${esc(r.title(businessName))}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; color: #111B21; background: #fff; }
          h1 { font-size: 22px; margin-bottom: 4px; color: #008069; }
          h3 { font-size: 15px; margin: 24px 0 8px; }
          .sub { font-size: 13px; color: #667781; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { background: #F7F8F9; border: 1px solid #E9EDEF; border-radius: 12px; padding: 12px; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #667781; font-weight: bold; }
          .card-val { font-size: 18px; font-weight: 800; color: #111B21; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; }
          th { text-align: left; background: #E7F7F1; padding: 8px 10px; font-weight: 700; color: #008069; border-bottom: 2px solid #B9F5E4; }
          td { padding: 8px 10px; border-bottom: 1px solid #E9EDEF; vertical-align: top; }
          .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; display: inline-block; background: #F1F5F9; color: #334155; }
          .badge-danger { background: #FCE4E4; color: #C0392B; }
          .badge-warning { background: #FEF3C7; color: #92400E; }
          .badge-success { background: #D1FAE5; color: #065F46; }
          .items-cell { color: #075E54; font-weight: 600; }
          @media print { @page { margin: 1.5cm; } }
        </style>
      </head>
      <body>
        <h1>${esc(r.title(businessName))}</h1>
        <div class="sub">${esc(r.period(r.periods[timeframe], dateStr(language)))}</div>

        <div class="grid">
          <div class="card"><div class="card-title">${esc(r.summary.revenue)}</div><div class="card-val">${esc(formatMoney(t.revenueCents))}</div></div>
          <div class="card"><div class="card-title">${esc(r.summary.paid)}</div><div class="card-val" style="color:#008069">${esc(formatMoney(t.paidCents))}</div></div>
          <div class="card"><div class="card-title">${esc(r.summary.owed)}</div><div class="card-val" style="color:#B25E09">${esc(formatMoney(t.owedCents))}</div></div>
          <div class="card"><div class="card-title">${esc(r.summary.stockValue)}</div><div class="card-val">${esc(formatMoney(t.stockValueCents))}</div></div>
        </div>

        <h3>${esc(r.products.title(products.length))}</h3>
        <table>
          <thead>
            <tr>
              <th>${esc(r.products.name)}</th>
              <th>${esc(r.products.category)}</th>
              <th>${esc(r.products.unitPrice)}</th>
              <th>${esc(r.products.remaining)}</th>
              <th>${esc(r.products.sold)}</th>
              <th>${esc(r.products.state)}</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p) => `
              <tr>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.category || r.products.other)}</td>
                <td>${esc((p.price_cents / 100).toFixed(2))} ${esc(p.currency)}</td>
                <td><strong>${esc(p.stock_qty ?? 0)}</strong></td>
                <td>${esc(p.sold_count ?? 0)}</td>
                <td><span class="badge ${stockBadge(p)}">${esc(r.products.states[p.stock_state])}</span></td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <h3>${esc(r.orders.title(cards.length))}</h3>
        <table>
          <thead>
            <tr>
              <th>${esc(r.orders.ref)}</th>
              <th>${esc(r.orders.customer)}</th>
              <th>${esc(r.orders.phone)}</th>
              <th>${esc(r.orders.items)}</th>
              <th>${esc(r.orders.stage)}</th>
              <th>${esc(r.orders.total)}</th>
              <th>${esc(r.orders.owed)}</th>
            </tr>
          </thead>
          <tbody>
            ${cards
              .map(
                (c) => `
              <tr>
                <td><strong>#${esc(c.ref)}</strong></td>
                <td><strong>${esc(c.customerName)}</strong></td>
                <td>${esc(c.phone_e164)}</td>
                <td class="items-cell">${esc(c.itemsSummary || r.orders.itemsFallback)}</td>
                <td><span class="badge">${esc(statuses[c.status] ?? c.status)}</span></td>
                <td><strong>${esc(formatMoney(c.totalCents))}</strong></td>
                <td style="${c.owedCents > 0 ? "color:#B25E09;font-weight:bold;" : ""}">${esc(formatMoney(c.owedCents))}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <script>window.onload = function () { window.print(); }</script>
      </body>
    </html>
  `);
  printWin.document.close();
}
