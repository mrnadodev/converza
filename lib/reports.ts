import { formatMoney } from "./money";
import { ORDER_STATUS_LABEL, type PipelineCard, type Product } from "./types";

/**
 * Échappe une valeur avant insertion dans le HTML du rapport imprimable.
 * Les noms de produits et de clients peuvent venir d'une commande passée depuis
 * la vitrine publique : sans échappement, un nom contenant du balisage
 * s'exécuterait dans la fenêtre d'impression du marchand.
 */
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

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Génère le contenu CSV/Excel compatible UTF-8 (avec BOM) pour le rapport détaillé de ventes et stock avec le détail des produits commandés par client.
 */
export function generateSalesReportCSV(
  cards: PipelineCard[],
  products: Product[],
  timeframe: "week" | "month" | "all" = "month",
  businessName: string = "Biznis mwen",
): string {
  const bom = "\uFEFF"; // Byte Order Mark UTF-8 pour Excel

  // Filtrage selon la période
  const timeframeLabel = timeframe === "week" ? "Semenn sa a" : timeframe === "month" ? "Mwa sa a" : "Tout tan";

  // Calculs statistiques généraux
  const totalOrders = cards.length;
  const totalRevenueCents = cards.reduce((acc, c) => acc + c.totalCents, 0);
  const totalOwedCents = cards.reduce((acc, c) => acc + c.owedCents, 0);
  const totalPaidCents = totalRevenueCents - totalOwedCents;

  const totalStockValueCents = products.reduce((acc, p) => acc + (p.price_cents * (p.stock_qty ?? 0)), 0);
  const lowStockCount = products.filter((p) => p.stock_state === "ba_stok" || p.stock_state === "fini").length;

  const lines: string[] = [];

  // Entête du Rapport
  lines.push(`"RAPÒ DETAYE VANT AK ENVENTÈ - ${businessName.toUpperCase()}"`);
  lines.push(`"Peryòd: ${timeframeLabel} | Dat jenerasyon: ${new Date().toLocaleDateString("fr-FR")}"`);
  lines.push("");

  // Section 1: Rezime Finansyè & Envantè
  lines.push('"1. REZIME FINANSYÈ AK ENVANTÈ"');
  lines.push(`"Vant Total Realize (HTG/USD)";"${formatMoney(totalRevenueCents)}"`);
  lines.push(`"Montan Total ki Peye";"${formatMoney(totalPaidCents)}"`);
  lines.push(`"Montan Dèt pou Rekouvre";"${formatMoney(totalOwedCents)}"`);
  lines.push(`"Valè Total Pwodwi nan Stòk";"${formatMoney(totalStockValueCents)}"`);
  lines.push(`"Kantite Kòmand Nèt";"${totalOrders}"`);
  lines.push(`"Pwodwi ki nan Alèty Stòk (Fini / Ba stòk)";"${lowStockCount}"`);
  lines.push("");

  // Section 2: Detay Stòk & Pwodwi
  lines.push('"2. ETA DETAYE PWODWI AK STÒK"');
  lines.push('"Non Pwodwi";"Kategori";"Pri Inite";"Devise";"Stòk Reste";"Vant Realize";"Eta Stòk"');

  products.forEach((p) => {
    const statusText = p.stock_state === "fini" ? "Rupture (Fini)" : p.stock_state === "ba_stok" ? "Ba stòk" : "En stòk";
    lines.push(
      [
        csvCell(p.name),
        csvCell(p.category || "Lòt"),
        csvCell((p.price_cents / 100).toFixed(2)),
        csvCell(p.currency),
        csvCell(p.stock_qty ?? 0),
        csvCell(p.sold_count ?? 0),
        csvCell(statusText),
      ].join(";"),
    );
  });
  lines.push("");

  // Section 3: Istwa Detaye Kòmand yo ak Pwodwi Kliyan Achte
  lines.push('"3. ISTWA DETAYE KÒMAND KLIYAN YO"');
  lines.push('"Ref Kòmand";"Non Kliyan";"Nimewo Tel";"Etap Pipeline";"Pwodwi ak Kantite Kòmande (Detay)";"Montan Total";"Reste Dèt"');

  cards.forEach((c) => {
    const statusText = ORDER_STATUS_LABEL[c.status] || c.status;
    lines.push(
      [
        csvCell(`#${c.ref}`),
        csvCell(c.customerName),
        csvCell(c.phone_e164),
        csvCell(statusText),
        csvCell(c.itemsSummary || "Pwodwi divès"),
        csvCell(formatMoney(c.totalCents)),
        csvCell(formatMoney(c.owedCents)),
      ].join(";"),
    );
  });

  return bom + lines.join("\r\n");
}

/**
 * Lance l'impression / sauvegarde PDF du rapport complet de ventes et stock avec détails des produits commandés par client.
 */
