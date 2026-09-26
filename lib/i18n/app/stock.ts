import type { Language } from "../translations";
import type { StockMovementError } from "@/app/stok/actions";

type MovementKind = "vente" | "annulation" | "entree" | "perte" | "correction";

export interface StockCopy {
  title: string;
  subtitle: string;
  valuation: { title: string; total: string; products: (n: number) => string };
  alerts: { text: (n: number) => string; see: string };
  reports: {
    title: string;
    week: string;
    month: string;
    all: string;
    /** Bouton du rapport tableur : .xlsx depuis qu'un CSV s'ouvrait en une seule colonne. */
    csv: string;
    pdf: string;
    /** Les deux rapports sont separes, et soumis a deux droits distincts. */
    stock: string;
    stockHint: string;
    sales: string;
    salesHint: string;
  };
  search: string;
  filters: { all: (n: number) => string; low: (n: number) => string; out: (n: number) => string };
  quantity: string;
  untracked: string;
  tabs: { products: string; purchases: string; suppliers: string; history: string };
  /** Annuaire des fournisseurs : lister, joindre, commander. */
  suppliers: {
    title: string;
    hint: string;
    toReorder: (n: number) => string;
    add: string;
    addTitle: string;
    editTitle: string;
    name: string;
    phone: string;
    note: string;
    notePlaceholder: string;
    noPhone: string;
    needPhone: string;
    order: string;
    empty: string;
    lastDelivery: (date: string) => string;
    deliveries: (n: number) => string;
    deleteConfirm: (name: string) => string;
    duplicate: string;
    failed: string;
    forbidden: string;
    invalid: string;
    migration: string;
  };
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
  purchase: {
    new: string;
    title: string;
    hint: string;
    supplier: string;
    noSupplier: string;
    newSupplier: string;
    newSupplierPlaceholder: string;
    product: string;
    qty: string;
    unitCost: string;
    addLine: string;
    removeLine: string;
    total: string;
    paid: string;
    paidHint: string;
    method: string;
    date: string;
    note: string;
    save: string;
    saving: string;
    empty: string;
    unavailable: string;
    debt: (amount: string) => string;
    settled: string;
    lines: (n: number) => string;
    noProducts: string;
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
    title: "Rapports",
    week: "Cette semaine",
    month: "Ce mois-ci",
    all: "Depuis le début",
    csv: "Télécharger (Excel)",
    stock: "Inventaire de stock",
    stockHint: "Produits, quantités restantes et rotation. Aucun client, aucun chiffre d'affaires.",
    sales: "Rapport de ventes",
    salesHint: "Chiffre d'affaires, encaissé, reste à encaisser, et le détail des commandes avec vos clients.",
    pdf: "Version imprimable",
  },
  search: "Rechercher un produit…",
  filters: { all: (n) => `Tous (${n})`, low: (n) => `Stock faible (${n})`, out: (n) => `Épuisés (${n})` },
  quantity: "Quantité en stock",
  untracked: "Non suivi",
  tabs: { products: "Produits", purchases: "Réceptions", suppliers: "Fournisseurs", history: "Historique" },
  suppliers: {
    title: "Fournisseurs",
    hint: "Vos fournisseurs et leurs coordonnées, pour commander sans les chercher ailleurs.",
    toReorder: (n) => `${n} produit${n > 1 ? "s" : ""} à réapprovisionner : le bon de commande est déjà rempli.`,
    add: "Ajouter",
    addTitle: "Nouveau fournisseur",
    editTitle: "Modifier le fournisseur",
    name: "Nom du fournisseur",
    phone: "Numéro WhatsApp",
    note: "Note",
    notePlaceholder: "Ce qu'il livre, ses jours de passage…",
    noPhone: "Aucun numéro",
    needPhone: "Ajoutez un numéro pour commander",
    order: "Commander sur WhatsApp",
    empty: "Aucun fournisseur pour l'instant. Ajoutez-en un, ou enregistrez une réception : il sera créé tout seul.",
    lastDelivery: (date) => `dernière livraison le ${date}`,
    deliveries: (n) => `${n} livraison${n > 1 ? "s" : ""}`,
    deleteConfirm: (name) => `Retirer « ${name} » de l'annuaire ?\n\nLes réceptions déjà enregistrées restent, seul le contact s'en va.`,
    duplicate: "Un fournisseur porte déjà ce nom.",
    forbidden: "Votre rôle ne permet pas de gérer les fournisseurs.",
    invalid: "Le nom du fournisseur est obligatoire.",
    migration: "L'annuaire des fournisseurs n'est pas encore activé sur cette boutique.",
    failed: "L'enregistrement a échoué. Réessayez.",
  },
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
  purchase: {
    new: "Nouvelle réception",
    title: "Réception de marchandise",
    hint: "Le stock augmente et le prix d'achat de chaque produit est mis à jour.",
    supplier: "Fournisseur",
    noSupplier: "— Sans fournisseur —",
    newSupplier: "Ou nouveau fournisseur",
    newSupplierPlaceholder: "Nom du fournisseur",
    product: "Produit",
    qty: "Quantité",
    unitCost: "Prix d'achat unitaire",
    addLine: "+ Ajouter un produit",
    removeLine: "Retirer",
    total: "Total de la réception",
    paid: "Montant payé",
    paidHint: "Laissez moins que le total si vous payez plus tard : la différence devient une dette fournisseur.",
    method: "Payé par",
    date: "Date de réception",
    note: "Note (facultatif)",
    save: "Enregistrer la réception",
    saving: "Enregistrement…",
    empty: "Aucune réception enregistrée.",
    unavailable: "Les réceptions seront disponibles après la mise à jour de la base (migration 6).",
    debt: (a) => `Reste à payer : ${a}`,
    settled: "Payé",
    lines: (n) => (n <= 1 ? `${n} produit` : `${n} produits`),
    noProducts: "Ajoutez d'abord vos produits au catalogue.",
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
    title: "Rapò",
    week: "Semèn sa a",
    month: "Mwa sa a",
    all: "Depi nan konmansman",
    csv: "Telechaje (Excel)",
    stock: "Envantè stòk",
    stockHint: "Pwodwi, kantite ki rete ak rotasyon. Pa gen kliyan, pa gen chif dafè.",
    sales: "Rapò vant",
    salesHint: "Chif dafè, sa ki antre, sa ki rete pou rekouvre, ak detay kòmand yo ak kliyan ou yo.",
    pdf: "Vèsyon pou enprime",
  },
  search: "Chèche yon pwodwi…",
  filters: { all: (n) => `Tout (${n})`, low: (n) => `Stòk fèb (${n})`, out: (n) => `Fini (${n})` },
  quantity: "Kantite nan stòk",
  untracked: "Pa swiv",
  tabs: { products: "Pwodwi", purchases: "Resepsyon", suppliers: "Founisè", history: "Istorik" },
  suppliers: {
    title: "Founisè",
    hint: "Founisè ou yo ak kontak yo, pou w kòmande san w pa bezwen chèche lòt kote.",
    toReorder: (n) => `${n} pwodwi pou reyaprovizyone : bon kòmand lan deja ranpli.`,
    add: "Ajoute",
    addTitle: "Nouvo founisè",
    editTitle: "Modifye founisè a",
    name: "Non founisè a",
    phone: "Nimewo WhatsApp",
    note: "Nòt",
    notePlaceholder: "Sa l livre, ki jou l pase…",
    noPhone: "Pa gen nimewo",
    needPhone: "Mete yon nimewo pou kòmande",
    order: "Kòmande sou WhatsApp",
    empty: "Pa gen founisè pou kounye a. Ajoute youn, oswa anrejistre yon resepsyon : l ap kreye pou kont li.",
    lastDelivery: (date) => `dènye livrezon ${date}`,
    deliveries: (n) => `${n} livrezon`,
    deleteConfirm: (name) => `Retire « ${name} » nan lis la ?\n\nResepsyon ki deja anrejistre yo rete, se kontak la sèlman ki ale.`,
    duplicate: "Gen yon founisè ki deja rele konsa.",
    forbidden: "Wòl ou pa pèmèt ou jere founisè yo.",
    invalid: "Non founisè a obligatwa.",
    migration: "Lis founisè yo poko aktive sou boutik sa a.",
    failed: "Nou pa rive anrejistre. Eseye ankò.",
  },
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
  purchase: {
    new: "Nouvo resepsyon",
    title: "Resepsyon machandiz",
    hint: "Stòk la monte epi pri acha chak pwodwi mete ajou.",
    supplier: "Founisè",
    noSupplier: "— San founisè —",
    newSupplier: "Oswa nouvo founisè",
    newSupplierPlaceholder: "Non founisè a",
    product: "Pwodwi",
    qty: "Kantite",
    unitCost: "Pri acha pa inite",
    addLine: "+ Ajoute yon pwodwi",
    removeLine: "Retire",
    total: "Total resepsyon an",
    paid: "Kantite ki peye",
    paidHint: "Mete mwens pase total la si w ap peye pita : diferans lan tounen yon dèt founisè.",
    method: "Peye ak",
    date: "Dat resepsyon",
    note: "Nòt (si w vle)",
    save: "Anrejistre resepsyon an",
    saving: "N ap anrejistre…",
    empty: "Poko gen resepsyon.",
    unavailable: "Resepsyon yo ap disponib lè baz done a mete ajou (migrasyon 6).",
    debt: (a) => `Rès pou peye : ${a}`,
    settled: "Peye",
    lines: (n) => `${n} pwodwi`,
    noProducts: "Ajoute pwodwi ou yo nan katalòg la anvan.",
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
    title: "Reports",
    week: "This week",
    month: "This month",
    all: "All time",
    csv: "Download (Excel)",
    stock: "Stock inventory",
    stockHint: "Products, remaining quantities and turnover rate. No customers, no revenue.",
    sales: "Sales report",
    salesHint: "Revenue, collected, still to collect, and every order with your customers.",
    pdf: "Printable version",
  },
  search: "Search for a product…",
  filters: { all: (n) => `All (${n})`, low: (n) => `Low stock (${n})`, out: (n) => `Sold out (${n})` },
  quantity: "Quantity in stock",
  untracked: "Not tracked",
  tabs: { products: "Products", purchases: "Receipts", suppliers: "Suppliers", history: "History" },
  suppliers: {
    title: "Suppliers",
    hint: "Your suppliers and their contact details, so you can order without looking elsewhere.",
    toReorder: (n) => `${n} product${n > 1 ? "s" : ""} to restock: the order is already written for you.`,
    add: "Add",
    addTitle: "New supplier",
    editTitle: "Edit supplier",
    name: "Supplier name",
    phone: "WhatsApp number",
    note: "Note",
    notePlaceholder: "What they deliver, which days they come…",
    noPhone: "No number",
    needPhone: "Add a number to order",
    order: "Order on WhatsApp",
    empty: "No supplier yet. Add one, or record a receipt: it will be created for you.",
    lastDelivery: (date) => `last delivery on ${date}`,
    deliveries: (n) => (n === 1 ? "1 delivery" : `${n} deliveries`),
    deleteConfirm: (name) => `Remove "${name}" from the directory?\n\nRecorded receipts stay; only the contact goes.`,
    duplicate: "A supplier already has that name.",
    forbidden: "Your role does not allow managing suppliers.",
    invalid: "The supplier name is required.",
    migration: "The supplier directory is not enabled on this shop yet.",
    failed: "Saving failed. Please try again.",
  },
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
  purchase: {
    new: "New receipt",
    title: "Goods received",
    hint: "Stock goes up and each product's purchase cost is updated.",
    supplier: "Supplier",
    noSupplier: "— No supplier —",
    newSupplier: "Or a new supplier",
    newSupplierPlaceholder: "Supplier name",
    product: "Product",
    qty: "Quantity",
    unitCost: "Unit purchase cost",
    addLine: "+ Add a product",
    removeLine: "Remove",
    total: "Receipt total",
    paid: "Amount paid",
    paidHint: "Enter less than the total if you'll pay later: the difference becomes supplier debt.",
    method: "Paid with",
    date: "Date received",
    note: "Note (optional)",
    save: "Save receipt",
    saving: "Saving…",
    empty: "No receipts yet.",
    unavailable: "Receipts will be available after the database update (migration 6).",
    debt: (a) => `Still owed: ${a}`,
    settled: "Paid",
    lines: (n) => (n === 1 ? "1 product" : `${n} products`),
    noProducts: "Add your products to the catalog first.",
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
