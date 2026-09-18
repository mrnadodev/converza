import type { Language } from "../translations";

export interface StockCopy {
  title: string;
  subtitle: string;
  valuation: { title: string; total: string; products: (n: number) => string };
  alerts: { text: (n: number) => string; see: string };
  reports: { title: string; week: string; month: string; all: string; csv: string; pdf: string };
  search: string;
  filters: { all: (n: number) => string; low: (n: number) => string; out: (n: number) => string };
  quantity: string;
  decrease: string;
  increase: string;
  empty: { title: string; desc: string; cta: string; noMatch: string };
}

const fr: StockCopy = {
  title: "Stock",
  subtitle: "Ajustez les quantités et exportez vos rapports de ventes.",
  valuation: { title: "Valeur du stock", total: "Valeur totale", products: (n) => (n <= 1 ? `${n} produit` : `${n} produits`) },
  alerts: { text: (n) => (n <= 1 ? `${n} produit à réapprovisionner` : `${n} produits à réapprovisionner`), see: "Les voir" },
  reports: {
    title: "Rapport de ventes et de stock",
    week: "Cette semaine",
    month: "Ce mois-ci",
    all: "Depuis le début",
    csv: "Télécharger (CSV)",
    pdf: "Version imprimable",
  },
  search: "Rechercher un produit…",
  filters: { all: (n) => `Tous (${n})`, low: (n) => `Stock faible (${n})`, out: (n) => `Épuisés (${n})` },
  quantity: "Quantité en stock",
  decrease: "Retirer une unité",
  increase: "Ajouter une unité",
  empty: {
    title: "Aucun produit à suivre",
    desc: "Le stock se remplit à partir de votre catalogue : ajoutez-y vos produits avec leur quantité.",
    cta: "Ouvrir le catalogue",
    noMatch: "Aucun produit ne correspond à votre recherche.",
  },
};

const ht: StockCopy = {
  title: "Stòk",
  subtitle: "Ajiste kantite yo epi eksporte rapò vant ou yo.",
  valuation: { title: "Valè stòk la", total: "Valè total", products: (n) => `${n} pwodwi` },
  alerts: { text: (n) => `${n} pwodwi pou reapwovizyone`, see: "Wè yo" },
  reports: {
    title: "Rapò vant ak stòk",
    week: "Semèn sa a",
    month: "Mwa sa a",
    all: "Depi nan konmansman",
    csv: "Telechaje (CSV)",
    pdf: "Vèsyon pou enprime",
  },
  search: "Chèche yon pwodwi…",
  filters: { all: (n) => `Tout (${n})`, low: (n) => `Stòk fèb (${n})`, out: (n) => `Fini (${n})` },
  quantity: "Kantite nan stòk",
  decrease: "Retire yon inite",
  increase: "Ajoute yon inite",
  empty: {
    title: "Pa gen pwodwi pou swiv",
    desc: "Stòk la soti nan katalòg ou : ajoute pwodwi ou yo ak kantite yo.",
    cta: "Ouvri katalòg la",
    noMatch: "Pa gen pwodwi ki koresponn ak rechèch ou a.",
  },
};

const en: StockCopy = {
  title: "Stock",
  subtitle: "Adjust quantities and export your sales reports.",
  valuation: { title: "Stock value", total: "Total value", products: (n) => (n === 1 ? "1 product" : `${n} products`) },
  alerts: { text: (n) => (n === 1 ? "1 product to restock" : `${n} products to restock`), see: "View them" },
  reports: {
    title: "Sales and stock report",
    week: "This week",
    month: "This month",
    all: "All time",
    csv: "Download (CSV)",
    pdf: "Printable version",
  },
  search: "Search for a product…",
  filters: { all: (n) => `All (${n})`, low: (n) => `Low stock (${n})`, out: (n) => `Sold out (${n})` },
  quantity: "Quantity in stock",
  decrease: "Remove one unit",
  increase: "Add one unit",
  empty: {
    title: "No product to track",
    desc: "Stock comes from your catalog: add your products there with their quantity.",
    cta: "Open the catalog",
    noMatch: "No product matches your search.",
  },
};

export const STOCK_COPY: Record<Language, StockCopy> = { fr, ht, en };