export function triggerSalesReportPDF(
  cards: PipelineCard[],
  products: Product[],
  timeframe: "week" | "month" | "all" = "month",
  businessName: string = "Biznis mwen",
) {
  if (typeof window === "undefined") return;

  const totalRevenueCents = cards.reduce((acc, c) => acc + c.totalCents, 0);
  const totalOwedCents = cards.reduce((acc, c) => acc + c.owedCents, 0);
  const totalPaidCents = totalRevenueCents - totalOwedCents;
  const totalStockValueCents = products.reduce((acc, p) => acc + (p.price_cents * (p.stock_qty ?? 0)), 0);

  const printWin = window.open("", "_blank");
  if (!printWin) return;

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rapò Vant ak Stòk - ${esc(businessName)}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; color: #111B21; background: #fff; }
          h1 { font-size: 22px; margin-bottom: 4px; color: #008069; }
          .sub { font-size: 13px; color: #667781; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { background: #F7F8F9; border: 1px solid #E9EDEF; border-radius: 12px; padding: 12px; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #667781; font-weight: bold; }
          .card-val { font-size: 18px; font-weight: 800; color: #111B21; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; }
          th { text-align: left; background: #E7F7F1; padding: 8px 10px; font-weight: 700; color: #008069; border-bottom: 2px solid #B9F5E4; }
          td { padding: 8px 10px; border-bottom: 1px solid #E9EDEF; vertical-align: top; }
          .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; display: inline-block; }
          .badge-danger { background: #FCE4E4; color: #C0392B; }
          .badge-warning { background: #FEF3C7; color: #92400E; }
          .badge-success { background: #D1FAE5; color: #065F46; }
          .badge-demand_acha { background: #CFFAFE; color: #0891B2; border: 1px solid #67E8F9; }
          .badge-kontak { background: #F8FAFC; color: #334155; border: 1px solid #CBD5E1; }
          .badge-metod_peman { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; }
          .badge-konfime_peman { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
          .badge-pou_konfime { background: #CFFAFE; color: #0891B2; border: 1px solid #67E8F9; }
          .badge-peye { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
          .badge-sou_wout { background: #F3E8FF; color: #6B21A8; border: 1px solid #D8B4FE; }
          .badge-livre { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
          .badge-swivi { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }
          .badge-anile { background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }
          .items-cell { color: #075E54; font-weight: 600; }
          @media print {
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <h1>📊 Rapò Detaye Vant ak Envantè - ${esc(businessName)}</h1>
        <div class="sub">Peryòd: ${timeframe === "week" ? "Semenn sa a" : timeframe === "month" ? "Mwa sa a" : "Tout tan"} | Dat: ${new Date().toLocaleDateString("fr-FR")}</div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Vant Total Realize</div>
            <div class="card-val">${formatMoney(totalRevenueCents)}</div>
          </div>
          <div class="card">
            <div class="card-title">Montan Peye</div>
            <div class="card-val" style="color:#008069">${formatMoney(totalPaidCents)}</div>
          </div>
          <div class="card">
            <div class="card-title">Dèt pou Rekouvre</div>
            <div class="card-val" style="color:#B25E09">${formatMoney(totalOwedCents)}</div>
          </div>
          <div class="card">
            <div class="card-title">Valè Total Stòk</div>
            <div class="card-val">${formatMoney(totalStockValueCents)}</div>
          </div>
        </div>

        <h3>📦 Eta Stòk ak Pwodwi yo (${products.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Pwodwi</th>
              <th>Kategori</th>
              <th>Pri Inite</th>
              <th>Stòk Reste</th>
              <th>Vant Realize</th>
              <th>Eta Stòk</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p) => `
              <tr>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.category || "Lòt")}</td>
                <td>${(p.price_cents / 100).toFixed(2)} ${esc(p.currency)}</td>
                <td><strong>${p.stock_qty ?? 0}</strong></td>
                <td>${p.sold_count ?? 0}</td>
                <td>
                  <span class="badge ${p.stock_state === "fini" ? "badge-danger" : p.stock_state === "ba_stok" ? "badge-warning" : "badge-success"}">
                    ${p.stock_state === "fini" ? "Rupture" : p.stock_state === "ba_stok" ? "Ba stòk" : "En stòk"}
                  </span>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h3>📑 Istwa Detaye Kòmand Kliyan yo (${cards.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Kliyan</th>
              <th>Tel</th>
              <th>Pwodwi ak Kantite Kòmande</th>
              <th>Etap</th>
              <th>Montan Total</th>
              <th>Reste Dèt</th>
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
                <td class="items-cell">${esc(c.itemsSummary || "Pwodwi divès")}</td>
                <td><span class="badge badge-${esc(c.status)}">${esc(ORDER_STATUS_LABEL[c.status] || c.status)}</span></td>
                <td><strong>${formatMoney(c.totalCents)}</strong></td>
                <td style="${c.owedCents > 0 ? "color:#B25E09;font-weight:bold;" : ""}">${formatMoney(c.owedCents)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}
