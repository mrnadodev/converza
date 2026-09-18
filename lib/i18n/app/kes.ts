import type { Language } from "../translations";
import type { KesError } from "@/app/kes/actions";

// Écran « Kès » : caisse, dépenses, bénéfice, argent dehors.

export interface KesCopy {
  title: string;
  subtitle: string;
  periods: { day: string; week: string; month: string };
  since: (date: string) => string;
  unavailable: string;
  forbidden: string;
  cards: {
    cashIn: string;
    expenses: string;
    purchases: string;
    balance: string;
    balanceHint: string;
    sales: (n: number) => string;
    grossProfit: string;
    netProfit: string;
    netHint: string;
    coverage: (pct: number) => string;
    noCost: string;
    setCosts: string;
  };
  byMethod: string;
  methods: Record<string, string>;
  otherCurrency: (n: number, currency: string) => string;
  receivables: { title: string; hint: string; empty: string; remind: string; days: (n: number) => string };
  supplierDebt: { title: string; empty: string };
  expense: {
    title: string;
    add: string;
    amount: string;
    category: string;
    categories: Record<string, string>;
    method: string;
    note: string;
    notePlaceholder: string;
    date: string;
    save: string;
    saving: string;
    empty: string;
    remove: string;
    removeConfirm: string;
    errors: Record<KesError, string>;
  };
}

const methodsFr = {
  moncash: "MonCash",
  natcash: "NatCash",
  kach: "Espèces",
  cash: "Espèces",
  zelle: "Zelle",
  crypto_usdt: "USDT",
  banque: "Banque",
  unibank_htg: "Unibank",
  unibank_usd: "Unibank",
  buh_htg: "BUH",
  buh_usd: "BUH",
  sogebank_htg: "Sogebank",
  sogebank_usd: "Sogebank",
  banque_locale: "Banque",
  lot: "Autre",
  autre: "Autre",
  "": "Non précisé",
};

