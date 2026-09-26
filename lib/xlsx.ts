// Écriture d'un vrai fichier Excel (.xlsx), sans dépendance.
//
// Le rapport de ventes partait en CSV. Un CSV ne transporte que du texte :
// pas de couleur, pas de gras, pas de largeur de colonne. Ouvert dans Excel
// il arrivait même empilé dans une seule colonne, guillemets et points-virgules
// à nu, parce que le séparateur d'un CSV dépend des réglages régionaux du
// poste qui l'ouvre. À côté de la version imprimable, c'était indéfendable.
//
// Un .xlsx est une archive ZIP contenant quelques fichiers XML. On l'écrit
// donc ici, en une page, plutôt que d'ajouter une bibliothèque d'un mégaoctet
// au paquet téléchargé par des marchands qui paient leurs données à la carte.
//
// Les entrées du ZIP sont stockées sans compression : un rapport pèse quelques
// dizaines de kilo-octets, et se passer de deflate évite d'embarquer un
// compresseur pour économiser un souffle.

export type CellValue = string | number | null;

/** Styles nommés, repris de la version imprimable pour que les deux se ressemblent. */
export type CellStyle =
  | "title"
  | "sub"
  | "section"
  | "header"
  | "cell"
  | "cellBold"
  | "cellItems"
  | "cardLabel"
  | "cardValue"
  | "cardValueGreen"
  | "cardValueAmber"
  | "cardCount"
  | "cardCountAmber"
  | "badgeDanger"
  | "badgeWarning"
  | "badgeSuccess"
  | "money"
  | "moneyBold"
  | "count";

export interface Cell {
  v: CellValue;
  s?: CellStyle;
}

