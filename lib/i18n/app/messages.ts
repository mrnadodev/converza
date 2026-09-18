import type { Language } from "../translations";

// Messages WhatsApp envoyés aux clients depuis l'application. Ils suivent la
// langue choisie par le marchand dans l'interface : c'est lui qui écrit à ses
// clients, et il sait dans quelle langue il leur parle.
export interface ContactPaymentInput {
  name: string;
  ref: string;
  total: string;
  code: string;
  /** Liste déjà numérotée, ex. « 1. MonCash / 2. Cash à la livraison ». */
  options: string;
  usdtAddress?: string | null;
}

export interface MessageCopy {
  cashOnDelivery: string;
  otherBank: string;
  contactPayment: (i: ContactPaymentInput) => string;
  confirmPayment: (name: string, ref: string, business: string) => string;
  newOrder: (name: string, ref: string, total: string, business: string) => string;
  onTheWay: (name: string, business: string) => string;
  delivered: (name: string, business: string) => string;
  followUp: (name: string, business: string) => string;
  debtReminder: (name: string, owed: string, business: string) => string;
  backInStock: (name: string, business: string, items?: string) => string;
  satisfaction: (name: string, business: string) => string;
  reorder: (name: string) => string;
  promoDefault: (business: string) => string;
  promoGreeting: (name: string) => string;
  hello: (name: string, business: string) => string;
}

const ht: MessageCopy = {
  cashOnDelivery: "Kach nan livrezon",
  otherBank: "Lòt bank",
  contactPayment: ({ name, ref, total, code, options, usdtAddress }) =>
    `Bonjou ${name} 👋 Nou resevwa kòmand ou #${ref}, total: ${total}.\n\n🔑 *Kòd sekirite ou: ${code}*\nKenbe kòd sa a : w ap bay livrè a oswa moun nan boutik la li pou w resevwa pwodwi ou yo.\n\nKijan ou ta renmen peye? ${options}` +
    (usdtAddress ? `\n\n*Adrès USDT (TRC-20):*\n${usdtAddress}\nVerifye adrès la anvan w voye.` : ""),
  confirmPayment: (name, ref, business) =>
    `Bonjou ${name}, nou resevwa pèman ou pou kòmand #${ref}. Nou voye resi a ba ou. N ap konfime livrezon an byento. — ${business}`,
  newOrder: (name, ref, total, business) =>
    `Bonjou ${name} 👋\nNou resevwa kòmand ou #${ref}.\nTotal: ${total}.\nN ap konfime livrezon an byento.\n— ${business}`,
  onTheWay: (name, business) =>
    `Bonjou ${name} 👋 Kòmand ou an kite lokal nou, w ap resevwa l byento. Mèsi pou pasyans ou! — ${business}`,
  delivered: (name, business) =>
    `Bonjou ${name} 👋 ${business} te kontan fè tranzaksyon avè w. Mèsi, n ap tann ou ankò!`,
  followUp: (name, business) =>
    `Bonjou ${name} 👋 Nou t ap tcheke si w toujou enterese nan sa w te mande a. Nou la pou ede w!\n— ${business}`,
  debtReminder: (name, owed, business) =>
    `Bonjou ${name}, se ${business}. Nou espere w byen! Nou vle raple w gen yon balans ${owed} ki rete pou kòmand ou an. Ou ka regle l lè w pare. Mèsi anpil!`,
  backInStock: (name, business, items) =>
    `Bonjou ${name} 👋 Pwodwi ou te mande a${items ? ` (${items})` : ""} disponib ankò nan ${business}! Èske w ta renmen nou prepare kòmand ou an kounye a?`,
  satisfaction: (name, business) =>
    `Bonjou ${name} 👋 Se ${business}. Nou t ap tcheke si w byen resevwa kòmand ou an e si w satisfè ak pwodwi yo. Opinyon ou enpòtan pou nou!`,
  reorder: (name) =>
    `Bonjou ${name}! Sa gen kèk tan nou pa wè w. Nou fèk resevwa nouvo pwodwi. Èske w ta renmen nou prepare kòmand abityèl ou an?`,
  promoDefault: (business) =>
    `*Nouvo pwodwi ak pwomosyon nan ${business}!*\n\nNou fèk resevwa nouvo pwodwi ak bèl rabè nan boutik la.\n\nVin gade vitrin nou an sou lyen sa a:`,
  promoGreeting: (name) => `Bonjou ${name} 👋`,
  hello: (name, business) => `Bonjou ${name}! — ${business}`,
};

