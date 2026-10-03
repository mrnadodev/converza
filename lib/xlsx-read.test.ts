import { describe, expect, it } from "vitest";
import { buildWorkbook } from "./xlsx";
import { buildImportTemplate, TEMPLATE_COPY } from "./import-template";
import { estClasseur, lireClasseur } from "./xlsx-read";
import { parseBulkProducts } from "./excel";

// Le modele est telecharge, rempli dans Excel, puis redepose. Si l un des deux
// bouts cede, le marchand perd son catalogue et ne sait pas pourquoi : le
// fichier a l air bon, et l application dit seulement qu elle n a rien trouve.

const octets = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

describe("reconnaitre un classeur", () => {
  it("reconnait un .xlsx a sa signature", () => {
    expect(estClasseur(octets(buildImportTemplate()))).toBe(true);
  });

  it("ne prend pas un CSV pour un classeur", () => {
    const csv = new TextEncoder().encode("Nom;Prix\nRiz;100");
    expect(estClasseur(octets(csv))).toBe(false);
  });

  it("ne prend pas un fichier vide pour un classeur", () => {
    expect(estClasseur(new ArrayBuffer(0))).toBe(false);
  });
});

describe("relire ce que le projet ecrit", () => {
  it("retrouve le texte et les nombres d une feuille", async () => {
    const wb = buildWorkbook({
      name: "Essai",
      widths: [20, 10],
      rows: [
        [{ v: "Produit", s: "header" }, { v: "Prix", s: "header" }],
        [{ v: "Diri Tchako", s: "cell" }, { v: 1200, s: "money" }],
      ],
    });
    const lignes = await lireClasseur(octets(wb));
    expect(lignes[0]).toEqual(["Produit", "Prix"]);
    expect(lignes[1][0]).toBe("Diri Tchako");
    expect(Number(lignes[1][1])).toBe(1200);
  });

  it("garde les accents et les caracteres creoles", async () => {
    const wb = buildWorkbook({
      name: "Essai",
      widths: [20],
      rows: [[{ v: "Lwil Mazola — boutèy 5 L", s: "cell" }]],
    });
    const lignes = await lireClasseur(octets(wb));
    expect(lignes[0][0]).toBe("Lwil Mazola — boutèy 5 L");
  });

  it("ne decale pas les colonnes quand une cellule est vide", async () => {
    // Excel n ecrit pas les cellules vides. Sans remplissage, le prix
    // remonterait dans la colonne de la categorie.
    const wb = buildWorkbook({
      name: "Essai",
      widths: [20, 10, 10],
      rows: [[{ v: "Riz", s: "cell" }, null, { v: 900, s: "money" }]],
    });
    const lignes = await lireClasseur(octets(wb));
    expect(lignes[0][0]).toBe("Riz");
    expect(lignes[0][1]).toBe("");
    expect(Number(lignes[0][2])).toBe(900);
  });

  it("refuse clairement ce qui n est pas un classeur", async () => {
    const pas = new TextEncoder().encode("Nom;Prix\nRiz;100");
    await expect(lireClasseur(octets(pas))).rejects.toThrow(/classeur Excel/i);
  });
});

describe("le modele d importation", () => {
  it("porte ses six colonnes, dans l ordre attendu par l import", async () => {
    const lignes = await lireClasseur(octets(buildImportTemplate("fr")));
    const entete = lignes.find((l) => l[0] === TEMPLATE_COPY.fr.colonnes[0]);
    expect(entete, "la ligne d en-tete doit exister").toBeTruthy();
    expect(entete).toEqual(TEMPLATE_COPY.fr.colonnes);
  });

  it("porte une consigne au-dessus du tableau", async () => {
    const lignes = await lireClasseur(octets(buildImportTemplate("fr")));
    const plat = lignes.flat().join(" ");
    expect(plat).toContain(TEMPLATE_COPY.fr.titre);
    expect(plat, "le marchand doit lire qu il faut effacer les exemples").toContain("effacez-les");
  });

  it("existe dans les trois langues, avec les memes six colonnes", async () => {
    for (const langue of ["fr", "ht", "en"] as const) {
      const lignes = await lireClasseur(octets(buildImportTemplate(langue)));
      const entete = lignes.find((l) => l[0] === TEMPLATE_COPY[langue].colonnes[0]);
      expect(entete, `en-tete manquant en ${langue}`).toBeTruthy();
      expect(entete!.length).toBe(6);
    }
  });

  it("ses exemples se relisent comme de vrais produits", async () => {
    // L aller-retour complet : on genere, on relit, on reconvertit en CSV
    // comme le fait l import, et on verifie que les produits sortent entiers.
    const lignes = await lireClasseur(octets(buildImportTemplate("fr")));
    const debut = lignes.findIndex((l) => l[0] === TEMPLATE_COPY.fr.colonnes[0]);
    const csv = lignes.slice(debut).map((l) => l.join(";")).join("\n");
    const { products, errors } = parseBulkProducts(csv, "b1");
    expect(errors).toEqual([]);
    expect(products).toHaveLength(3);
    expect(products[0].name).toBe("Rad swa pou aswè");
    expect(products[0].price_cents).toBe(450000);
    expect(products[1].stock_qty).toBe(25);
    expect(products[2].unit).toBe("boutèy");
  });
});
