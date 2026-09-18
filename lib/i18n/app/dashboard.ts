import type { Language } from "../translations";

export interface DashboardCopy {
  greeting: (name: string) => string;
  search: string;
  signOutAs: (name: string) => string;
  days: string[];
  metrics: {
    weekSales: string;
    trend: (pct: number) => string;
    noComparison: string;
    ordersToday: string;
    toCollect: string;
    inProgress: string;
  };
  actions: {
    share: string;
    copied: string;
    shareTitle: string;
    shareText: string;
    viewStore: string;
    poster: string;
  };
  firstSteps: {
    title: string;
    subtitle: string;
    progress: (done: number, total: number) => string;
    done: string;
    products: { title: string; desc: string; cta: string };
    payments: { title: string; desc: string; cta: string };
    share: { title: string; desc: string; cta: string };
    firstOrder: { title: string; desc: string };
  };
  stockAlerts: {
    title: (n: number) => string;
    out: string;
    low: (qty: number, threshold: number) => string;
    cta: string;
  };
  funnel: { title: string; leads: string; orders: string; paid: string; delivered: string };
  sources: { title: string; period: string; empty: string; direct: string };
  topCustomers: { title: string; empty: string };
  recent: { title: string; empty: string; owed: string };
  agent: {
    title: (profile: string) => string;
    subtitle: string;
    queue: string;
    empty: string;
    open: string;
  };
}

const fr: DashboardCopy = {
  greeting: (name) => `Bonjour, ${name}`,
  search: "Rechercher un client…",
  signOutAs: (name) => `Se déconnecter (${name})`,
  days: ["L", "M", "M", "J", "V", "S", "D"],
  metrics: {
    weekSales: "Ventes de la semaine",
    trend: (pct) => `${pct > 0 ? "+" : ""}${pct} % vs sem. dernière`,
    noComparison: "Première semaine",
    ordersToday: "Commandes aujourd'hui",
    toCollect: "Reste à encaisser",
    inProgress: "Commandes en cours",
  },
  actions: {
    share: "Partager ma vitrine",
    copied: "Lien copié",
    shareTitle: "Commander sur WhatsApp",
    shareText: "Découvrez notre catalogue et commandez facilement sur WhatsApp :",
    viewStore: "Voir ma vitrine",
    poster: "Créer une affiche",
  },
  firstSteps: {
    title: "Premiers pas",
    subtitle: "Trois étapes pour recevoir votre première commande.",
    progress: (done, total) => `${done} sur ${total}`,
    done: "Fait",
    products: {
      title: "Ajoutez vos produits",
      desc: "Nom, prix et photo : c'est ce que vos clients verront.",
      cta: "Ouvrir le catalogue",
    },
    payments: {
      title: "Indiquez comment être payé",
      desc: "MonCash, NatCash, virement… affichés au client au moment de payer.",
      cta: "Ouvrir les paramètres",
    },
    share: {
      title: "Partagez le lien de votre vitrine",
      desc: "Dans vos statuts WhatsApp, votre bio Instagram ou vos publicités.",
      cta: "Partager",
    },
    firstOrder: {
      title: "Recevez votre première commande",
      desc: "Elle apparaîtra ici et dans l'onglet Commandes.",
    },
  },
  stockAlerts: {
    title: (n) => (n === 1 ? "1 produit à réapprovisionner" : `${n} produits à réapprovisionner`),
    out: "Épuisé",
    low: (qty, threshold) => `${qty} en stock · seuil ${threshold}`,
    cta: "Gérer le stock",
  },
  funnel: {
    title: "Entonnoir de vente",
    leads: "Clients",
    orders: "Commandes",
    paid: "Payées",
    delivered: "Livrées",
  },
  sources: {
    title: "D'où viennent les ventes",
    period: "30 derniers jours",
    empty:
      "Pas encore de commande. Ajoutez ?utm_source=tiktok au lien de votre vitrine dans vos publicités pour savoir quelle campagne rapporte.",
    direct: "Lien direct",
  },
  topCustomers: {
    title: "Meilleurs clients",
    empty: "Vos meilleurs clients apparaîtront après vos premières commandes.",
  },
  recent: {
    title: "Dernières commandes",
    empty: "Aucune commande pour le moment.",
    owed: "reste dû",
  },
  agent: {
    title: (profile) => `Votre espace · ${profile}`,
    subtitle: "Les commandes des étapes dont vous avez la charge.",
    queue: "À traiter",
    empty: "Rien à traiter pour le moment.",
    open: "Ouvrir les commandes",
  },
};

