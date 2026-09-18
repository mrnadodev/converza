import type { Language } from "../translations";

export interface OrdersCopy {
  title: string;
  subtitle: string;
  filters: { all: (n: number) => string; owed: (n: number) => string };
  stageFilter: { label: string; everything: string };
  restricted: (profile: string) => string;
  emptyBoard: { title: string; desc: string; cta: string };
  emptyColumn: { first: string; other: string };
  card: {
    securityCode: string;
    owed: (amount: string) => string;
    markPaid: string;
    markPaidConfirm: (name: string, amount: string) => string;
    advance: (stage: string) => string;
    invoice: string;
    receipt: string;
    payMethodsTitle: string;
    noPayMethods: string;
    openSettings: string;
    promo: string;
    backInStock: string;
    satisfaction: string;
    archive: string;
    archiveConfirm: string;
    send: {
      contact: string;
      confirmPayment: string;
      debtReminder: string;
      onTheWay: string;
      delivered: string;
      followUp: string;
      generic: string;
    };
  };
  promoModal: {
    title: string;
    text: string;
    photos: string;
    photosHint: string;
    chosen: (n: number) => string;
    linkPreview: string;
    send: string;
  };
  errors: { move: string; markPaid: string };
}

const fr: OrdersCopy = {
  title: "Commandes",
  subtitle: "Faites avancer chaque commande, étape par étape.",
  filters: { all: (n) => `Toutes (${n})`, owed: (n) => `Reste à payer (${n})` },
  stageFilter: { label: "Voir les étapes de", everything: "Toutes les étapes" },
  restricted: (profile) => `Vous voyez les étapes de votre rôle : ${profile}.`,
  emptyBoard: {
    title: "Aucune commande pour le moment",
    desc: "Les commandes passées depuis votre vitrine WhatsApp arrivent ici, dans la première étape.",
    cta: "Retour au tableau de bord",
  },
  emptyColumn: { first: "Les nouvelles commandes arrivent ici.", other: "Aucune commande à cette étape." },
  card: {
    securityCode: "Code de retrait / livraison",
    owed: (amount) => `Reste ${amount}`,
    markPaid: "Marquer payé",
    markPaidConfirm: (name, amount) => `Enregistrer le paiement de ${amount} pour ${name} ?`,
    advance: (stage) => `Passer à : ${stage}`,
    invoice: "Facture",
    receipt: "Reçu",
    payMethodsTitle: "Envoyer la facture selon le moyen choisi :",
    noPayMethods: "Aucun moyen de paiement configuré.",
    openSettings: "Ouvrir les paramètres",
    promo: "Promo produit",
    backInStock: "De nouveau en stock",
    satisfaction: "Satisfaction",
    archive: "Clôturer la commande",
    archiveConfirm: "Clôturer cette commande ? Elle disparaîtra du tableau.",
    send: {
      contact: "Accuser réception · moyens de paiement",
      confirmPayment: "Confirmer le paiement",
      debtReminder: "Relancer pour le solde",
      onTheWay: "Envoyer « en route »",
      delivered: "Envoyer « livrée »",
      followUp: "Envoyer une relance",
      generic: "Envoyer un message",
    },
  },
  promoModal: {
    title: "Message promo",
    text: "Texte de la promotion",
    photos: "Photos du produit",
    photosHint: "3 photos au maximum",
    chosen: (n) => (n === 1 ? "1 photo choisie" : `${n} photos choisies`),
    linkPreview: "Lien de la vitrine ajouté au message :",
    send: "Envoyer sur WhatsApp",
  },
  errors: {
    move: "L'étape n'a pas pu être changée. Réessayez.",
    markPaid: "Le paiement n'a pas pu être enregistré. Réessayez.",
  },
};