export const KES_COPY: Record<Language, KesCopy> = {
  fr: {
    title: "Kès",
    subtitle: "Ce qui rentre, ce qui sort, ce qui vous reste.",
    periods: { day: "Aujourd'hui", week: "Cette semaine", month: "Ce mois-ci" },
    since: (d) => `Depuis le ${d}`,
    unavailable: "La Kès sera disponible après la mise à jour de la base (migration 6).",
    forbidden: "Seul le propriétaire voit la Kès.",
    cards: {
      cashIn: "Encaissé",
      expenses: "Dépenses",
      purchases: "Achats payés",
      balance: "Solde de caisse",
      balanceHint: "Encaissé − dépenses − achats payés",
      sales: (n) => (n <= 1 ? `Ventes confirmées (${n} commande)` : `Ventes confirmées (${n} commandes)`),
      grossProfit: "Bénéfice sur les ventes",
      netProfit: "Bénéfice net",
      netHint: "Bénéfice sur les ventes − dépenses",
      coverage: (pct) => `Calculé sur ${pct} % des ventes : le reste n'a pas de prix d'achat.`,
      noCost: "Ajoutez le prix d'achat de vos produits pour voir votre bénéfice.",
      setCosts: "Compléter dans le catalogue",
    },
    byMethod: "Par moyen de paiement",
    methods: methodsFr,
    otherCurrency: (n, c) => `${n} commande(s) dans une autre devise que ${c} ne sont pas comptées.`,
    receivables: {
      title: "Lajan deyò (à encaisser)",
      hint: "Commandes non soldées, toutes dates confondues.",
      empty: "Aucun client ne vous doit d'argent.",
      remind: "Relancer",
      days: (n) => (n === 0 ? "aujourd'hui" : n === 1 ? "il y a 1 jour" : `il y a ${n} jours`),
    },
    supplierDebt: { title: "Dettes fournisseurs", empty: "Aucune dette fournisseur." },
    expense: {
      title: "Dépenses",
      add: "Ajouter une dépense",
      amount: "Montant",
      category: "Catégorie",
      categories: {
        loyer: "Loyer",
        transport: "Transport",
        electricite: "Électricité",
        communication: "Téléphone & internet",
        salaire: "Salaires",
        emballage: "Emballage",
        publicite: "Publicité",
        autre: "Autre",
      },
      method: "Payé par",
      note: "Note",
      notePlaceholder: "Ex. : essence livraison",
      date: "Date",
      save: "Enregistrer la dépense",
      saving: "Enregistrement…",
      empty: "Aucune dépense sur la période.",
      remove: "Supprimer",
      removeConfirm: "Supprimer cette dépense ?",
      errors: {
        forbidden: "Seul le propriétaire peut enregistrer des dépenses.",
        invalid: "Montant ou date invalide.",
        migration: "Mise à jour de la base nécessaire (migration 6).",
        failed: "L'enregistrement a échoué. Réessayez.",
      },
    },
  },
  ht: {
    title: "Kès",
    subtitle: "Sa k antre, sa k soti, sa k rete pou ou.",
    periods: { day: "Jodi a", week: "Semèn sa a", month: "Mwa sa a" },
    since: (d) => `Depi ${d}`,
    unavailable: "Kès la ap disponib lè baz done a mete ajou (migrasyon 6).",
    forbidden: "Se sèlman mèt boutik la ki wè Kès la.",
    cards: {
      cashIn: "Lajan ki antre",
      expenses: "Depans",
      purchases: "Acha ki peye",
      balance: "Balans kès",
      balanceHint: "Lajan ki antre − depans − acha ki peye",
      sales: (n) => `Vant konfime (${n} kòmand)`,
      grossProfit: "Benefis sou vant yo",
      netProfit: "Benefis nèt",
      netHint: "Benefis sou vant − depans",
      coverage: (pct) => `Kalkile sou ${pct} % vant yo : rès la pa gen pri acha.`,
      noCost: "Mete pri acha pwodwi ou yo pou w wè benefis ou.",
      setCosts: "Konplete nan katalòg la",
    },
    byMethod: "Pa mwayen peman",
    methods: { ...methodsFr, kach: "Kach", cash: "Kach", banque: "Bank", banque_locale: "Bank", lot: "Lòt", autre: "Lòt", "": "Pa presize" },
    otherCurrency: (n, c) => `${n} kòmand nan yon lòt lajan pase ${c} pa konte.`,
    receivables: {
      title: "Lajan deyò",
      hint: "Kòmand ki poko fin peye, tout dat.",
      empty: "Pa gen kliyan ki dwe w lajan.",
      remind: "Raple",
      days: (n) => (n === 0 ? "jodi a" : n === 1 ? "sa gen 1 jou" : `sa gen ${n} jou`),
    },
    supplierDebt: { title: "Dèt founisè", empty: "Pa gen dèt founisè." },
    expense: {
      title: "Depans",
      add: "Ajoute yon depans",
      amount: "Kantite lajan",
      category: "Kategori",
      categories: {
        loyer: "Lwaye",
        transport: "Transpò",
        electricite: "Kouran",
        communication: "Telefòn & entènèt",
        salaire: "Salè",
        emballage: "Anbalaj",
        publicite: "Piblisite",
        autre: "Lòt",
      },
      method: "Peye ak",
      note: "Nòt",
      notePlaceholder: "Egz. : gaz pou livrezon",
      date: "Dat",
      save: "Anrejistre depans lan",
      saving: "N ap anrejistre…",
      empty: "Pa gen depans pou peryòd la.",
      remove: "Efase",
      removeConfirm: "Efase depans sa a ?",
      errors: {
        forbidden: "Se sèlman mèt boutik la ki ka anrejistre depans.",
        invalid: "Kantite lajan oswa dat la pa bon.",
        migration: "Fòk baz done a mete ajou (migrasyon 6).",
        failed: "Anrejistreman an pa mache. Eseye ankò.",
      },
    },
  },
  en: {
    title: "Cash",
    subtitle: "What comes in, what goes out, what you keep.",
    periods: { day: "Today", week: "This week", month: "This month" },
    since: (d) => `Since ${d}`,
    unavailable: "Cash will be available after the database update (migration 6).",
    forbidden: "Only the owner can see Cash.",
    cards: {
      cashIn: "Collected",
      expenses: "Expenses",
      purchases: "Purchases paid",
      balance: "Cash balance",
      balanceHint: "Collected − expenses − purchases paid",
      sales: (n) => (n === 1 ? "Confirmed sales (1 order)" : `Confirmed sales (${n} orders)`),
      grossProfit: "Profit on sales",
      netProfit: "Net profit",
      netHint: "Profit on sales − expenses",
      coverage: (pct) => `Based on ${pct}% of sales: the rest has no purchase cost.`,
      noCost: "Add your products' purchase cost to see your profit.",
      setCosts: "Complete in the catalog",
    },
    byMethod: "By payment method",
    methods: { ...methodsFr, kach: "Cash", cash: "Cash", banque: "Bank", banque_locale: "Bank", lot: "Other", autre: "Other", "": "Not specified" },
    otherCurrency: (n, c) => `${n} order(s) in a currency other than ${c} are not counted.`,
    receivables: {
      title: "Money owed to you",
      hint: "Orders not fully paid, all dates.",
      empty: "No customer owes you money.",
      remind: "Remind",
      days: (n) => (n === 0 ? "today" : n === 1 ? "1 day ago" : `${n} days ago`),
    },
    supplierDebt: { title: "Owed to suppliers", empty: "Nothing owed to suppliers." },
    expense: {
      title: "Expenses",
      add: "Add an expense",
      amount: "Amount",
      category: "Category",
      categories: {
        loyer: "Rent",
        transport: "Transport",
        electricite: "Electricity",
        communication: "Phone & internet",
        salaire: "Wages",
        emballage: "Packaging",
        publicite: "Advertising",
        autre: "Other",
      },
      method: "Paid with",
      note: "Note",
      notePlaceholder: "E.g. delivery fuel",
      date: "Date",
      save: "Save expense",
      saving: "Saving…",
      empty: "No expenses in this period.",
      remove: "Delete",
      removeConfirm: "Delete this expense?",
      errors: {
        forbidden: "Only the owner can record expenses.",
        invalid: "Invalid amount or date.",
        migration: "A database update is needed (migration 6).",
        failed: "Saving failed. Try again.",
      },
    },
  },
};
