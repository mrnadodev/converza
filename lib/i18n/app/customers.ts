import type { Language } from "../translations";

export interface CustomersCopy {
  title: string;
  count: (n: number) => string;
  search: string;
  clearSearch: string;
  orders: (n: number) => string;
  tags: { vip: string; kliyan_fidel: string; nouvo_kliyan: string };
  /**
   * Envoi guide d une promotion. WhatsApp n offre aucune diffusion gratuite :
   * on enchaine les clients un par un. Les libelles disent « ouvert » et non
   * « envoye » — l application ne peut pas savoir si le marchand a appuye.
   */
  broadcast: {
    cta: string;
    title: string;
    stepWho: string;
    stepMessage: string;
    selectAll: string;
    selectNone: string;
    chosen: (n: number) => string;
    next: string;
    messageLabel: string;
    photos: string;
    addPhotos: string;
    photosChosen: (n: number) => string;
    photosHint: string;
    preview: string;
    start: (n: number) => string;
    progress: (i: number, total: number) => string;
    open: string;
    skip: string;
    done: (n: number) => string;
    doneHint: string;
  };
  empty: { title: string; desc: string; cta: string; noMatch: string };
  add: {
    cta: string;
    title: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phoneHint: string;
    address: string;
    addressPlaceholder: string;
    submit: string;
    nameRequired: string;
    phoneRequired: string;
  };
  profile: {
    whatsapp: string;
    call: string;
    badges: string;
    stats: { orders: string; spent: string; owed: string };
    address: string;
    history: (n: number) => string;
    noHistory: string;
    invoice: string;
    code: string;
    close: string;
    saveTagsError: string;
  };
}

const fr: CustomersCopy = {
  title: "Clients",
  count: (n) => (n <= 1 ? `${n} client` : `${n} clients`),
  search: "Rechercher par nom ou téléphone…",
  clearSearch: "Effacer la recherche",
  orders: (n) => (n <= 1 ? `${n} commande` : `${n} commandes`),
  tags: { vip: "VIP", kliyan_fidel: "Client fidèle", nouvo_kliyan: "Nouveau client" },
  broadcast: {
    cta: "Promotion",
    title: "Envoyer une promotion",
    stepWho: "Choisissez qui doit la recevoir.",
    stepMessage: "Écrivez le message et ajoutez vos photos.",
    selectAll: "Tout sélectionner",
    selectNone: "Tout désélectionner",
    chosen: (n) => (n <= 1 ? `${n} client choisi` : `${n} clients choisis`),
    next: "Continuer",
    messageLabel: "Votre message",
    photos: "Photos du produit",
    addPhotos: "Ajouter des photos",
    photosChosen: (n) => (n <= 1 ? `${n} photo choisie` : `${n} photos choisies`),
    photosHint: "Sur téléphone, la photo part avec le message. Sur ordinateur, elle est téléchargée une seule fois : vous la joignez dans WhatsApp.",
    preview: "Aperçu",
    start: (n) => (n <= 1 ? `Commencer (${n} client)` : `Commencer (${n} clients)`),
    progress: (i, total) => `Client ${i} sur ${total}`,
    open: "Ouvrir WhatsApp",
    skip: "Passer",
    done: (n) => (n <= 1 ? `${n} conversation ouverte` : `${n} conversations ouvertes`),
    doneHint: "Vérifiez dans WhatsApp que chaque message est bien parti : nous ouvrons la conversation, c'est vous qui appuyez sur envoyer.",
  },
  empty: {
    title: "Aucun client enregistré",
    desc: "Chaque commande passée depuis votre vitrine crée la fiche du client. Vous pouvez aussi en ajouter un à la main.",
    cta: "Ajouter un client",
    noMatch: "Aucun client ne correspond à cette recherche.",
  },
  add: {
    cta: "Ajouter un client",
    title: "Nouveau client",
    name: "Nom complet",
    namePlaceholder: "Marie Jean",
    phone: "Téléphone WhatsApp",
    phoneHint: "+509 3712 4488",
    address: "Adresse de livraison",
    addressPlaceholder: "Delmas 31, Port-au-Prince",
    submit: "Enregistrer le client",
    nameRequired: "Le nom est obligatoire.",
    phoneRequired: "Le numéro WhatsApp est obligatoire.",
  },
  profile: {
    whatsapp: "Écrire sur WhatsApp",
    call: "Appeler",
    badges: "Étiquettes",
    stats: { orders: "Commandes", spent: "Total acheté", owed: "Reste dû" },
    address: "Adresse de livraison",
    history: (n) => (n <= 1 ? `Historique (${n} commande)` : `Historique (${n} commandes)`),
    noHistory: "Aucune commande enregistrée pour ce client.",
    invoice: "Facture / reçu",
    code: "Code de retrait",
    close: "Fermer la fiche",
    saveTagsError: "Les étiquettes n'ont pas pu être enregistrées.",
  },
};

