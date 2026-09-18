import type { Language } from "../translations";
import type { StockMovementError } from "@/app/stok/actions";

type MovementKind = "vente" | "annulation" | "entree" | "perte" | "correction";

export interface StockCopy {
  title: string;
  subtitle: string;
  valuation: { title: string; total: string; products: (n: number) => string };
  alerts: { text: (n: number) => string; see: string };
  reports: { title: string; week: string; month: string; all: string; csv: string; pdf: string };
  search: string;
  filters: { all: (n: number) => string; low: (n: number) => string; out: (n: number) => string };
  quantity: string;
  untracked: string;
  tabs: { products: string; history: string };
  auto: string;
  movement: {
    open: string;
    title: string;
    current: (qty: string) => string;
    kinds: Record<"entree" | "perte" | "correction", string>;
    qtyLabel: Record<"entree" | "perte" | "correction", string>;
    note: string;
    notePlaceholder: string;
    after: (qty: number) => string;
    save: string;
    saving: string;
    cancel: string;
    errors: Record<StockMovementError, string>;
  };
  history: {
    title: string;
    empty: string;
    unavailable: string;
    kinds: Record<MovementKind, string>;
    order: (ref: string) => string;
    by: (name: string) => string;
    after: (qty: string) => string;
  };
  empty: { title: string; desc: string; cta: string; noMatch: string };
}

const fr: StockCopy = {
  title: "Stock",
  subtitle: "Entrées, sorties et inventaire, suivis automatiquement.",
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
  untracked: "Non suivi",
  tabs: { products: "Produits", history: "Historique" },
  auto: "Les ventes confirmées retirent le stock automatiquement ; une commande annulée le remet.",
  movement: {
    open: "Mouvement",
    title: "Mouvement de stock",
    current: (q) => `Stock actuel : ${q}`,
    kinds: { entree: "Entrée", perte: "Perte / casse", correction: "Inventaire" },
    qtyLabel: { entree: "Quantité reçue", perte: "Quantité perdue", correction: "Quantité comptée en rayon" },
    note: "Note (facultatif)",
    notePlaceholder: "Fournisseur, raison, référence…",
    after: (q) => `Nouveau stock : ${q}`,
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    errors: {
      forbidden: "Vous n'avez pas le droit de modifier le stock.",
      invalid: "Quantité invalide.",
      migration: "Mise à jour de la base nécessaire (migration 5) avant d'enregistrer des mouvements.",
      failed: "L'enregistrement a échoué. Réessayez.",
    },
  },
  history: {
    title: "Historique des mouvements",
    empty: "Aucun mouvement pour l'instant.",
    unavailable: "L'historique sera disponible après la mise à jour de la base (migration 5).",
    kinds: { vente: "Vente", annulation: "Annulation", entree: "Entrée", perte: "Perte", correction: "Inventaire" },
    order: (ref) => `Commande #${ref}`,
    by: (name) => `par ${name}`,
    after: (q) => `stock : ${q}`,
  },
  empty: {
    title: "Aucun produit à suivre",
    desc: "Le stock se remplit à partir de votre catalogue : ajoutez-y vos produits avec leur quantité.",
    cta: "Ouvrir le catalogue",
    noMatch: "Aucun produit ne correspond à votre recherche.",
  },
};

const ht: StockCopy = {
  title: "Stòk",
  subtitle: "Antre, sòti ak envantè, swiv otomatikman.",
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
  untracked: "Pa swiv",
  tabs: { products: "Pwodwi", history: "Istorik" },
  auto: "Vant ki konfime yo retire stòk la otomatikman ; yon kòmand ki anile remèt li.",
  movement: {
    open: "Mouvman",
    title: "Mouvman stòk",
    current: (q) => `Stòk kounye a : ${q}`,
    kinds: { entree: "Antre", perte: "Pèt / kase", correction: "Envantè" },
    qtyLabel: { entree: "Kantite ki rantre", perte: "Kantite ki pèdi", correction: "Kantite ou konte" },
    note: "Nòt (si w vle)",
    notePlaceholder: "Founisè, rezon, referans…",
    after: (q) => `Nouvo stòk : ${q}`,
    save: "Anrejistre",
    saving: "N ap anrejistre…",
    cancel: "Anile",
    errors: {
      forbidden: "Ou pa gen dwa chanje stòk la.",
      invalid: "Kantite a pa bon.",
      migration: "Fòk baz done a mete ajou (migrasyon 5) anvan ou anrejistre mouvman.",
      failed: "Anrejistreman an pa mache. Eseye ankò.",
    },
  },
  history: {
    title: "Istorik mouvman yo",
    empty: "Poko gen mouvman.",
    unavailable: "Istorik la ap disponib lè baz done a mete ajou (migrasyon 5).",
    kinds: { vente: "Vant", annulation: "Anilasyon", entree: "Antre", perte: "Pèt", correction: "Envantè" },
    order: (ref) => `Kòmand #${ref}`,
    by: (name) => `pa ${name}`,
    after: (q) => `stòk : ${q}`,
  },
  empty: {
    title: "Pa gen pwodwi pou swiv",
    desc: "Stòk la soti nan katalòg ou : ajoute pwodwi ou yo ak kantite yo.",
    cta: "Ouvri katalòg la",
    noMatch: "Pa gen pwodwi ki koresponn ak rechèch ou a.",
  },
};

const en: StockCopy = {
  title: "Stock",
  subtitle: "Stock in, stock out and counts, tracked automatically.",
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
  untracked: "Not tracked",
  tabs: { products: "Products", history: "History" },
  auto: "Confirmed sales remove stock automatically; a cancelled order puts it back.",
  movement: {
    open: "Movement",
    title: "Stock movement",
    current: (q) => `Current stock: ${q}`,
    kinds: { entree: "Stock in", perte: "Loss / damage", correction: "Count" },
    qtyLabel: { entree: "Quantity received", perte: "Quantity lost", correction: "Quantity counted on the shelf" },
    note: "Note (optional)",
    notePlaceholder: "Supplier, reason, reference…",
    after: (q) => `New stock: ${q}`,
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    errors: {
      forbidden: "You're not allowed to change stock.",
      invalid: "Invalid quantity.",
      migration: "A database update (migration 5) is needed before recording movements.",
      failed: "Saving failed. Try again.",
    },
  },
  history: {
    title: "Movement history",
    empty: "No movements yet.",
    unavailable: "History will be available after the database update (migration 5).",
    kinds: { vente: "Sale", annulation: "Cancellation", entree: "Stock in", perte: "Loss", correction: "Count" },
    order: (ref) => `Order #${ref}`,
    by: (name) => `by ${name}`,
    after: (q) => `stock: ${q}`,
  },
  empty: {
    title: "No product to track",
    desc: "Stock comes from your catalog: add your products there with their quantity.",
    cta: "Open the catalog",
    noMatch: "No product matches your search.",
  },
};

export const STOCK_COPY: Record<Language, StockCopy> = { fr, ht, en };
