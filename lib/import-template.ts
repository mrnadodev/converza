import { buildWorkbook, type Cell, type Sheet } from "./xlsx";

/**
 * Le modèle d'importation du catalogue, en vrai fichier Excel.
 *
 * C'était un CSV à points-virgules. Excel ne découpe un CSV que si le
 * séparateur du fichier correspond à celui du système : sur une machine
 * configurée en anglais, un fichier à points-virgules arrive entièrement dans
 * la colonne A, guillemets compris. C'est ce que voyait le marchand — une
 * seule colonne illisible, et aucun moyen de deviner que le fichier était
 * pourtant correct.
 *
 * Un .xlsx n'a pas ce problème : les colonnes sont des colonnes, pas une
 * convention de ponctuation. Il permet en plus ce qu'un CSV ne permet pas —
 * des en-têtes lisibles, des largeurs de colonnes, et une consigne écrite
 * au-dessus du tableau.
 *
 * LES EXEMPLES SONT À EFFACER par le marchand. Ils sont là parce qu'un
 * tableau vide ne dit pas quel format on attend d'un prix ou d'une unité ;
 * la consigne au-dessus le rappelle, en toutes lettres.
 */

export interface TemplateCopy {
  titre: string;
  consigne: string;
  aEffacer: string;
  colonnes: [string, string, string, string, string, string];
}

export const TEMPLATE_COPY: Record<"fr" | "ht" | "en", TemplateCopy> = {
  fr: {
    titre: "PASRÈL — modèle d'importation du catalogue",
    consigne:
      "Remplissez une ligne par produit. Le nom et le prix sont obligatoires ; le reste peut rester vide.",
    aEffacer: "Les trois lignes ci-dessous sont des exemples : effacez-les avant d'importer.",
    colonnes: ["Nom du produit", "Catégorie", "Prix", "Devise", "Unité", "Quantité en stock"],
  },
  ht: {
    titre: "PASRÈL — modèl pou antre katalòg la",
    consigne:
      "Ranpli yon liy pou chak pwodwi. Non ak pri obligatwa ; rès la ka rete vid.",
    aEffacer: "Twa liy anba yo se egzanp : efase yo anvan ou antre fichye a.",
    colonnes: ["Non pwodwi a", "Kategori", "Pri", "Lajan", "Inite", "Konbyen nan stòk"],
  },
  en: {
    titre: "PASRÈL — catalogue import template",
    consigne:
      "One line per product. Name and price are required; the rest may be left empty.",
    aEffacer: "The three rows below are examples: delete them before importing.",
    colonnes: ["Product name", "Category", "Price", "Currency", "Unit", "Stock quantity"],
  },
};

/** Les exemples : un vêtement, un sac de riz, une bouteille d'huile. */
const EXEMPLES: [string, string, number, string, string, number][] = [
  ["Rad swa pou aswè", "Rad & Soulye", 4500, "HTG", "inite", 10],
  ["Diri Tchako 25 kg", "Manje", 1200, "HTG", "sak", 25],
  ["Lwil Mazola 5 L", "Manje", 3200, "HTG", "boutèy", 15],
];

export function buildImportTemplate(language: "fr" | "ht" | "en" = "fr"): Uint8Array<ArrayBuffer> {
  const t = TEMPLATE_COPY[language] ?? TEMPLATE_COPY.fr;
  const l = (v: string, s: Cell["s"]): Cell => ({ v, s });

  const rows: (Cell | null)[][] = [
    [l(t.titre, "title")],
    [l(t.consigne, "sub")],
    [l(t.aEffacer, "sub")],
    [],
    t.colonnes.map((c) => l(c, "header")),
    ...EXEMPLES.map((e) => [
      l(e[0], "cellBold"),
      l(e[1], "cell"),
      { v: e[2], s: "money" } as Cell,
      l(e[3], "cell"),
      l(e[4], "cell"),
      { v: e[5], s: "count" } as Cell,
    ]),
  ];

  const sheet: Sheet = {
    name: "Katalog",
    // Le nom du produit porte le plus de texte : il a droit au double.
    widths: [34, 18, 12, 10, 12, 18],
    rows,
    // Les trois lignes de consigne courent sur toute la largeur du tableau.
    mergesFullWidth: [0, 1, 2],
  };
  return buildWorkbook(sheet);
}
