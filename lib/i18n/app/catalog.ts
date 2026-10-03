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
    subcategory: string;
    categoryPlaceholder: string;
    /** Entree neutre en tete des deux listes de categorie : rien n a encore ete choisi. */
    categoryPick: string;
    /** Taille, pour ce qui se porte ou se chausse. */
    size: string;
    sizeHelp: string;
    /** Prix promotionnel (migration 15) : le prix barre est celui du produit. */
    promo: (currency: string) => string;
    promoHelp: string;
    promoEnds: string;
    promoEndsHelp: string;
    /** Rappel sous le champ des que la saisie ne ferait pas une vraie remise. */
    promoInvalid: string;
    /** Confirmation vivante : ce que le client verra exactement. */
    promoPreview: (avant: string, apres: string, pct: number) => string;
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
    /** Quand le fichier depose ne se lit ni en classeur ni en texte. */
    readFailed: string;
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
    subcategory: "Sous-catégorie",
    categoryPlaceholder: "Alimentation",
    categoryPick: "Choisir…",
    size: "Taille",
    sizeHelp: "Les tailles disponibles pour cet article : « M », « 38 à 42 », « Taille unique »…",
    promo: (currency) => `Prix promo (${currency}) — facultatif`,
    promoHelp: "Laissez vide s'il n'y a pas de promotion. Le prix normal s'affichera barré à côté.",
    promoEnds: "Fin de la promo — facultatif",
    promoEndsHelp: "À cette date, le prix normal revient tout seul. Vide : la promo dure jusqu'à ce que vous l'enleviez.",
    promoInvalid: "Le prix promo doit être inférieur au prix normal, sinon il n'y a pas de remise à montrer.",
    promoPreview: (avant, apres, pct) => `Vos clients verront ${avant} barré, puis ${apres} — soit −${pct} %.`,
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
    readFailed: "Ce fichier n'a pas pu être lu. Utilisez le modèle, ou enregistrez votre tableau en .xlsx ou .csv.",
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
    subcategory: "Sou-kategori",
    categoryPlaceholder: "Manje",
    categoryPick: "Chwazi…",
    size: "Gwosè",
    sizeHelp: "Gwosè ki disponib pou atik sa a : « M », « 38 a 42 », « Yon sèl gwosè »…",
    promo: (currency) => `Pri pwomosyon (${currency}) — opsyonèl`,
    promoHelp: "Kite l vid si pa gen pwomosyon. Pri nòmal la ap parèt bare bò kote l.",
    promoEnds: "Fen pwomosyon an — opsyonèl",
    promoEndsHelp: "Nan dat sa a, pri nòmal la tounen pou kont li. Vid : pwomosyon an dire jiskaske ou retire l.",
    promoInvalid: "Pri pwomosyon an dwe pi ba pase pri nòmal la, sinon pa gen rabè pou montre.",
    promoPreview: (avant, apres, pct) => `Kliyan ou yo ap wè ${avant} bare, apre sa ${apres} — sa fè −${pct} %.`,
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
    readFailed: "Nou pa rive li fichye sa a. Sèvi ak modèl la, oswa anrejistre tablo ou an .xlsx oswa .csv.",
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
    subcategory: "Sub-category",
    categoryPlaceholder: "Food",
    categoryPick: "Choose…",
    size: "Size",
    sizeHelp: "The sizes available for this item: « M », « 38 to 42 », « One size »…",
    promo: (currency) => `Sale price (${currency}) — optional`,
    promoHelp: "Leave empty if there is no sale. The normal price will show struck through next to it.",
    promoEnds: "Sale ends — optional",
    promoEndsHelp: "On that date the normal price comes back on its own. Empty: the sale runs until you remove it.",
    promoInvalid: "The sale price must be lower than the normal price, otherwise there is no discount to show.",
    promoPreview: (avant, apres, pct) => `Your customers will see ${avant} struck through, then ${apres} — that is −${pct}%.`,
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
    readFailed: "This file could not be read. Use the template, or save your sheet as .xlsx or .csv.",
  },
};

export const CATALOG_COPY: Record<Language, CatalogCopy> = { fr, ht, en };