export interface Sheet {
  name: string;
  /** Largeur des colonnes, en « caractères » Excel. */
  widths: number[];
  rows: (Cell | null)[][];
  /** Lignes à fusionner sur toute la largeur (titre, intertitres). */
  mergesFullWidth?: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
//
// L'ordre de ces tableaux fait foi : styles.xml désigne une police, un fond et
// une bordure par leur position. Insérer une entrée au milieu décalerait tout.
// ─────────────────────────────────────────────────────────────────────────────

const FONTS = [
  { sz: 11, color: "FF111B21" }, // 0 — texte courant
  { sz: 16, b: true, color: "FF008069" }, // 1 — titre du rapport
  { sz: 10, color: "FF667781" }, // 2 — sous-titre
  { sz: 12, b: true, color: "FF111B21" }, // 3 — intertitre de section
  { sz: 11, b: true, color: "FF008069" }, // 4 — en-tête de tableau
  { sz: 11, b: true, color: "FF111B21" }, // 5 — cellule en gras
  { sz: 9, b: true, color: "FF667781" }, // 6 — libellé d'une tuile
  { sz: 14, b: true, color: "FF111B21" }, // 7 — valeur d'une tuile
  { sz: 14, b: true, color: "FF008069" }, // 8 — valeur encaissée
  { sz: 14, b: true, color: "FFB25E09" }, // 9 — valeur due
  { sz: 11, b: true, color: "FF075E54" }, // 10 — détail des articles
  { sz: 10, b: true, color: "FFC0392B" }, // 11 — épuisé
  { sz: 10, b: true, color: "FF92400E" }, // 12 — stock faible
  { sz: 10, b: true, color: "FF065F46" }, // 13 — en stock
];

const FILLS = [
  null, // 0 — aucun (imposé par le format)
  null, // 1 — gray125 (imposé par le format)
  "FFE7F7F1", // 2 — bandeau d'en-tête
  "FFF7F8F9", // 3 — tuile du résumé
  "FFFCE4E4", // 4 — épuisé
  "FFFEF3C7", // 5 — stock faible
  "FFD1FAE5", // 6 — en stock
];

const BORDERS = [
  null, // 0 — aucune
  { bottom: { style: "thin", color: "FFE9EDEF" } }, // 1 — séparateur de ligne
  { bottom: { style: "medium", color: "FFB9F5E4" } }, // 2 — sous l'en-tête
  { box: "FFE9EDEF" }, // 3 — contour d'une tuile
];

/** [police, fond, bordure, format de nombre, alignement] pour chaque style nommé. */
const XFS: Record<CellStyle, { f: number; fi: number; b: number; num?: number; wrap?: boolean }> = {
  title: { f: 1, fi: 0, b: 0 },
  sub: { f: 2, fi: 0, b: 0 },
  section: { f: 3, fi: 0, b: 0 },
  header: { f: 4, fi: 2, b: 2 },
  cell: { f: 0, fi: 0, b: 1 },
  cellBold: { f: 5, fi: 0, b: 1 },
  cellItems: { f: 10, fi: 0, b: 1, wrap: true },
  cardLabel: { f: 6, fi: 3, b: 3 },
  // Les tuiles portent des montants : sans le format 164 elles affichaient
  // « 33000 » quand le tableau juste en dessous affichait « 33 000 ».
  cardValue: { f: 7, fi: 3, b: 3, num: 164 },
  cardValueGreen: { f: 8, fi: 3, b: 3, num: 164 },
  cardValueAmber: { f: 9, fi: 3, b: 3, num: 164 },
  /** Même tuile, mais pour un décompte : ni séparateur de milliers ni décimale. */
  cardCount: { f: 7, fi: 3, b: 3, num: 165 },
  cardCountAmber: { f: 9, fi: 3, b: 3, num: 165 },
  badgeDanger: { f: 11, fi: 4, b: 1 },
  badgeWarning: { f: 12, fi: 5, b: 1 },
  badgeSuccess: { f: 13, fi: 6, b: 1 },
  money: { f: 0, fi: 0, b: 1, num: 164 },
  moneyBold: { f: 5, fi: 0, b: 1, num: 164 },
  count: { f: 0, fi: 0, b: 1, num: 165 },
};

const STYLE_ORDER = Object.keys(XFS) as CellStyle[];
/** Position du style dans cellXfs. L'index 0 reste le style par défaut. */
const styleIndex = (s?: CellStyle) => (s ? STYLE_ORDER.indexOf(s) + 1 : 0);

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stylesXml(): string {
  const fonts = FONTS.map(
    (f) =>
      `<font><sz val="${f.sz}"/>${"b" in f && f.b ? "<b/>" : ""}<color rgb="${f.color}"/><name val="Calibri"/></font>`,
  ).join("");

  const fills = FILLS.map((c, i) => {
    if (i === 0) return `<fill><patternFill patternType="none"/></fill>`;
    if (i === 1) return `<fill><patternFill patternType="gray125"/></fill>`;
    return `<fill><patternFill patternType="solid"><fgColor rgb="${c}"/><bgColor indexed="64"/></patternFill></fill>`;
  }).join("");

  const borders = BORDERS.map((b) => {
    if (!b) return `<border><left/><right/><top/><bottom/><diagonal/></border>`;
    if ("box" in b) {
      const e = `<color rgb="${b.box}"/>`;
      return `<border><left style="thin">${e}</left><right style="thin">${e}</right><top style="thin">${e}</top><bottom style="thin">${e}</bottom><diagonal/></border>`;
    }
    return `<border><left/><right/><top/><bottom style="${b.bottom.style}"><color rgb="${b.bottom.color}"/></bottom><diagonal/></border>`;
  }).join("");

  const xfs = [
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`,
    ...STYLE_ORDER.map((name) => {
      const x = XFS[name];
      const align = x.wrap ? `<alignment vertical="top" wrapText="1"/>` : `<alignment vertical="center"/>`;
      return `<xf numFmtId="${x.num ?? 0}" fontId="${x.f}" fillId="${x.fi}" borderId="${x.b}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${x.num ? ' applyNumberFormat="1"' : ""} applyAlignment="1">${align}</xf>`;
    }),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0"/></numFmts><fonts count="${FONTS.length}">${fonts}</fonts><fills count="${FILLS.length}">${fills}</fills><borders count="${BORDERS.length}">${borders}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${STYLE_ORDER.length + 1}">${xfs}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

/** A, B, … Z, AA, AB… */
export function columnName(i: number): string {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function buildSheetXml(sheet: Sheet): string {
  const cols = sheet.widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");

  const rows = sheet.rows
    .map((cells, r) => {
      const inner = cells
        .map((cell, ci) => {
          if (!cell || cell.v === null || cell.v === "") return "";
          const ref = `${columnName(ci)}${r + 1}`;
          const s = styleIndex(cell.s);
          const attrs = `r="${ref}"${s ? ` s="${s}"` : ""}`;
          return typeof cell.v === "number"
            ? `<c ${attrs}><v>${cell.v}</v></c>`
            : `<c ${attrs} t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`;
        })
        .join("");
      return inner ? `<row r="${r + 1}">${inner}</row>` : "";
    })
    .join("");

  const largeur = Math.max(sheet.widths.length, 1);
  const merges = (sheet.mergesFullWidth ?? [])
    .map((r) => `<mergeCell ref="A${r + 1}:${columnName(largeur - 1)}${r + 1}"/>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols>${cols}</cols><sheetData>${rows}</sheetData>${merges ? `<mergeCells count="${sheet.mergesFullWidth!.length}">${merges}</mergeCells>` : ""}</worksheet>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Archive ZIP
// ─────────────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

/** Archive ZIP à entrées stockées (méthode 0), suffisante pour un .xlsx. */
export function zipFiles(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const nom = new TextEncoder().encode(e.name);
    const crc = crc32(e.bytes);
    const taille = e.bytes.length;

    const local = new Uint8Array(30 + nom.length + taille);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version minimale
    lv.setUint16(6, 0x0800, true); // noms de fichiers en UTF-8
    lv.setUint16(8, 0, true); // stocké, sans compression
    lv.setUint16(10, 0, true); // heure
    lv.setUint16(12, 0x21, true); // date (1980-01-01 : un .xlsx ne s'en sert pas)
    lv.setUint32(14, crc, true);
    lv.setUint32(18, taille, true);
    lv.setUint32(22, taille, true);
    lv.setUint16(26, nom.length, true);
    lv.setUint16(28, 0, true);
    local.set(nom, 30);
    local.set(e.bytes, 30 + nom.length);
    locals.push(local);

    const central = new Uint8Array(46 + nom.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, taille, true);
    cv.setUint32(24, taille, true);
    cv.setUint16(28, nom.length, true);
    cv.setUint32(42, offset, true);
    central.set(nom, 46);
    centrals.push(central);

    offset += local.length;
  }

  const tailleCentral = centrals.reduce((a, c) => a + c.length, 0);
  const fin = new Uint8Array(22);
  const fv = new DataView(fin.buffer);
  fv.setUint32(0, 0x06054b50, true);
  fv.setUint16(8, entries.length, true);
  fv.setUint16(10, entries.length, true);
  fv.setUint32(12, tailleCentral, true);
  fv.setUint32(16, offset, true);

  const total = offset + tailleCentral + 22;
  const out = new Uint8Array(new ArrayBuffer(total));
  let p = 0;
  for (const b of [...locals, ...centrals, fin]) {
    out.set(b, p);
    p += b.length;
  }
  return out;
}

/** Assemble le classeur complet, prêt à être enregistré en .xlsx. */
export function buildWorkbook(sheet: Sheet): Uint8Array<ArrayBuffer> {
  const enc = (s: string) => new TextEncoder().encode(s);
  return zipFiles([
    {
      name: "[Content_Types].xml",
      bytes: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      bytes: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      bytes: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheet.name).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      bytes: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    { name: "xl/styles.xml", bytes: enc(stylesXml()) },
    { name: "xl/worksheets/sheet1.xml", bytes: enc(buildSheetXml(sheet)) },
  ]);
}