const ht: CustomersCopy = {
  title: "Kliyan",
  count: (n) => `${n} kliyan`,
  search: "Chèche pa non oswa telefòn…",
  clearSearch: "Efase rechèch la",
  orders: (n) => `${n} kòmand`,
  tags: { vip: "VIP", kliyan_fidel: "Kliyan fidèl", nouvo_kliyan: "Nouvo kliyan" },
  broadcast: {
    cta: "Pwomosyon",
    title: "Voye yon pwomosyon",
    stepWho: "Chwazi kiyès ki dwe resevwa l.",
    stepMessage: "Ekri mesaj la epi ajoute foto ou yo.",
    selectAll: "Chwazi tout",
    selectNone: "Retire tout",
    chosen: (n) => `${n} kliyan chwazi`,
    next: "Kontinye",
    messageLabel: "Mesaj ou",
    photos: "Foto pwodwi a",
    addPhotos: "Ajoute foto",
    photosChosen: (n) => `${n} foto chwazi`,
    photosHint: "Sou telefòn, foto a pati ak mesaj la. Sou òdinatè, li telechaje yon sèl fwa : ou mete l nan WhatsApp.",
    preview: "Apèsi",
    start: (n) => `Kòmanse (${n} kliyan)`,
    progress: (i, total) => `Kliyan ${i} sou ${total}`,
    open: "Louvri WhatsApp",
    skip: "Sote",
    done: (n) => `${n} konvèsasyon louvri`,
    doneHint: "Tcheke nan WhatsApp si chak mesaj byen pati : nou louvri konvèsasyon an, se ou ki peze voye.",
  },
  empty: {
    title: "Poko gen kliyan",
    desc: "Chak kòmand ki soti nan vitrin ou kreye fich kliyan an. Ou ka ajoute youn alamen tou.",
    cta: "Ajoute yon kliyan",
    noMatch: "Pa gen kliyan ki koresponn ak rechèch sa a.",
  },
  add: {
    cta: "Ajoute yon kliyan",
    title: "Nouvo kliyan",
    name: "Non konplè",
    namePlaceholder: "Mari Jan",
    phone: "Telefòn WhatsApp",
    phoneHint: "+509 3712 4488",
    address: "Adrès livrezon",
    addressPlaceholder: "Delmas 31, Pòtoprens",
    submit: "Anrejistre kliyan an",
    nameRequired: "Non an obligatwa.",
    phoneRequired: "Nimewo WhatsApp la obligatwa.",
  },
  profile: {
    whatsapp: "Ekri sou WhatsApp",
    call: "Rele",
    badges: "Etikèt",
    stats: { orders: "Kòmand", spent: "Total achte", owed: "Rès pou peye" },
    address: "Adrès livrezon",
    history: (n) => `Istorik (${n} kòmand)`,
    noHistory: "Pa gen kòmand ki anrejistre pou kliyan sa a.",
    invoice: "Fakti / resi",
    code: "Kòd ranmase",
    close: "Fèmen fich la",
    saveTagsError: "Nou pa rive anrejistre etikèt yo.",
  },
};

const en: CustomersCopy = {
  title: "Customers",
  count: (n) => (n === 1 ? "1 customer" : `${n} customers`),
  search: "Search by name or phone…",
  clearSearch: "Clear search",
  orders: (n) => (n === 1 ? "1 order" : `${n} orders`),
  tags: { vip: "VIP", kliyan_fidel: "Loyal customer", nouvo_kliyan: "New customer" },
  broadcast: {
    cta: "Promotion",
    title: "Send a promotion",
    stepWho: "Choose who should receive it.",
    stepMessage: "Write the message and add your photos.",
    selectAll: "Select all",
    selectNone: "Clear selection",
    chosen: (n) => (n === 1 ? "1 customer chosen" : `${n} customers chosen`),
    next: "Continue",
    messageLabel: "Your message",
    photos: "Product photos",
    addPhotos: "Add photos",
    photosChosen: (n) => (n === 1 ? "1 photo chosen" : `${n} photos chosen`),
    photosHint: "On a phone the photo travels with the message. On a computer it is downloaded once: attach it in WhatsApp.",
    preview: "Preview",
    start: (n) => (n === 1 ? "Start (1 customer)" : `Start (${n} customers)`),
    progress: (i, total) => `Customer ${i} of ${total}`,
    open: "Open WhatsApp",
    skip: "Skip",
    done: (n) => (n === 1 ? "1 conversation opened" : `${n} conversations opened`),
    doneHint: "Check in WhatsApp that each message went out: we open the conversation, you press send.",
  },
  empty: {
    title: "No customers yet",
    desc: "Every order from your storefront creates a customer record. You can also add one by hand.",
    cta: "Add a customer",
    noMatch: "No customer matches this search.",
  },
  add: {
    cta: "Add a customer",
    title: "New customer",
    name: "Full name",
    namePlaceholder: "Marie Jean",
    phone: "WhatsApp number",
    phoneHint: "+509 3712 4488",
    address: "Delivery address",
    addressPlaceholder: "Delmas 31, Port-au-Prince",
    submit: "Save customer",
    nameRequired: "A name is required.",
    phoneRequired: "A WhatsApp number is required.",
  },
  profile: {
    whatsapp: "Message on WhatsApp",
    call: "Call",
    badges: "Labels",
    stats: { orders: "Orders", spent: "Total spent", owed: "Balance due" },
    address: "Delivery address",
    history: (n) => (n === 1 ? "History (1 order)" : `History (${n} orders)`),
    noHistory: "No orders recorded for this customer.",
    invoice: "Invoice / receipt",
    code: "Pickup code",
    close: "Close",
    saveTagsError: "The labels could not be saved.",
  },
};

export const CUSTOMERS_COPY: Record<Language, CustomersCopy> = { fr, ht, en };
