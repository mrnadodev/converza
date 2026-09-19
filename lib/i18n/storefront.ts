import type { Language } from "./translations";

// Textes de la vitrine publique, celle que voient les clients des marchands.
//
// Les noms de produits, catégories, adresses et horaires sont des données du
// marchand : ils s'affichent tels qu'il les a saisis. Seule l'interface autour
// est traduite.

export interface StorefrontCopy {
  open: string;
  lightMode: string;
  darkMode: string;
  bestSellers: string;
  seeAll: (count: number) => string;
  emptyTitle: string;
  emptyBody: string;
  promoActive: string;
  promoBadge: string;
  addToCart: string;
  add: string;
  sold: (n: number) => string;
  soldOut: string;
  unavailable: string;
  bestSeller: string;
  zoom: string;
  photoOf: (i: number, n: number) => string;
  previous: string;
  next: string;
  close: string;
  back: string;
  inStockOnly: string;
  sortPopular: string;
  sortPriceUp: string;
  sortPriceDown: string;
  viewGrid: string;
  viewList: string;
  noProducts: string;
  orderCta: (count: number, total: string) => string;
  orderOnWhatsapp: string;
  checkoutTitle: string;
  checkoutSubtitle: string;
  dineIn: string;
  table: (n: string) => string;
  yourName: string;
  yourWhatsapp: string;
  optional: string;
  note: string;
  notePlaceholder: string;
  deliveryWhere: string;
  pickup: string;
  free: string;
  total: string;
  confirmSend: string;
  sending: string;
  orderFailed: string;
  sendAnyway: string;
  scheduleVisit: string;
  previewBanner: string;
  ctaBook: string;
  ctaEnroll: string;
  ctaAppointment: string;
  ctaQuote: string;
  popular: string;
  colProduct: string;
  colPrice: string;
  phoneBanner: (phone: string, old: string) => string;
  phoneMention: (date: string) => string;
  sectors: Record<string, { label: string; catalog: string; featured: string }>;
  // Libellés insérés dans le message WhatsApp reçu par le marchand.
  message: {
    greeting: (business: string) => string;
    interested: (business: string) => string;
    delivery: string;
    total: string;
    table: (n: string) => string;
    source: (s: string) => string;
    note: string;
    ref: (ref: string) => string;
  };
}

