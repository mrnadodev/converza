import type { Language } from "../translations";

// Libellés des rapports ventes/stock exportés en CSV et en PDF imprimable.
export interface ReportCopy {
  title: (business: string) => string;
  period: (period: string, date: string) => string;
  periods: { week: string; month: string; all: string };
  summary: {
    title: string;
    revenue: string;
    paid: string;
    owed: string;
    stockValue: string;
    orders: string;
    lowStock: string;
  };
  products: {
    title: (n: number) => string;
    name: string;
    category: string;
    unitPrice: string;
    currency: string;
    remaining: string;
    sold: string;
    state: string;
    states: { en_stok: string; ba_stok: string; fini: string };
    other: string;
  };
  orders: {
    title: (n: number) => string;
    ref: string;
    customer: string;
    phone: string;
    stage: string;
    items: string;
    total: string;
    owed: string;
    itemsFallback: string;
  };
}

const fr: ReportCopy = {
  title: (business) => `Rapport ventes et stock — ${business}`,
  period: (period, date) => `Période : ${period} | Édité le ${date}`,
  periods: { week: "Cette semaine", month: "Ce mois-ci", all: "Depuis le début" },
  summary: {
    title: "1. Résumé financier et inventaire",
    revenue: "Ventes totales",
    paid: "Montant encaissé",
    owed: "Reste à encaisser",
    stockValue: "Valeur du stock",
    orders: "Nombre de commandes",
    lowStock: "Produits à réapprovisionner",
  },
  products: {
    title: (n) => `2. Produits et stock (${n})`,
    name: "Produit",
    category: "Catégorie",
    unitPrice: "Prix unitaire",
    currency: "Devise",
    remaining: "Stock restant",
    sold: "Ventes",
    state: "État du stock",
    states: { en_stok: "En stock", ba_stok: "Stock faible", fini: "Épuisé" },
    other: "Autre",
  },
  orders: {
    title: (n) => `3. Commandes (${n})`,
    ref: "Référence",
    customer: "Client",
    phone: "Téléphone",
    stage: "Étape",
    items: "Produits commandés",
    total: "Montant total",
    owed: "Reste dû",
    itemsFallback: "Produits divers",
  },
};

const ht: ReportCopy = {
  title: (business) => `Rapò vant ak stòk — ${business}`,
  period: (period, date) => `Peryòd : ${period} | Fèt jou ${date}`,
  periods: { week: "Semèn sa a", month: "Mwa sa a", all: "Depi nan konmansman" },
  summary: {
    title: "1. Rezime finansye ak envantè",
    revenue: "Vant total",
    paid: "Lajan ki antre",
    owed: "Lajan pou resevwa",
    stockValue: "Valè stòk la",
    orders: "Kantite kòmand",
    lowStock: "Pwodwi pou reapwovizyone",
  },
  products: {
    title: (n) => `2. Pwodwi ak stòk (${n})`,
    name: "Pwodwi",
    category: "Kategori",
    unitPrice: "Pri inite",
    currency: "Deviz",
    remaining: "Stòk ki rete",
    sold: "Vant",
    state: "Eta stòk",
    states: { en_stok: "Nan stòk", ba_stok: "Stòk fèb", fini: "Fini" },
    other: "Lòt",
  },
  orders: {
    title: (n) => `3. Kòmand yo (${n})`,
    ref: "Referans",
    customer: "Kliyan",
    phone: "Telefòn",
    stage: "Etap",
    items: "Pwodwi ki kòmande",
    total: "Montan total",
    owed: "Rès pou peye",
    itemsFallback: "Plizyè pwodwi",
  },
};

const en: ReportCopy = {
  title: (business) => `Sales and stock report — ${business}`,
  period: (period, date) => `Period: ${period} | Generated on ${date}`,
  periods: { week: "This week", month: "This month", all: "All time" },
  summary: {
    title: "1. Financial and inventory summary",
    revenue: "Total sales",
    paid: "Amount collected",
    owed: "Still to collect",
    stockValue: "Stock value",
    orders: "Number of orders",
    lowStock: "Products to restock",
  },
  products: {
    title: (n) => `2. Products and stock (${n})`,
    name: "Product",
    category: "Category",
    unitPrice: "Unit price",
    currency: "Currency",
    remaining: "Stock left",
    sold: "Sales",
    state: "Stock status",
    states: { en_stok: "In stock", ba_stok: "Low stock", fini: "Sold out" },
    other: "Other",
  },
  orders: {
    title: (n) => `3. Orders (${n})`,
    ref: "Reference",
    customer: "Customer",
    phone: "Phone",
    stage: "Stage",
    items: "Items ordered",
    total: "Total amount",
    owed: "Balance due",
    itemsFallback: "Various products",
  },
};

export const REPORT_COPY: Record<Language, ReportCopy> = { fr, ht, en };