const ht: OrdersCopy = {
  title: "Kòmand yo",
  subtitle: "Fè chak kòmand avanse, etap pa etap.",
  filters: { all: (n) => `Tout (${n})`, owed: (n) => `Rès pou peye (${n})` },
  stageFilter: { label: "Wè etap", everything: "Tout etap yo" },
  restricted: (profile) => `W ap wè etap ròl ou a : ${profile}.`,
  emptyBoard: {
    title: "Poko gen kòmand",
    desc: "Kòmand ki soti nan vitrin WhatsApp ou an ap parèt isit la, nan premye etap la.",
    cta: "Tounen nan tablo a",
  },
  emptyColumn: { first: "Nouvo kòmand yo ap parèt isit la.", other: "Pa gen kòmand nan etap sa a." },
  card: {
    securityCode: "Kòd ranmase / livrezon",
    owed: (amount) => `Rès ${amount}`,
    markPaid: "Make kòm peye",
    markPaidConfirm: (name, amount) => `Anrejistre pèman ${amount} pou ${name} ?`,
    advance: (stage) => `Pase nan : ${stage}`,
    invoice: "Fakti",
    receipt: "Resi",
    payMethodsTitle: "Voye fakti a selon mwayen kliyan an chwazi :",
    noPayMethods: "Pa gen mwayen pèman ki konfigire.",
    openSettings: "Ouvri reglaj yo",
    promo: "Promo pwodwi",
    backInStock: "Disponib ankò",
    satisfaction: "Satisfaksyon",
    archive: "Fèmen kòmand la",
    archiveConfirm: "Fèmen kòmand sa a ? L ap disparèt nan tablo a.",
    send: {
      contact: "Akize resepsyon · mwayen pèman",
      confirmPayment: "Konfime pèman",
      debtReminder: "Relanse pou rès la",
      onTheWay: "Voye « sou wout »",
      delivered: "Voye « livre »",
      followUp: "Voye yon relans",
      generic: "Voye yon mesaj",
    },
  },
  promoModal: {
    title: "Mesaj promo",
    text: "Tèks pwomosyon an",
    photos: "Foto pwodwi yo",
    photosHint: "3 foto maksimòm",
    chosen: (n) => `${n} foto chwazi`,
    linkPreview: "Lyen vitrin nan ajoute nan mesaj la :",
    send: "Voye sou WhatsApp",
  },
  errors: {
    move: "Nou pa rive chanje etap la. Eseye ankò.",
    markPaid: "Nou pa rive anrejistre pèman an. Eseye ankò.",
  },
};

const en: OrdersCopy = {
  title: "Orders",
  subtitle: "Move each order forward, stage by stage.",
  filters: { all: (n) => `All (${n})`, owed: (n) => `Balance due (${n})` },
  stageFilter: { label: "Show stages for", everything: "All stages" },
  restricted: (profile) => `You see the stages for your role: ${profile}.`,
  emptyBoard: {
    title: "No orders yet",
    desc: "Orders placed from your WhatsApp storefront land here, in the first stage.",
    cta: "Back to dashboard",
  },
  emptyColumn: { first: "New orders show up here.", other: "No order at this stage." },
  card: {
    securityCode: "Pickup / delivery code",
    owed: (amount) => `${amount} due`,
    markPaid: "Mark as paid",
    markPaidConfirm: (name, amount) => `Record a ${amount} payment for ${name}?`,
    advance: (stage) => `Move to: ${stage}`,
    invoice: "Invoice",
    receipt: "Receipt",
    payMethodsTitle: "Send the invoice for the chosen method:",
    noPayMethods: "No payment method configured.",
    openSettings: "Open settings",
    promo: "Product promo",
    backInStock: "Back in stock",
    satisfaction: "Satisfaction",
    archive: "Close the order",
    archiveConfirm: "Close this order? It will disappear from the board.",
    send: {
      contact: "Acknowledge · payment options",
      confirmPayment: "Confirm the payment",
      debtReminder: "Follow up on the balance",
      onTheWay: "Send “on the way”",
      delivered: "Send “delivered”",
      followUp: "Send a follow-up",
      generic: "Send a message",
    },
  },
  promoModal: {
    title: "Promo message",
    text: "Promotion text",
    photos: "Product photos",
    photosHint: "3 photos maximum",
    chosen: (n) => (n === 1 ? "1 photo selected" : `${n} photos selected`),
    linkPreview: "Storefront link added to the message:",
    send: "Send on WhatsApp",
  },
  errors: {
    move: "The stage could not be changed. Please try again.",
    markPaid: "The payment could not be recorded. Please try again.",
  },
};

export const ORDERS_COPY: Record<Language, OrdersCopy> = { fr, ht, en };