const fr: StorefrontCopy = {
  open: "Ouvert",
  lightMode: "Mode clair",
  darkMode: "Mode sombre",
  bestSellers: "À la une",
  seeAll: (n) => `Voir tout le catalogue (${n})`,
  emptyTitle: "La boutique prépare son catalogue",
  emptyBody: "Aucun produit n'est encore en ligne. Vous pouvez écrire directement au commerce sur WhatsApp.",
  promoActive: "Promotion en cours",
  promoBadge: "Promo",
  addToCart: "Ajouter au panier",
  add: "Ajouter",
  sold: (n) => `${n} vendus`,
  soldOut: "Épuisé",
  unavailable: "Indisponible",
  bestSeller: "Best-seller",
  zoom: "Agrandir la photo",
  photoOf: (i, n) => `Photo ${i} sur ${n}`,
  previous: "Précédent",
  next: "Suivant",
  close: "Fermer",
  back: "Retour",
  inStockOnly: "En stock uniquement",
  sortPopular: "Les plus populaires",
  sortPriceUp: "Prix croissant",
  sortPriceDown: "Prix décroissant",
  viewGrid: "Grille",
  viewList: "Liste",
  noProducts: "Aucun produit ne correspond.",
  orderCta: (n, total) => `Commander ${n} article${n > 1 ? "s" : ""} · ${total}`,
  orderOnWhatsapp: "Commander sur WhatsApp",
  checkoutTitle: "Vérifiez votre commande",
  checkoutSubtitle: "Relisez vos articles avant l'envoi sur WhatsApp.",
  dineIn: "Sur place",
  table: (n) => `Table ${n}`,
  yourName: "Votre nom",
  yourWhatsapp: "Votre WhatsApp",
  optional: "facultatif",
  note: "Remarque",
  notePlaceholder: "Sans piment, bien cuit, à livrer après 17 h…",
  deliveryWhere: "Livraison",
  pickup: "Retrait en boutique",
  free: "gratuit",
  total: "Total à payer",
  confirmSend: "Envoyer la commande sur WhatsApp",
  sending: "Enregistrement…",
  orderFailed: "La commande n'a pas pu être enregistrée. Envoyez-la quand même sur WhatsApp : le marchand la verra.",
  sendAnyway: "Envoyer quand même",
  scheduleVisit: "Demander une visite",
  previewBanner: "Aperçu de la mise en page — rien n'est enregistré",
  ctaBook: "Réserver",
  ctaEnroll: "S'inscrire",
  ctaAppointment: "Prendre RDV",
  ctaQuote: "Demander un devis",
  popular: "Le plus demandé",
  colProduct: "Article",
  colPrice: "Prix",
  phoneBanner: (phone, old) => `Notre numéro WhatsApp a changé : ${phone}. L'ancien (${old}) n'est plus utilisé.`,
  phoneMention: (date) => `Nouveau numéro WhatsApp depuis le ${date}`,
  sectors: {
    commerce_vente: { label: "Commerce", catalog: "Catalogue", featured: "À la une" },
    restauration: { label: "Restauration", catalog: "Menu", featured: "Les incontournables du menu" },
    immobilier: { label: "Immobilier", catalog: "Biens disponibles", featured: "Biens à la une" },
    automobile: { label: "Automobile", catalog: "Pièces et véhicules", featured: "En vedette" },
    sante_bienetre: { label: "Santé et bien-être", catalog: "Soins et services", featured: "Nos soins" },
    beaute_services: { label: "Beauté", catalog: "Prestations", featured: "Nos prestations" },
    education: { label: "Éducation", catalog: "Formations", featured: "Formations à la une" },
    services_pros: { label: "Services professionnels", catalog: "Services", featured: "Nos offres" },
    construction: { label: "Construction", catalog: "Projets et matériaux", featured: "Produits à la une" },
    digital_tech: { label: "Digital", catalog: "Services", featured: "Nos offres" },
    grossistes_distribution: { label: "Grossiste", catalog: "Catalogue en gros", featured: "Arrivages et offres" },
  },
  message: {
    greeting: (b) => `Bonjour ${b} ! Je voudrais commander :`,
    interested: (b) => `Bonjour ${b} ! Vos produits m'intéressent.`,
    delivery: "Livraison",
    total: "Total",
    table: (n) => `Table ${n}, sur place`,
    source: (s) => `Source : ${s}`,
    note: "Remarque",
    ref: (r) => `Référence : ${r}`,
  },
};