const ht: DashboardCopy = {
  greeting: (name) => `Bonjou, ${name}`,
  search: "Chèche yon kliyan…",
  signOutAs: (name) => `Dekonekte (${name})`,
  days: ["L", "M", "M", "J", "V", "S", "D"],
  metrics: {
    weekSales: "Vant semèn nan",
    trend: (pct) => `${pct > 0 ? "+" : ""}${pct} % sou semèn pase`,
    noComparison: "Premye semèn",
    ordersToday: "Kòmand jodi a",
    toCollect: "Lajan pou resevwa",
    inProgress: "Kòmand an kou",
  },
  actions: {
    share: "Pataje vitrin mwen",
    copied: "Lyen kopye",
    shareTitle: "Kòmande sou WhatsApp",
    shareText: "Gade katalòg nou an epi kòmande fasil sou WhatsApp :",
    viewStore: "Gade vitrin mwen",
    poster: "Kreye yon afich",
  },
  firstSteps: {
    title: "Premye etap yo",
    subtitle: "Twa etap pou w resevwa premye kòmand ou.",
    progress: (done, total) => `${done} sou ${total}`,
    done: "Fini",
    products: {
      title: "Ajoute pwodwi ou yo",
      desc: "Non, pri ak foto : se sa kliyan ou yo pral wè.",
      cta: "Ouvri katalòg la",
    },
    payments: {
      title: "Di kijan pou yo peye w",
      desc: "MonCash, NatCash, vèsman… kliyan an wè yo lè l ap peye.",
      cta: "Ouvri reglaj yo",
    },
    share: {
      title: "Pataje lyen vitrin ou",
      desc: "Nan estati WhatsApp ou, bio Instagram ou oswa piblisite ou yo.",
      cta: "Pataje",
    },
    firstOrder: {
      title: "Resevwa premye kòmand ou",
      desc: "L ap parèt isit la ak nan paj Kòmand yo.",
    },
  },
  stockAlerts: {
    title: (n) => (n === 1 ? "1 pwodwi pou reapwovizyone" : `${n} pwodwi pou reapwovizyone`),
    out: "Fini",
    low: (qty, threshold) => `${qty} nan stòk · limit ${threshold}`,
    cta: "Jere stòk la",
  },
  funnel: {
    title: "Etap vant yo",
    leads: "Kliyan",
    orders: "Kòmand",
    paid: "Peye",
    delivered: "Livre",
  },
  sources: {
    title: "Kote vant yo soti",
    period: "30 dènye jou",
    empty:
      "Poko gen kòmand. Ajoute ?utm_source=tiktok nan lyen vitrin ou nan piblisite yo pou w konnen ki kanpay ki pote vant.",
    direct: "Lyen dirèk",
  },
  topCustomers: {
    title: "Pi bon kliyan yo",
    empty: "Pi bon kliyan ou yo ap parèt apre premye kòmand yo.",
  },
  recent: {
    title: "Dènye kòmand yo",
    empty: "Poko gen kòmand.",
    owed: "rès pou peye",
  },
  agent: {
    title: (profile) => `Espas ou · ${profile}`,
    subtitle: "Kòmand ki nan etap ou responsab yo.",
    queue: "Pou trete",
    empty: "Pa gen anyen pou trete kounye a.",
    open: "Ouvri kòmand yo",
  },
};

const en: DashboardCopy = {
  greeting: (name) => `Hello, ${name}`,
  search: "Search for a customer…",
  signOutAs: (name) => `Sign out (${name})`,
  days: ["M", "T", "W", "T", "F", "S", "S"],
  metrics: {
    weekSales: "Sales this week",
    trend: (pct) => `${pct > 0 ? "+" : ""}${pct}% vs last week`,
    noComparison: "First week",
    ordersToday: "Orders today",
    toCollect: "Still to collect",
    inProgress: "Orders in progress",
  },
  actions: {
    share: "Share my storefront",
    copied: "Link copied",
    shareTitle: "Order on WhatsApp",
    shareText: "Browse our catalog and order easily on WhatsApp:",
    viewStore: "View my storefront",
    poster: "Create a poster",
  },
  firstSteps: {
    title: "Getting started",
    subtitle: "Three steps to your first order.",
    progress: (done, total) => `${done} of ${total}`,
    done: "Done",
    products: {
      title: "Add your products",
      desc: "Name, price and photo: this is what your customers will see.",
      cta: "Open catalog",
    },
    payments: {
      title: "Tell customers how to pay",
      desc: "MonCash, NatCash, bank transfer… shown to the customer at checkout.",
      cta: "Open settings",
    },
    share: {
      title: "Share your storefront link",
      desc: "In your WhatsApp status, Instagram bio or ads.",
      cta: "Share",
    },
    firstOrder: {
      title: "Receive your first order",
      desc: "It will show up here and in the Orders tab.",
    },
  },
  stockAlerts: {
    title: (n) => (n === 1 ? "1 product to restock" : `${n} products to restock`),
    out: "Sold out",
    low: (qty, threshold) => `${qty} in stock · threshold ${threshold}`,
    cta: "Manage stock",
  },
  funnel: {
    title: "Sales funnel",
    leads: "Customers",
    orders: "Orders",
    paid: "Paid",
    delivered: "Delivered",
  },
  sources: {
    title: "Where sales come from",
    period: "Last 30 days",
    empty:
      "No orders yet. Add ?utm_source=tiktok to your storefront link in your ads to see which campaign brings sales.",
    direct: "Direct link",
  },
  topCustomers: {
    title: "Top customers",
    empty: "Your top customers will appear after your first orders.",
  },
  recent: {
    title: "Latest orders",
    empty: "No orders yet.",
    owed: "still owed",
  },
  agent: {
    title: (profile) => `Your workspace · ${profile}`,
    subtitle: "Orders at the stages you are responsible for.",
    queue: "To handle",
    empty: "Nothing to handle right now.",
    open: "Open orders",
  },
};

export const DASHBOARD_COPY: Record<Language, DashboardCopy> = { fr, ht, en };
