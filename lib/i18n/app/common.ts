import type { Language } from "../translations";
import type { OrderStatus } from "../../types";

// Libellés partagés par tous les écrans de l'application marchand.
export interface CommonCopy {
  nav: {
    home: string;
    orders: string;
    catalog: string;
    stock: string;
    customers: string;
    cash: string;
    team: string;
    settings: string;
    signOut: string;
  };
  /** Nom des étapes du pipeline, dans l'ordre où le client les traverse. */
  statuses: Record<OrderStatus, string>;
  /** Profil métier d'un membre, indexé par `agentId`. */
  profiles: Record<string, string>;
  actions: {
    save: string;
    saving: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    add: string;
    back: string;
    seeAll: string;
    retry: string;
  };
  upload: {
    change: string;
    remove: string;
    loading: string;
    notImage: string;
    tooBig: (mb: number) => string;
    storageOff: string;
    failed: string;
  };
  orders: (n: number) => string;
  units: (n: number) => string;
  customerFallback: string;
}

const fr: CommonCopy = {
  nav: {
    home: "Accueil",
    orders: "Commandes",
    catalog: "Catalogue",
    cash: "Caisse",
    stock: "Stock",
    customers: "Clients",
    team: "Équipe",
    settings: "Paramètres",
    signOut: "Se déconnecter",
  },
  statuses: {
    demand_acha: "Nouvelle demande",
    kontak: "Contact",
    metod_peman: "Moyen de paiement",
    konfime_peman: "Paiement à confirmer",
    sou_wout: "En livraison",
    livre: "Livrée",
    swivi: "Suivi",
    anile: "Annulée",
    pou_konfime: "Nouvelle demande",
    peye: "Paiement à confirmer",
  },
  profiles: {
    owner: "Propriétaire",
    marie: "Caisse & paiements",
    jean: "Ventes",
    pierre: "Stock & livraison",
    florence: "Service client & dettes",
    steeve: "Relance & promo",
    gerant: "Gérant",
    agent: "Agent",
  },
  actions: {
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    close: "Fermer",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    back: "Retour",
    seeAll: "Tout voir",
    retry: "Réessayer",
  },
  upload: {
    change: "Changer la photo",
    remove: "Retirer",
    loading: "Envoi…",
    notImage: "Choisissez une image (jpg, png, webp).",
    tooBig: (mb) => `Image trop lourde (${mb} Mo maximum).`,
    storageOff: "Le stockage des images n'est pas configuré.",
    failed: "L'envoi de l'image a échoué.",
  },
  orders: (n) => (n <= 1 ? `${n} commande` : `${n} commandes`),
  units: (n) => (n <= 1 ? `${n} unité` : `${n} unités`),
  customerFallback: "Client",
};

const ht: CommonCopy = {
  nav: {
    home: "Akèy",
    orders: "Kòmand",
    catalog: "Katalòg",
    cash: "Kès",
    stock: "Stòk",
    customers: "Kliyan",
    team: "Ekip",
    settings: "Reglaj",
    signOut: "Dekonekte",
  },
  statuses: {
    demand_acha: "Nouvo demann",
    kontak: "Kontak",
    metod_peman: "Mwayen pèman",
    konfime_peman: "Pèman pou konfime",
    sou_wout: "Sou wout",
    livre: "Livre",
    swivi: "Swivi",
    anile: "Anile",
    pou_konfime: "Nouvo demann",
    peye: "Pèman pou konfime",
  },
  profiles: {
    owner: "Pwopriyetè",
    marie: "Kès & pèman",
    jean: "Vant",
    pierre: "Stòk & livrezon",
    florence: "Sèvis kliyan & dèt",
    steeve: "Relans & promo",
    gerant: "Jeran",
    agent: "Ajan",
  },
  actions: {
    save: "Anrejistre",
    saving: "N ap anrejistre…",
    cancel: "Anile",
    close: "Fèmen",
    delete: "Efase",
    edit: "Modifye",
    add: "Ajoute",
    back: "Tounen",
    seeAll: "Wè tout",
    retry: "Eseye ankò",
  },
  upload: {
    change: "Chanje foto a",
    remove: "Retire",
    loading: "N ap voye…",
    notImage: "Chwazi yon imaj (jpg, png, webp).",
    tooBig: (mb) => `Imaj la twò gwo (${mb} Mo maksimòm).`,
    storageOff: "Depo imaj la pa konfigire.",
    failed: "Nou pa rive voye imaj la.",
  },
  orders: (n) => `${n} kòmand`,
  units: (n) => `${n} inite`,
  customerFallback: "Kliyan",
};

const en: CommonCopy = {
  nav: {
    home: "Home",
    orders: "Orders",
    catalog: "Catalog",
    cash: "Cash",
    stock: "Stock",
    customers: "Customers",
    team: "Team",
    settings: "Settings",
    signOut: "Sign out",
  },
  statuses: {
    demand_acha: "New request",
    kontak: "Contacted",
    metod_peman: "Payment method",
    konfime_peman: "Payment to confirm",
    sou_wout: "Out for delivery",
    livre: "Delivered",
    swivi: "Follow-up",
    anile: "Cancelled",
    pou_konfime: "New request",
    peye: "Payment to confirm",
  },
  profiles: {
    owner: "Owner",
    marie: "Cashier & payments",
    jean: "Sales",
    pierre: "Stock & delivery",
    florence: "Customer care & debts",
    steeve: "Follow-ups & promo",
    gerant: "Manager",
    agent: "Agent",
  },
  actions: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    seeAll: "See all",
    retry: "Try again",
  },
  upload: {
    change: "Change photo",
    remove: "Remove",
    loading: "Uploading…",
    notImage: "Choose an image (jpg, png, webp).",
    tooBig: (mb) => `Image too large (${mb} MB maximum).`,
    storageOff: "Image storage is not configured.",
    failed: "The image could not be uploaded.",
  },
  orders: (n) => (n === 1 ? "1 order" : `${n} orders`),
  units: (n) => (n === 1 ? "1 unit" : `${n} units`),
  customerFallback: "Customer",
};

export const COMMON_COPY: Record<Language, CommonCopy> = { fr, ht, en };