const ht: StorefrontCopy = {
  open: "Louvri",
  lightMode: "Mòd klè",
  darkMode: "Mòd fonse",
  bestSellers: "An vedèt",
  seeAll: (n) => `Wè tout katalòg la (${n})`,
  emptyTitle: "Boutik la ap prepare katalòg li",
  emptyBody: "Poko gen pwodwi an liy. Ou ka ekri biznis lan dirèkteman sou WhatsApp.",
  promoActive: "Pwomosyon kounye a",
  promoBadge: "Pwomo",
  addToCart: "Mete nan panye",
  add: "Ajoute",
  sold: (n) => `${n} vann`,
  soldOut: "Fini",
  unavailable: "Pa disponib",
  bestSeller: "Pi vann",
  zoom: "Agrandi foto a",
  photoOf: (i, n) => `Foto ${i} sou ${n}`,
  previous: "Anvan",
  next: "Apre",
  close: "Fèmen",
  back: "Retounen",
  inStockOnly: "Sa ki disponib sèlman",
  sortPopular: "Pi popilè",
  sortPriceUp: "Pri: ba → wo",
  sortPriceDown: "Pri: wo → ba",
  viewGrid: "Griy",
  viewList: "Lis",
  noProducts: "Pa gen pwodwi ki koresponn.",
  orderCta: (n, total) => `Kòmande ${n} atik · ${total}`,
  orderOnWhatsapp: "Kòmande sou WhatsApp",
  checkoutTitle: "Verifye kòmand ou",
  checkoutSubtitle: "Tcheke atik yo anvan w voye sou WhatsApp.",
  dineIn: "Sou plas",
  table: (n) => `Tab ${n}`,
  yourName: "Non ou",
  yourWhatsapp: "WhatsApp ou",
  optional: "opsyonèl",
  note: "Nòt",
  notePlaceholder: "San piman, byen kwit, livre apre 5è…",
  deliveryWhere: "Livrezon",
  pickup: "Pran l nan boutik la",
  free: "gratis",
  total: "Total pou peye",
  confirmSend: "Voye kòmand lan sou WhatsApp",
  sending: "N ap anrejistre…",
  orderFailed: "Nou pa rive anrejistre kòmand lan. Voye l kanmenm sou WhatsApp : machann lan ap wè l.",
  sendAnyway: "Voye l kanmenm",
  scheduleVisit: "Mande yon vizit",
  previewBanner: "Apèsi mizanpaj la — anyen pa anrejistre",
  ctaBook: "Rezève",
  ctaEnroll: "Enskri",
  ctaAppointment: "Pran randevou",
  ctaQuote: "Mande yon devi",
  popular: "Sa moun plis mande",
  colProduct: "Atik",
  colPrice: "Pri",
  phoneBanner: (phone, old) => `Nimewo WhatsApp nou an chanje : ${phone}. Nou pa sèvi ak ansyen an (${old}) ankò.`,
  phoneMention: (date) => `Nouvo nimewo WhatsApp depi ${date}`,
  sectors: {
    commerce_vente: { label: "Komès", catalog: "Katalòg", featured: "An vedèt" },
    restauration: { label: "Restoran", catalog: "Meni", featured: "Plat ou pa dwe rate" },
    immobilier: { label: "Imobilye", catalog: "Kay ak tè disponib", featured: "Kay ak tè an vedèt" },
    automobile: { label: "Oto", catalog: "Pyès ak machin", featured: "An vedèt" },
    sante_bienetre: { label: "Sante ak byennèt", catalog: "Swen ak sèvis", featured: "Swen nou yo" },
    beaute_services: { label: "Bote", catalog: "Sèvis", featured: "Sèvis nou yo" },
    education: { label: "Edikasyon", catalog: "Fòmasyon", featured: "Fòmasyon an vedèt" },
    services_pros: { label: "Sèvis pwofesyonèl", catalog: "Sèvis", featured: "Òf nou yo" },
    construction: { label: "Konstriksyon", catalog: "Pwojè ak materyo", featured: "Pwodui an vedèt" },
    digital_tech: { label: "Dijital", catalog: "Sèvis", featured: "Òf nou yo" },
    grossistes_distribution: { label: "Machann an gwo", catalog: "Katalòg an gwo", featured: "Nouvo arivaj ak òf" },
  },
  message: {
    greeting: (b) => `Bonjou ${b}! Mwen vle kòmande:`,
    interested: (b) => `Bonjou ${b}! Mwen enterese nan pwodwi ou yo.`,
    delivery: "Livrezon",
    total: "Total",
    table: (n) => `Tab ${n}, sou plas`,
    source: (s) => `Sòs: ${s}`,
    note: "Nòt",
    ref: (r) => `Referans : ${r}`,
  },
};

