import { describe, expect, it } from "vitest";
import { buildSheetXml, buildWorkbook, columnName, crc32, zipFiles, type Sheet } from "./xlsx";

// Un .xlsx est une archive ZIP : la moindre longueur fausse dans un en-tête
// donne un fichier qu'Excel refuse d'ouvrir, sans rien dire de plus qu'« il
// est peut-être endommagé ». Ces tests lisent l'archive octet par octet.

const lire = (b: Uint8Array, o: number) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(o, true);
const lire16 = (b: Uint8Array, o: number) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint16(o, true);

/** Relit l'archive comme le ferait Excel : par sa fin, puis son répertoire. */
function entreesDe(zip: Uint8Array): { nom: string; taille: number; crcOk: boolean }[] {
  const finSig = 0x06054b50;
  let fin = zip.length - 22;
  while (fin >= 0 && lire(zip, fin) !== finSig) fin--;
  expect(fin, "fin d'archive introuvable").toBeGreaterThanOrEqual(0);

  const nb = lire16(zip, fin + 10);
  let p = lire(zip, fin + 16);
  const out: { nom: string; taille: number; crcOk: boolean }[] = [];

  for (let i = 0; i < nb; i++) {
    expect(lire(zip, p), "signature du répertoire central").toBe(0x02014b50);
    const crc = lire(zip, p + 16);
    const taille = lire(zip, p + 24);
    const lNom = lire16(zip, p + 28);
    const nom = new TextDecoder().decode(zip.subarray(p + 46, p + 46 + lNom));
    const offset = lire(zip, p + 42);

    expect(lire(zip, offset), `signature locale de ${nom}`).toBe(0x04034b50);
    const lNomLocal = lire16(zip, offset + 26);
    const lExtra = lire16(zip, offset + 28);
    const debut = offset + 30 + lNomLocal + lExtra;
    const contenu = zip.subarray(debut, debut + taille);

    out.push({ nom, taille, crcOk: crc32(contenu) === crc });
    p += 46 + lNom + lire16(zip, p + 30) + lire16(zip, p + 32);
  }
  return out;
}

const feuille: Sheet = {
  name: "Rapport",
  widths: [30, 14],
  rows: [
    [{ v: "Rapport ventes — Boutik", s: "title" }],
    [],
    [{ v: "Produit", s: "header" }, { v: "Prix", s: "header" }],
    [{ v: "Chemiz « gason » & co", s: "cellBold" }, { v: 18000, s: "money" }],
  ],
  mergesFullWidth: [0],
};

describe("classeur Excel", () => {
  it("produit une archive ZIP que l'on peut relire entièrement", () => {
    const zip = buildWorkbook(feuille);
    expect(zip[0]).toBe(0x50); // P
    expect(zip[1]).toBe(0x4b); // K

    const entrees = entreesDe(zip);
    expect(entrees.map((e) => e.nom).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    for (const e of entrees) {
      expect(e.taille, `${e.nom} est vide`).toBeGreaterThan(0);
      expect(e.crcOk, `${e.nom} : somme de contrôle fausse`).toBe(true);
    }
  });

  it("écrit les nombres comme des nombres, pas comme du texte", () => {
    // C'est tout l'intérêt par rapport au CSV : des montants additionnables.
    const xml = buildSheetXml(feuille);
    const cellule = xml.match(/<c r="B4"[^>]*>.*?<\/c>/)?.[0] ?? "";
    expect(cellule).toContain("<v>18000</v>");
    // `inlineStr` ferait du montant une chaîne : Excel ne saurait plus le
    // sommer, et c'est exactement le défaut du CSV qu'on vient de quitter.
    expect(cellule).not.toContain("inlineStr");
  });

  it("échappe ce qui viendrait casser le XML", () => {
    // Les noms de produits et de clients arrivent d'une commande passée depuis
    // la vitrine : ils contiennent ce que le client a bien voulu taper.
    const xml = buildSheetXml(feuille);
    expect(xml).toContain("Chemiz « gason » &amp; co");
    const pieges: Sheet = { ...feuille, rows: [[{ v: '<script>&"', s: "cell" }]], mergesFullWidth: [] };
    const brut = buildSheetXml(pieges);
    expect(brut).toContain("&lt;script&gt;&amp;&quot;");
    expect(brut).not.toContain("<script>");
  });

  it("nomme les colonnes comme Excel", () => {
    expect([0, 25, 26, 27, 51, 52].map(columnName)).toEqual(["A", "Z", "AA", "AB", "AZ", "BA"]);
  });

  it("calcule la somme de contrôle attendue", () => {
    // Valeur de référence du CRC-32 de « 123456789 ».
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("garde les tailles cohérentes quand une entrée est vide", () => {
    const zip = zipFiles([{ name: "vide.txt", bytes: new Uint8Array(0) }]);
    const entrees = entreesDe(zip);
    expect(entrees).toHaveLength(1);
    expect(entrees[0].taille).toBe(0);
    expect(entrees[0].crcOk).toBe(true);
  });
});
