import type { Language } from "../translations";

// Écran « Créer une affiche » (components/ProductPosterModal.tsx).

export interface PosterCopy {
  title: string;
  subtitle: string;
  close: string;
  product: string;
  texts: string;
  headline: string;
  headlinePlaceholder: string;
  name: string;
  price: string;
  cta: string;
  ctaDefault: string;
  link: string;
  style: string;
  styles: { shop: string; dark: string; light: string };
  preview: string;
  caption: string;
  captionHint: string;
  captionLanguage: string;
  captionText: (p: { shop: string; product: string; price: string; link: string; headline: string }) => string;
  share: string;
  shareHint: string;
  download: string;
  copyCaption: string;
  copied: string;
  whatsapp: string;
  facebook: string;
  myNetworks: string;
  myNetworksHint: string;
  openInstagram: string;
  openFacebook: string;
  openTiktok: string;
  noNetworks: string;
  downloaded: string;
  shared: string;
  photoBlocked: string;
  noPhoto: string;
}

export const POSTER_COPY: Record<Language, PosterCopy> = {
  fr: {
    title: "Créer une affiche",
    subtitle: "Image verticale HD (1080 × 1920), prête pour les stories et les statuts",
    close: "Fermer",
    product: "Produit",
    texts: "Textes de l'affiche",
    headline: "Accroche (facultatif)",
    headlinePlaceholder: "Ex. : Promo -20 % ce week-end",
    name: "Nom du produit",
    price: "Prix affiché",
    cta: "Appel à l'action",
    ctaDefault: "Commandez sur WhatsApp",
    link: "Lien imprimé",
    style: "Style",
    styles: { shop: "Couleurs de ma boutique", dark: "Sombre élégant", light: "Clair épuré" },
    preview: "Aperçu : l'image exacte qui sera publiée",
    caption: "Légende",
    captionHint: "Le texte à coller sous votre publication. Modifiez-le librement.",
    captionLanguage: "Langue de la légende",
    captionText: ({ shop, product, price, link, headline }) =>
      `${headline ? `${headline}\n\n` : ""}${product} — ${price}\nChez ${shop}.\n\nCommandez en 1 clic sur WhatsApp 👉 ${link}`,
    share: "Partager l'affiche",
    shareHint: "Sur téléphone : choisissez WhatsApp, Instagram, Facebook ou TikTok dans le menu qui s'ouvre.",
    download: "Télécharger l'image",
    copyCaption: "Copier la légende",
    copied: "Légende copiée",
    whatsapp: "Envoyer sur WhatsApp",
    facebook: "Partager sur Facebook",
    myNetworks: "Mes réseaux",
    myNetworksHint: "Instagram et TikTok ne permettent pas de publier depuis un site : téléchargez l'image, puis publiez-la depuis l'application.",
    openInstagram: "Ouvrir mon Instagram",
    openFacebook: "Ouvrir ma page Facebook",
    openTiktok: "Ouvrir mon TikTok",
    noNetworks: "Ajoutez vos réseaux dans Réglages pour les ouvrir d'ici.",
    downloaded: "Image téléchargée.",
    shared: "Affiche partagée.",
    photoBlocked: "La photo de ce produit ne peut pas être exportée. Réessayez avec une autre photo.",
    noPhoto: "Sans photo",
  },
  ht: {
    title: "Kreye yon afich",
    subtitle: "Imaj vètikal HD (1080 × 1920), pare pou story ak estati",
    close: "Fèmen",
    product: "Pwodui",
    texts: "Tèks afich la",
    headline: "Fraz atraksyon (si w vle)",
    headlinePlaceholder: "Egz. : Pwomo -20 % wikenn sa a",
    name: "Non pwodui a",
    price: "Pri ki parèt",
    cta: "Apèl pou aksyon",
    ctaDefault: "Kòmande sou WhatsApp",
    link: "Lyen ki enprime",
    style: "Stil",
    styles: { shop: "Koulè boutik mwen", dark: "Nwa elegan", light: "Klè pwòp" },
    preview: "Apèsi : egzakteman imaj k ap pibliye a",
    caption: "Lejann",
    captionHint: "Tèks pou kole anba piblikasyon an. Ou ka chanje l.",
    captionLanguage: "Lang lejann nan",
    captionText: ({ shop, product, price, link, headline }) =>
      `${headline ? `${headline}\n\n` : ""}${product} — ${price}\nLakay ${shop}.\n\nKòmande an 1 klik sou WhatsApp 👉 ${link}`,
    share: "Pataje afich la",
    shareHint: "Sou telefòn : chwazi WhatsApp, Instagram, Facebook oswa TikTok nan meni ki louvri a.",
    download: "Telechaje imaj la",
    copyCaption: "Kopye lejann nan",
    copied: "Lejann kopye",
    whatsapp: "Voye sou WhatsApp",
    facebook: "Pataje sou Facebook",
    myNetworks: "Rezo mwen yo",
    myNetworksHint: "Instagram ak TikTok pa kite w pibliye depi yon sit : telechaje imaj la, epi pibliye l depi aplikasyon an.",
    openInstagram: "Louvri Instagram mwen",
    openFacebook: "Louvri paj Facebook mwen",
    openTiktok: "Louvri TikTok mwen",
    noNetworks: "Ajoute rezo ou yo nan Reglaj pou louvri yo isit la.",
    downloaded: "Imaj la telechaje.",
    shared: "Afich la pataje.",
    photoBlocked: "Nou pa ka ekspòte foto pwodui sa a. Eseye ak yon lòt foto.",
    noPhoto: "San foto",
  },
  en: {
    title: "Create a poster",
    subtitle: "Vertical HD image (1080 × 1920), ready for stories and statuses",
    close: "Close",
    product: "Product",
    texts: "Poster text",
    headline: "Headline (optional)",
    headlinePlaceholder: "E.g. 20% off this weekend",
    name: "Product name",
    price: "Displayed price",
    cta: "Call to action",
    ctaDefault: "Order on WhatsApp",
    link: "Printed link",
    style: "Style",
    styles: { shop: "My shop's colors", dark: "Elegant dark", light: "Clean light" },
    preview: "Preview: the exact image that will be posted",
    caption: "Caption",
    captionHint: "The text to paste under your post. Edit it freely.",
    captionLanguage: "Caption language",
    captionText: ({ shop, product, price, link, headline }) =>
      `${headline ? `${headline}\n\n` : ""}${product} — ${price}\nAt ${shop}.\n\nOrder in 1 click on WhatsApp 👉 ${link}`,
    share: "Share the poster",
    shareHint: "On a phone: pick WhatsApp, Instagram, Facebook or TikTok in the menu that opens.",
    download: "Download the image",
    copyCaption: "Copy the caption",
    copied: "Caption copied",
    whatsapp: "Send on WhatsApp",
    facebook: "Share on Facebook",
    myNetworks: "My networks",
    myNetworksHint: "Instagram and TikTok don't allow posting from a website: download the image, then post it from the app.",
    openInstagram: "Open my Instagram",
    openFacebook: "Open my Facebook page",
    openTiktok: "Open my TikTok",
    noNetworks: "Add your networks in Settings to open them from here.",
    downloaded: "Image downloaded.",
    shared: "Poster shared.",
    photoBlocked: "This product's photo can't be exported. Try another photo.",
    noPhoto: "No photo",
  },
};