const en: StorefrontCopy = {
  open: "Open",
  lightMode: "Light mode",
  darkMode: "Dark mode",
  bestSellers: "Featured",
  seeAll: (n) => `See the full catalogue (${n})`,
  emptyTitle: "This shop is preparing its catalogue",
  emptyBody: "No products are online yet. You can message the business directly on WhatsApp.",
  promoActive: "Current promotion",
  promoBadge: "Promo",
  addToCart: "Add to cart",
  add: "Add",
  sold: (n) => `${n} sold`,
  soldOut: "Sold out",
  unavailable: "Unavailable",
  bestSeller: "Best seller",
  zoom: "Enlarge photo",
  photoOf: (i, n) => `Photo ${i} of ${n}`,
  previous: "Previous",
  next: "Next",
  close: "Close",
  back: "Back",
  inStockOnly: "In stock only",
  sortPopular: "Most popular",
  sortPriceUp: "Price: low to high",
  sortPriceDown: "Price: high to low",
  viewGrid: "Grid",
  viewList: "List",
  noProducts: "No matching products.",
  orderCta: (n, total) => `Order ${n} item${n > 1 ? "s" : ""} · ${total}`,
  orderOnWhatsapp: "Order on WhatsApp",
  checkoutTitle: "Review your order",
  checkoutSubtitle: "Check your items before sending on WhatsApp.",
  dineIn: "Dine-in",
  table: (n) => `Table ${n}`,
  yourName: "Your name",
  yourWhatsapp: "Your WhatsApp",
  optional: "optional",
  note: "Note",
  notePlaceholder: "No chili, well done, deliver after 5 pm…",
  deliveryWhere: "Delivery",
  pickup: "Pick up in store",
  free: "free",
  total: "Total to pay",
  confirmSend: "Send the order on WhatsApp",
  sending: "Saving…",
  orderFailed: "The order could not be saved. Send it on WhatsApp anyway — the merchant will see it.",
  sendAnyway: "Send anyway",
  scheduleVisit: "Request a visit",
  previewBanner: "Layout preview — nothing is saved",
  ctaBook: "Book",
  ctaEnroll: "Enroll",
  ctaAppointment: "Book appointment",
  ctaQuote: "Request a quote",
  popular: "Most requested",
  colProduct: "Item",
  colPrice: "Price",
  phoneBanner: (phone, old) => `Our WhatsApp number has changed: ${phone}. The old one (${old}) is no longer used.`,
  phoneMention: (date) => `New WhatsApp number since ${date}`,
  sectors: {
    commerce_vente: { label: "Retail", catalog: "Catalogue", featured: "Featured" },
    restauration: { label: "Food", catalog: "Menu", featured: "Menu favorites" },
    immobilier: { label: "Real estate", catalog: "Available properties", featured: "Featured properties" },
    automobile: { label: "Automotive", catalog: "Parts and vehicles", featured: "Featured" },
    sante_bienetre: { label: "Health and wellness", catalog: "Care and services", featured: "Our treatments" },
    beaute_services: { label: "Beauty", catalog: "Services", featured: "Our services" },
    education: { label: "Education", catalog: "Courses", featured: "Featured courses" },
    services_pros: { label: "Professional services", catalog: "Services", featured: "Our offers" },
    construction: { label: "Construction", catalog: "Projects and materials", featured: "Featured products" },
    digital_tech: { label: "Digital", catalog: "Services", featured: "Our offers" },
    grossistes_distribution: { label: "Wholesale", catalog: "Wholesale catalogue", featured: "New arrivals & deals" },
  },
  message: {
    greeting: (b) => `Hello ${b}! I would like to order:`,
    interested: (b) => `Hello ${b}! I'm interested in your products.`,
    delivery: "Delivery",
    total: "Total",
    table: (n) => `Table ${n}, dine-in`,
    source: (s) => `Source: ${s}`,
    note: "Note",
    ref: (r) => `Reference: ${r}`,
  },
};

export const STOREFRONT_COPY: Record<Language, StorefrontCopy> = { fr, ht, en };

export function storefrontCopy(language: Language): StorefrontCopy {
  return STOREFRONT_COPY[language] ?? STOREFRONT_COPY.fr;
}
