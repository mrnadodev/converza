import type { Language } from "../translations";

export interface CatalogCopy {
  title: string;
  count: (n: number) => string;
  viewStore: string;
  readOnly: string;
  view: { grid: string; list: string };
  hidden: string;
  noPhoto: string;
  general: string;
  stockState: { en_stok: string; ba_stok: string; fini: string };
  empty: { title: string; desc: string; cta: string };
  addProduct: string;
  form: {
    newTitle: string;
    editTitle: string;
    photo1: string;
    photo2: string;
    photo3: string;
    showcase: string;
    showcaseHint: string;
    addPhoto: string;
    name: string;
    namePlaceholder: string;
    price: (currency: string) => string;
    unit: string;
    unitPlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    cost: (currency: string) => string;
    costHelp: string;
    margin: (amount: string, pct: number) => string;
    stockQty: string;
    stockQtyHint: string;
    stockQtyHelp: string;
    visible: string;
    submitNew: string;
    submitEdit: string;
  };
  deleteConfirm: (name: string) => string;
  bulk: {
    title: string;
    desc: string;
    download: string;
    upload: string;
    previewTitle: string;
    ready: (n: number) => string;
    lineWarnings: string;
    imported: (n: number) => string;
    confirm: string;
    importing: string;
  };
}

const fr: CatalogCopy = {
  title: "Catalogue",
  count: (n) => (n <= 1 ? `${n} produit` : `${n} produits`),
  viewStore: "Voir ma vitrine",
  readOnly: "Catalogue en lecture seule : votre rôle ne permet pas de modifier les produits.",
  view: { grid: "Grille", list: "Liste" },
  hidden: "Masqué",
  noPhoto: "Pas de photo",
  general: "Général",
  stockState: { en_stok: "en stock", ba_stok: "stock faible", fini: "épuisé" },
  empty: {
    title: "Votre catalogue est vide",
    desc: "Ajoutez un premier produit avec son nom, son prix et une photo : il apparaîtra aussitôt sur votre vitrine.",
    cta: "Ajouter un produit",
  },
  addProduct: "Ajouter un produit",
  form: {
    newTitle: "Nouveau produit",
    editTitle: "Modifier le produit",
    photo1: "Photo principale",
    photo2: "Deuxième photo",
    photo3: "Troisième photo",
    showcase: "Mettre en vitrine",
    showcaseHint: "Ce produit apparaît en premier sur votre vitrine. Les autres restent visibles dans le catalogue complet.",
    addPhoto: "Ajouter une photo",
    name: "Nom du produit",
    namePlaceholder: "Œufs frais",
    price: (currency) => `Prix (${currency})`,
    unit: "Unité",
    unitPlaceholder: "douzaine",
    category: "Catégorie",
    categoryPlaceholder: "Alimentation",
    cost: (currency) => `Prix d'achat (${currency}) — facultatif`,
    costHelp: "Ce que le produit vous coûte. Il sert à calculer votre bénéfice ; vos clients ne le voient jamais.",
    margin: (amount, pct) => `Marge : ${amount} par unité (${pct} %)`,
    stockQty: "Quantité en stock",
    stockQtyHint: "42",
    stockQtyHelp: "En stock, stock faible ou épuisé se calcule tout seul à partir de cette quantité.",
    visible: "Visible sur la vitrine",
    submitNew: "Ajouter le produit",
    submitEdit: "Enregistrer les modifications",
  },
  deleteConfirm: (name) => `Supprimer « ${name} » ?`,
  bulk: {
    title: "Import en masse",
    desc: "Ajoutez plusieurs produits d'un coup à partir d'un fichier Excel ou CSV.",
    download: "Télécharger le modèle",
    upload: "Importer un fichier",
    previewTitle: "Aperçu de l'import",
    ready: (n) => (n <= 1 ? `${n} produit prêt à importer.` : `${n} produits prêts à importer.`),
    lineWarnings: "Lignes ignorées :",
    imported: (n) => (n <= 1 ? `${n} produit ajouté.` : `${n} produits ajoutés.`),
    confirm: "Confirmer l'import",
    importing: "Import en cours…",
  },
};

