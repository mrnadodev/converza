import { formatMoney } from "./money";
import { COMMON_COPY } from "./i18n/app/common";
import { REPORT_COPY, type ReportCopy } from "./i18n/app/reports";
import type { Language } from "./i18n/translations";
import type { PipelineCard, Product } from "./types";
import { buildWorkbook, type Cell, type CellStyle } from "./xlsx";

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
/**
 * Colonnes du rapport, écrites une fois pour les deux sorties.
 *
 * Le CSV et la version imprimable sont le même rapport. Ils avaient pourtant
 * dérivé : les commandes affichaient l'étape avant le détail d'un côté, après
 * de l'autre, et le résumé imprimé cachait deux des six chiffres du CSV. Un
 * marchand qui ouvrait les deux devait relire les en-têtes à chaque fois.
 *
 * Les deux fonctions lisent désormais ces tableaux, dans cet ordre. Ajouter
 * une colonne ici l'ajoute aux deux sorties, ou à aucune.
 */
export function reportColumns(r: ReportCopy) {
  return {
    products: [
      r.products.name,
      r.products.category,
      r.products.unitPrice,
      r.products.currency,
      r.products.remaining,
      r.products.sold,
      r.products.state,
    ],
    orders: [
      r.orders.ref,
      r.orders.customer,
      r.orders.phone,
      r.orders.items,
      r.orders.stage,
      r.orders.total,
      r.orders.owed,
    ],
  };
}


/**
 * Portée d'un rapport. Les deux ne s'adressent pas aux mêmes personnes.
 *
 * L'inventaire ne dit rien du chiffre d'affaires ni des clients ; le rapport
 * de ventes ne dit rien du stock. Un seul fichier mélangeait les deux, si bien
 * que l'application masquait les chiffres financiers au stockiste à l'écran
 * puis les lui remettait dans un téléchargement, avec le nom et le numéro de
 * chaque client. Chaque portée a désormais son droit (voir lib/rbac.ts).
 */
export type ReportScope = "stock" | "sales";

interface ReportPlan {
  titre: string;
  /** Tuiles du résumé : libellé, valeur, style. */
  tuiles: [string, number, CellStyle][];
  sections: { titre: string; colonnes: string[]; lignes: (Cell | null)[][] }[];
}

const ETAT_STOCK: Record<string, CellStyle> = {
  fini: "badgeDanger",
  ba_stok: "badgeWarning",
  en_stok: "badgeSuccess",
};

/**
 * Contenu du rapport, indépendant du format.
 *
 * Le tableur et la version imprimable lisent ce même plan : c'est ce qui
 * garantit qu'ils montrent la même chose, dans le même ordre, sous le même
 * titre — et qu'une section réservée ne puisse pas réapparaître dans l'un
 * après avoir été retirée de l'autre.
 */