const fr: MessageCopy = {
  cashOnDelivery: "Cash à la livraison",
  otherBank: "Autre banque",
  contactPayment: ({ name, ref, total, code, options, usdtAddress }) =>
    `Bonjour ${name} 👋 Nous avons bien reçu votre commande #${ref}, total : ${total}.\n\n🔑 *Votre code de sécurité : ${code}*\nGardez ce code : vous le donnerez au livreur ou en boutique pour recevoir vos produits.\n\nComment souhaitez-vous payer ? ${options}` +
    (usdtAddress ? `\n\n*Adresse USDT (TRC-20) :*\n${usdtAddress}\nVérifiez l'adresse avant d'envoyer.` : ""),
  confirmPayment: (name, ref, business) =>
    `Bonjour ${name}, nous avons bien reçu votre paiement pour la commande #${ref}. Nous vous envoyons le reçu. La livraison vous sera confirmée très vite. — ${business}`,
  newOrder: (name, ref, total, business) =>
    `Bonjour ${name} 👋\nNous avons bien reçu votre commande #${ref}.\nTotal : ${total}.\nNous vous confirmons la livraison très vite.\n— ${business}`,
  onTheWay: (name, business) =>
    `Bonjour ${name} 👋 Votre commande vient de partir, vous la recevrez très bientôt. Merci pour votre patience ! — ${business}`,
  delivered: (name, business) =>
    `Bonjour ${name} 👋 Merci pour votre confiance, toute l'équipe de ${business} espère vous revoir très vite !`,
  followUp: (name, business) =>
    `Bonjour ${name} 👋 Êtes-vous toujours intéressé(e) par votre demande ? Nous restons à votre disposition.\n— ${business}`,
  debtReminder: (name, owed, business) =>
    `Bonjour ${name}, ici ${business}. Nous espérons que vous allez bien ! Petit rappel : il reste ${owed} à régler sur votre commande. Vous pouvez le faire quand vous êtes prêt(e). Merci beaucoup !`,
  backInStock: (name, business, items) =>
    `Bonjour ${name} 👋 Le produit que vous attendiez${items ? ` (${items})` : ""} est de nouveau disponible chez ${business} ! Voulez-vous que nous préparions votre commande ?`,
  satisfaction: (name, business) =>
    `Bonjour ${name} 👋 Ici ${business}. Avez-vous bien reçu votre commande et êtes-vous satisfait(e) des produits ? Votre avis compte beaucoup pour nous !`,
  reorder: (name) =>
    `Bonjour ${name} ! Cela fait un moment. Nous venons de recevoir de nouveaux produits : voulez-vous que nous préparions votre commande habituelle ?`,
  promoDefault: (business) =>
    `*Nouveautés et promotions chez ${business} !*\n\nNous venons de recevoir de nouveaux produits, avec de belles réductions.\n\nDécouvrez notre vitrine sur ce lien :`,
  promoGreeting: (name) => `Bonjour ${name} 👋`,
  hello: (name, business) => `Bonjour ${name} ! — ${business}`,
};

const en: MessageCopy = {
  cashOnDelivery: "Cash on delivery",
  otherBank: "Other bank",
  contactPayment: ({ name, ref, total, code, options, usdtAddress }) =>
    `Hello ${name} 👋 We received your order #${ref}, total: ${total}.\n\n🔑 *Your security code: ${code}*\nKeep this code: give it to the courier or at the store to receive your products.\n\nHow would you like to pay? ${options}` +
    (usdtAddress ? `\n\n*USDT address (TRC-20):*\n${usdtAddress}\nDouble-check the address before sending.` : ""),
  confirmPayment: (name, ref, business) =>
    `Hello ${name}, we received your payment for order #${ref}. Here is your receipt. We will confirm delivery shortly. — ${business}`,
  newOrder: (name, ref, total, business) =>
    `Hello ${name} 👋\nWe received your order #${ref}.\nTotal: ${total}.\nWe will confirm delivery shortly.\n— ${business}`,
  onTheWay: (name, business) =>
    `Hello ${name} 👋 Your order is on its way and will reach you soon. Thank you for your patience! — ${business}`,
  delivered: (name, business) =>
    `Hello ${name} 👋 Thank you for shopping with ${business}. We hope to see you again soon!`,
  followUp: (name, business) =>
    `Hello ${name} 👋 Are you still interested in your request? We are here to help.\n— ${business}`,
  debtReminder: (name, owed, business) =>
    `Hello ${name}, this is ${business}. We hope you are well! A friendly reminder that ${owed} is still due on your order. You can settle it whenever you are ready. Thank you!`,
  backInStock: (name, business, items) =>
    `Hello ${name} 👋 The product you asked for${items ? ` (${items})` : ""} is back in stock at ${business}! Would you like us to prepare your order?`,
  satisfaction: (name, business) =>
    `Hello ${name} 👋 This is ${business}. Did you receive your order and are you happy with the products? Your feedback matters to us!`,
  reorder: (name) =>
    `Hello ${name}! It has been a while. We just received new products: would you like us to prepare your usual order?`,
  promoDefault: (business) =>
    `*New arrivals and deals at ${business}!*\n\nWe just received new products, with great discounts.\n\nBrowse our storefront here:`,
  promoGreeting: (name) => `Hello ${name} 👋`,
  hello: (name, business) => `Hello ${name}! — ${business}`,
};

export const MESSAGE_COPY: Record<Language, MessageCopy> = { fr, ht, en };