const ht: CatalogCopy = {
  title: "Katalòg",
  count: (n) => `${n} pwodwi`,
  viewStore: "Gade vitrin mwen",
  readOnly: "Katalòg an lekti sèlman : ròl ou pa pèmèt ou chanje pwodwi yo.",
  view: { grid: "Kadriyaj", list: "Lis" },
  hidden: "Kache",
  noPhoto: "Pa gen foto",
  general: "Jeneral",
  stockState: { en_stok: "nan stòk", ba_stok: "stòk fèb", fini: "fini" },
  empty: {
    title: "Katalòg ou vid",
    desc: "Ajoute yon premye pwodwi ak non l, pri l ak yon foto : l ap parèt tousuit sou vitrin ou.",
    cta: "Ajoute yon pwodwi",
  },
  addProduct: "Ajoute yon pwodwi",
  form: {
    newTitle: "Nouvo pwodwi",
    editTitle: "Modifye pwodwi a",
    photo1: "Foto prensipal",
    photo2: "Dezyèm foto",
    photo3: "Twazyèm foto",
    showcase: "Mete nan vitrin",
    showcaseHint: "Pwodwi sa a parèt an premye sou vitrin ou. Lòt yo rete disponib nan katalòg la.",
    addPhoto: "Ajoute yon foto",
    name: "Non pwodwi a",
    namePlaceholder: "Ze fre",
    price: (currency) => `Pri (${currency})`,
    unit: "Inite",
    unitPlaceholder: "douzèn",
    category: "Kategori",
    categoryPlaceholder: "Manje",
    cost: (currency) => `Pri acha (${currency}) — si w vle`,
    costHelp: "Sa pwodwi a koute w. Li sèvi pou kalkile benefis ou ; kliyan ou yo pa janm wè l.",
    margin: (amount, pct) => `Maj : ${amount} pa inite (${pct} %)`,
    stockQty: "Kantite nan stòk",
    stockQtyHint: "42",
    stockQtyHelp: "Nan stòk, stòk fèb oswa fini kalkile poukont li apati kantite sa a.",
    visible: "Vizib sou vitrin nan",
    submitNew: "Ajoute pwodwi a",
    submitEdit: "Anrejistre chanjman yo",
  },
  deleteConfirm: (name) => `Efase « ${name} » ?`,
  bulk: {
    title: "Enpòte an gwo",
    desc: "Ajoute plizyè pwodwi yon sèl kou ak yon fichye Excel oswa CSV.",
    download: "Telechaje modèl la",
    upload: "Enpòte yon fichye",
    previewTitle: "Apèsi enpòtasyon an",
    ready: (n) => `${n} pwodwi pare pou enpòte.`,
    lineWarnings: "Liy nou pa pran :",
    imported: (n) => `${n} pwodwi ajoute.`,
    confirm: "Konfime enpòtasyon an",
    importing: "N ap enpòte…",
  },
};

const en: CatalogCopy = {
  title: "Catalog",
  count: (n) => (n === 1 ? "1 product" : `${n} products`),
  viewStore: "View my storefront",
  readOnly: "Catalog is read-only: your role cannot change products.",
  view: { grid: "Grid", list: "List" },
  hidden: "Hidden",
  noPhoto: "No photo",
  general: "General",
  stockState: { en_stok: "in stock", ba_stok: "low stock", fini: "sold out" },
  empty: {
    title: "Your catalog is empty",
    desc: "Add a first product with its name, price and a photo: it appears on your storefront right away.",
    cta: "Add a product",
  },
  addProduct: "Add a product",
  form: {
    newTitle: "New product",
    editTitle: "Edit product",
    photo1: "Main photo",
    photo2: "Second photo",
    photo3: "Third photo",
    showcase: "Feature on the storefront",
    showcaseHint: "This product appears first on your storefront. The others stay visible in the full catalogue.",
    addPhoto: "Add a photo",
    name: "Product name",
    namePlaceholder: "Fresh eggs",
    price: (currency) => `Price (${currency})`,
    unit: "Unit",
    unitPlaceholder: "dozen",
    category: "Category",
    categoryPlaceholder: "Food",
    cost: (currency) => `Purchase cost (${currency}) — optional`,
    costHelp: "What the product costs you. It's used to work out your profit; customers never see it.",
    margin: (amount, pct) => `Margin: ${amount} per unit (${pct}%)`,
    stockQty: "Quantity in stock",
    stockQtyHint: "42",
    stockQtyHelp: "In stock, low stock or sold out is worked out from this quantity.",
    visible: "Visible on the storefront",
    submitNew: "Add product",
    submitEdit: "Save changes",
  },
  deleteConfirm: (name) => `Delete “${name}”?`,
  bulk: {
    title: "Bulk import",
    desc: "Add many products at once from an Excel or CSV file.",
    download: "Download the template",
    upload: "Import a file",
    previewTitle: "Import preview",
    ready: (n) => (n === 1 ? "1 product ready to import." : `${n} products ready to import.`),
    lineWarnings: "Skipped rows:",
    imported: (n) => (n === 1 ? "1 product added." : `${n} products added.`),
    confirm: "Confirm import",
    importing: "Importing…",
  },
};

export const CATALOG_COPY: Record<Language, CatalogCopy> = { fr, ht, en };