function planReport(
  scope: ReportScope,
  cards: PipelineCard[],
  products: Product[],
  businessName: string,
  language: Language,
): ReportPlan {
  const r: ReportCopy = REPORT_COPY[language] ?? REPORT_COPY.fr;
  const statuses = (COMMON_COPY[language] ?? COMMON_COPY.fr).statuses;
  const t = totalsOf(cards, products);
  const cols = reportColumns(r);
  const n = (i: number, titre: string) => `${i}. ${titre}`;

  if (scope === "stock") {
    return {
      titre: r.stockTitle(businessName),
      tuiles: [
        [r.summary.stockValue, t.stockValueCents / 100, "cardValue"],
        [r.summary.lowStock, t.lowStockCount, t.lowStockCount > 0 ? "cardCountAmber" : "cardCount"],
      ],
      sections: [
        {
          titre: n(2, `${r.productsSection} (${products.length})`),
          colonnes: cols.products,
          lignes: products.map((p) => [
            { v: p.name, s: "cellBold" },
            { v: p.category || r.products.other, s: "cell" },
            { v: p.price_cents / 100, s: "money" },
            { v: p.currency, s: "cell" },
            { v: p.stock_qty ?? 0, s: "count" },
            { v: p.sold_count ?? 0, s: "count" },
            { v: r.products.states[p.stock_state], s: ETAT_STOCK[p.stock_state] ?? "cell" },
          ]),
        },
      ],
    };
  }

  return {
    titre: r.salesTitle(businessName),
    tuiles: [
      [r.summary.revenue, t.revenueCents / 100, "cardValue"],
      [r.summary.paid, t.paidCents / 100, "cardValueGreen"],
      [r.summary.owed, t.owedCents / 100, "cardValueAmber"],
      [r.summary.orders, cards.length, "cardCount"],
    ],
    sections: [
      {
        titre: n(2, `${r.ordersSection} (${cards.length})`),
        colonnes: cols.orders,
        lignes: cards.map((c) => [
          { v: `#${c.ref}`, s: "cellBold" },
          { v: c.customerName, s: "cellBold" },
          { v: c.phone_e164, s: "cell" },
          { v: c.itemsSummary || r.orders.itemsFallback, s: "cellItems" },
          { v: statuses[c.status] ?? c.status, s: "cell" },
          { v: c.totalCents / 100, s: "moneyBold" },
          { v: c.owedCents / 100, s: c.owedCents > 0 ? "cardValueAmber" : "money" },
        ]),
      },
    ],
  };
}

/**
 * Rapport au format Excel, dessiné comme la version imprimable.
 *
 * Il partait en CSV. Un CSV ne porte que du texte : ouvert dans Excel il
 * arrivait empilé dans une seule colonne, points-virgules et guillemets à nu,
 * parce que le séparateur attendu dépend des réglages régionaux du poste.
 *
 * Les montants sont ici de vrais nombres : le marchand peut les additionner,
 * les trier, les filtrer. C'est ce qu'on vient chercher dans un tableur.
 */
export function generateReportXLSX(
  scope: ReportScope,
  cards: PipelineCard[],
  products: Product[],
  timeframe: Timeframe = "month",
  businessName = "",
  language: Language = "fr",
): Uint8Array<ArrayBuffer> {
  const r: ReportCopy = REPORT_COPY[language] ?? REPORT_COPY.fr;
  const plan = planReport(scope, cards, products, businessName, language);

  const rows: (Cell | null)[][] = [];
  const merges: number[] = [];
  const vide = () => rows.push([]);
  const texte = (v: string, s: CellStyle) => {
    merges.push(rows.length);
    rows.push([{ v, s }]);
  };

  texte(plan.titre, "title");
  texte(r.period(r.periods[timeframe], dateStr(language)), "sub");
  vide();

  // Résumé : les tuiles de la version imprimable, par rangées de trois, libellé
  // au-dessus et valeur en dessous — comme les cartes imprimées.
  texte(`1. ${scope === "stock" ? r.stockSummary : r.salesSummary}`, "section");
  for (let i = 0; i < plan.tuiles.length; i += 3) {
    const rangee = plan.tuiles.slice(i, i + 3);
    rows.push(rangee.flatMap(([label]) => [{ v: label, s: "cardLabel" as CellStyle }, null]));
    rows.push(rangee.flatMap(([, valeur, style]) => [{ v: valeur, s: style }, null]));
    vide();
  }

  for (const section of plan.sections) {
    texte(section.titre, "section");
    rows.push(section.colonnes.map((h) => ({ v: h, s: "header" as CellStyle })));
    for (const ligne of section.lignes) rows.push(ligne);
    vide();
  }

  return buildWorkbook({
    // Nom de l'onglet : celui de la boutique. C'est ce que le marchand
    // reconnaît. Excel refuse au-delà de 31 caractères et rejette : \ / ? * [ ]
    name: (businessName.replace(/[\\/?*[\]:]/g, " ").trim() || r.periods[timeframe]).slice(0, 31),
    widths: [30, 24, 14, 10, 14, 10, 16],
    rows,
    mergesFullWidth: merges,
  });
}

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
  lines.push(reportColumns(r).products.map(csvCell).join(";"));
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
    reportColumns(r).orders.map(csvCell).join(";"),
  );
  for (const c of cards) {
    lines.push(
      [
        csvCell(`#${c.ref}`),
        csvCell(c.customerName),
        csvCell(c.phone_e164),
        csvCell(c.itemsSummary || r.orders.itemsFallback),
        csvCell(statuses[c.status] ?? c.status),
        csvCell(formatMoney(c.totalCents)),
        csvCell(formatMoney(c.owedCents)),
      ].join(";"),
    );
  }

  return "﻿" + lines.join("\r\n");
}


