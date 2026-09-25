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
    /** Posée une seule fois, au passage en « Livrée », si de l'argent reste dû. */
    collectedOnDelivery: (amount: string) => string;
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
    /** Clôturer ne change pas le statut : une commande due reste une créance. */
    archiveOwedConfirm: (amount: string) => string;
    /** Annuler : la seule action qui retire la commande de toutes les vues. */
    cancel: string;
    cancelConfirm: (ref: string) => string;
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
  delivery: {
    title: string;
    courier: string;
    assign: string;
    name: string;
    phone: string;
    save: string;
    edit: string;
    sheet: string;
    track: string;
    code: string;
    validate: string;
    validating: string;
    badCode: string;
    forbidden: string;
    migration: string;
    withCode: string;
    courierMessage: (p: { shop: string; ref: string; customer: string; phone: string; address: string; items: string; collect: string | null }) => string;
    trackMessage: (p: { customer: string; ref: string; shop: string; link: string; courier: string | null }) => string;
  };
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
    collectedOnDelivery: (amount) =>
      `Avez-vous reçu les ${amount} à la livraison ?

OK : le paiement est enregistré.
Annuler : la commande reste à recouvrer.`,
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
    archiveOwedConfirm: (amount) =>
      `Cette commande doit encore ${amount}.\n\nEn la clôturant, elle quitte le tableau mais reste dans « À recouvrer ».\nPour la retirer de partout, utilisez plutôt « Annuler la commande ».`,
    cancel: "Annuler la commande",
    cancelConfirm: (ref) =>
      `Annuler la commande ${ref} ?\n\nElle disparaîtra du tableau, de « À recouvrer », de la caisse et des rapports. Rien n'est effacé : vous pourrez revenir dessus.`,
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
  delivery: {
    title: "Livraison",
    courier: "Livreur",
    assign: "Choisir un livreur",
    name: "Nom du livreur",
    phone: "WhatsApp du livreur",
    save: "Enregistrer",
    edit: "Modifier",
    sheet: "Fiche au livreur",
    track: "Lien de suivi au client",
    code: "Code donné par le client",
    validate: "Valider la livraison",
    validating: "Vérification…",
    badCode: "Code incorrect : demandez au client le code reçu à la commande.",
    forbidden: "Vous ne gérez pas les livraisons.",
    migration: "Mise à jour de la base nécessaire (migration 6).",
    withCode: "Livrée avec le code du client",
    courierMessage: ({ shop, ref, customer, phone, address, items, collect }) =>
      [
        `🛵 Livraison ${shop} — commande #${ref}`,
        `Client : ${customer}`,
        phone ? `Téléphone : ${phone}` : null,
        address ? `Adresse : ${address}` : null,
        items ? `Articles : ${items}` : null,
        collect ? `À encaisser : ${collect}` : "Déjà payé : rien à encaisser.",
        "À la remise, demandez au client son code à 4 chiffres.",
      ]
        .filter(Boolean)
        .join("\n"),
    trackMessage: ({ customer, ref, shop, link, courier }) =>
      `Bonjour ${customer}, votre commande #${ref} chez ${shop} est en route${courier ? ` avec ${courier}` : ""} 🛵\nSuivez-la ici : ${link}\nGardez votre code à 4 chiffres : le livreur vous le demandera.`,
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
    collectedOnDelivery: (amount) =>
      `Èske w resevwa ${amount} lè w te livre a ?

OK : n ap anrejistre pèman an.
Anile : kòmand lan rete pou rekouvre.`,
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
    archiveOwedConfirm: (amount) =>
      `Kòmand sa a dwe toujou ${amount}.\n\nSi w fèmen l, l ap kite tablo a men l ap rete nan « Pou rekouvre ».\nPou retire l toupatou, pito sèvi ak « Anile kòmand lan ».`,
    cancel: "Anile kòmand lan",
    cancelConfirm: (ref) =>
      `Anile kòmand ${ref} ?\n\nL ap disparèt nan tablo a, nan « Pou rekouvre », nan kès la ak nan rapò yo. Nou pa efase anyen : ou ka tounen sou li.`,
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
  delivery: {
    title: "Livrezon",
    courier: "Livrè",
    assign: "Chwazi yon livrè",
    name: "Non livrè a",
    phone: "WhatsApp livrè a",
    save: "Anrejistre",
    edit: "Chanje",
    sheet: "Fich pou livrè a",
    track: "Lyen swivi pou kliyan an",
    code: "Kòd kliyan an bay",
    validate: "Valide livrezon an",
    validating: "N ap verifye…",
    badCode: "Kòd la pa bon : mande kliyan an kòd li te resevwa lè l te kòmande a.",
    forbidden: "Ou pa jere livrezon.",
    migration: "Fòk baz done a mete ajou (migrasyon 6).",
    withCode: "Livre ak kòd kliyan an",
    courierMessage: ({ shop, ref, customer, phone, address, items, collect }) =>
      [
        `🛵 Livrezon ${shop} — kòmand #${ref}`,
        `Kliyan : ${customer}`,
        phone ? `Telefòn : ${phone}` : null,
        address ? `Adrès : ${address}` : null,
        items ? `Atik : ${items}` : null,
        collect ? `Pou touche : ${collect}` : "Deja peye : pa gen anyen pou touche.",
        "Lè w ap remèt li, mande kliyan an kòd 4 chif li a.",
      ]
        .filter(Boolean)
        .join("\n"),
    trackMessage: ({ customer, ref, shop, link, courier }) =>
      `Bonjou ${customer}, kòmand #${ref} ou a lakay ${shop} sou wout${courier ? ` ak ${courier}` : ""} 🛵\nSwiv li isit la : ${link}\nKenbe kòd 4 chif ou a : livrè a ap mande w li.`,
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
    collectedOnDelivery: (amount) =>
      `Did you receive the ${amount} on delivery?

OK: the payment is recorded.
Cancel: the order stays to be collected.`,
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
    archiveOwedConfirm: (amount) =>
      `This order still owes ${amount}.\n\nClosing it removes the card from the board but it stays under "To collect".\nTo remove it everywhere, use "Cancel the order" instead.`,
    cancel: "Cancel the order",
    cancelConfirm: (ref) =>
      `Cancel order ${ref}?\n\nIt will disappear from the board, from "To collect", from the till and from reports. Nothing is deleted: you can come back to it.`,
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
  delivery: {
    title: "Delivery",
    courier: "Courier",
    assign: "Choose a courier",
    name: "Courier's name",
    phone: "Courier's WhatsApp",
    save: "Save",
    edit: "Edit",
    sheet: "Sheet to courier",
    track: "Tracking link to customer",
    code: "Code given by the customer",
    validate: "Confirm delivery",
    validating: "Checking…",
    badCode: "Wrong code: ask the customer for the code they received when ordering.",
    forbidden: "You don't handle deliveries.",
    migration: "A database update is needed (migration 6).",
    withCode: "Delivered with the customer's code",
    courierMessage: ({ shop, ref, customer, phone, address, items, collect }) =>
      [
        `🛵 ${shop} delivery — order #${ref}`,
        `Customer: ${customer}`,
        phone ? `Phone: ${phone}` : null,
        address ? `Address: ${address}` : null,
        items ? `Items: ${items}` : null,
        collect ? `To collect: ${collect}` : "Already paid: nothing to collect.",
        "At hand-over, ask the customer for their 4-digit code.",
      ]
        .filter(Boolean)
        .join("\n"),
    trackMessage: ({ customer, ref, shop, link, courier }) =>
      `Hello ${customer}, your order #${ref} from ${shop} is on its way${courier ? ` with ${courier}` : ""} 🛵\nTrack it here: ${link}\nKeep your 4-digit code: the courier will ask for it.`,
  },
};

export const ORDERS_COPY: Record<Language, OrdersCopy> = { fr, ht, en };
