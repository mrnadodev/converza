import type { Language } from "./translations";

// Page publique de suivi de commande (/suivi/<jeton>).

export interface TrackingCopy {
  title: (ref: string) => string;
  hello: (name: string) => string;
  steps: { received: string; confirmed: string; onTheWay: string; delivered: string };
  cancelled: string;
  courier: (name: string) => string;
  items: string;
  code: string;
  contact: string;
  shop: string;
  notFound: string;
}

export const TRACKING_COPY: Record<Language, TrackingCopy> = {
  fr: {
    title: (ref) => `Commande #${ref}`,
    hello: (name) => `Bonjour ${name} 👋`,
    steps: { received: "Commande reçue", confirmed: "Paiement confirmé", onTheWay: "En route", delivered: "Livrée" },
    cancelled: "Cette commande a été annulée. Contactez la boutique pour toute question.",
    courier: (name) => `Votre livreur : ${name}`,
    items: "Votre commande",
    code: "Gardez votre code à 4 chiffres : le livreur vous le demandera à la remise.",
    contact: "Écrire à la boutique",
    shop: "Voir la boutique",
    notFound: "Ce lien de suivi n'est pas valable.",
  },
  ht: {
    title: (ref) => `Kòmand #${ref}`,
    hello: (name) => `Bonjou ${name} 👋`,
    steps: { received: "Kòmand resevwa", confirmed: "Peman konfime", onTheWay: "Sou wout", delivered: "Livre" },
    cancelled: "Kòmand sa a anile. Kontakte boutik la si w gen kesyon.",
    courier: (name) => `Livrè ou a : ${name}`,
    items: "Kòmand ou a",
    code: "Kenbe kòd 4 chif ou a : livrè a ap mande w li lè l ap remèt ou kòmand lan.",
    contact: "Ekri boutik la",
    shop: "Wè boutik la",
    notFound: "Lyen swivi sa a pa valab.",
  },
  en: {
    title: (ref) => `Order #${ref}`,
    hello: (name) => `Hello ${name} 👋`,
    steps: { received: "Order received", confirmed: "Payment confirmed", onTheWay: "On the way", delivered: "Delivered" },
    cancelled: "This order was cancelled. Contact the shop with any questions.",
    courier: (name) => `Your courier: ${name}`,
    items: "Your order",
    code: "Keep your 4-digit code: the courier will ask for it at hand-over.",
    contact: "Message the shop",
    shop: "Visit the shop",
    notFound: "This tracking link isn't valid.",
  },
};