/**
 * Ouvre la version imprimable (PDF via l'impression du navigateur).
 *
 * Elle lit le même plan que le tableur : l'inventaire et le rapport de ventes
 * y montrent donc exactement les mêmes sections, dans le même ordre. Une
 * section retirée d'un format ne peut pas subsister dans l'autre.
 */
export function triggerReportPDF(
  scope: ReportScope,
  cards: PipelineCard[],
  products: Product[],
  timeframe: Timeframe = "month",
  businessName = "",
  language: Language = "fr",
) {
  if (typeof window === "undefined") return;

  const r: ReportCopy = REPORT_COPY[language] ?? REPORT_COPY.fr;
  const plan = planReport(scope, cards, products, businessName, language);

  const printWin = window.open("", "_blank");
  if (!printWin) return;

  // Une valeur négative ou due s'écrit en ambre, comme sur l'écran d'accueil.
  const teinte = (style: CellStyle) =>
    style === "cardValueGreen" ? "color:#008069" : style.includes("Amber") ? "color:#B25E09" : "";
  const nombre = (v: number, style: CellStyle) =>
    style.startsWith("cardCount") ? String(v) : v.toLocaleString(language === "en" ? "en-US" : "fr-FR");

  const tuiles = plan.tuiles
    .map(
      ([label, valeur, style]) =>
        `<div class="card"><div class="card-title">${esc(label)}</div><div class="card-val" style="${teinte(style)}">${esc(nombre(valeur, style))}</div></div>`,
    )
    .join("");

  const sections = plan.sections
    .map(
      (section) => `
        <h3>${esc(section.titre)}</h3>
        <table>
          <thead><tr>${section.colonnes.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${section.lignes
              .map(
                (ligne) =>
                  `<tr>${ligne
                    .map((cellule) => {
                      if (!cellule) return "<td></td>";
                      const s = cellule.s ?? "cell";
                      const brut = cellule.v;
                      if (typeof brut === "number") {
                        return `<td style="${teinte(s)};${s === "moneyBold" ? "font-weight:bold" : ""}">${esc(nombre(brut, s))}</td>`;
                      }
                      const texte = esc(String(brut ?? ""));
                      if (s.startsWith("badge")) {
                        const ton =
                          s === "badgeDanger" ? "badge-danger" : s === "badgeWarning" ? "badge-warning" : "badge-success";
                        return `<td><span class="badge ${ton}">${texte}</span></td>`;
                      }
                      if (s === "cellItems") return `<td class="items-cell">${texte}</td>`;
                      if (s === "cellBold") return `<td><strong>${texte}</strong></td>`;
                      return `<td>${texte}</td>`;
                    })
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>`,
    )
    .join("");

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="${esc(language)}">
      <head>
        <meta charset="utf-8" />
        <title>${esc(plan.titre)}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; color: #111B21; background: #fff; }
          h1 { font-size: 22px; margin-bottom: 4px; color: #008069; }
          h3 { font-size: 15px; margin: 24px 0 8px; }
          h3.first { margin-top: 0; }
          .sub { font-size: 13px; color: #667781; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
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
        <h1>${esc(plan.titre)}</h1>
        <div class="sub">${esc(r.period(r.periods[timeframe], dateStr(language)))}</div>

        <h3 class="first">${esc(`1. ${scope === "stock" ? r.stockSummary : r.salesSummary}`)}</h3>
        <div class="grid">${tuiles}</div>

        ${sections}

        <script>window.onload = function () { window.print(); }</script>
      </body>
    </html>
  `);
  printWin.document.close();
}
