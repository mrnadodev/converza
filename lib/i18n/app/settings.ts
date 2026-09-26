import type { Language } from "../translations";

export interface SettingsCopy {
  title: string;
  subtitle: string;
  tabs: { store: string; payments: string; delivery: string; look: string };
  shortcuts: { subscription: string; team: string };
  store: {
    identity: string;
    cover: string;
    coverCta: string;
    logo: string;
    logoCta: string;
    name: string;
    slogan: string;
    sloganPlaceholder: string;
    promo: string;
    promoHint: string;
    promoPlaceholder: string;
    type: string;
    phone: string;
    changePhone: string;
    employees: string;
    hours: string;
    hoursPlaceholder: string;
    address: string;
    addressPlaceholder: string;
    language: string;
    languageHint: string;
    social: string;
    showcase: { title: string; label: string; hint: string };
    /** Annuaire public : on cherche un produit, on trouve la boutique. */
    directory: { label: string; hint: string; link: string };
  };
  payments: {
    title: string;
    rate: string;
    rateHint: string;
    rateBadge: (rate: string) => string;
    ratePlaceholder: string;
    banks: {
      title: string;
      add: string;
      empty: string;
      bank: string;
      currency: string;
      holder: string;
      number: string;
      remove: string;
    };
    moncash: { title: string; add: string; remove: string; empty: string; number: string; holder: string; qr: string; qrCta: string };
    natcash: { title: string; add: string; remove: string; empty: string; number: string; holder: string; qr: string; qrCta: string };
    zelle: { title: string; add: string; remove: string; empty: string; placeholder: string; qr: string; qrCta: string };
    usdt: { title: string; add: string; remove: string; empty: string; placeholder: string; qr: string; qrCta: string };
  };
  delivery: {
    title: string;
    hint: string;
    count: (n: number) => string;
    empty: string;
    zoneName: string;
    zoneNamePlaceholder: string;
    zoneFee: string;
    zoneFeePlaceholder: string;
    add: string;
    free: string;
  };
  look: {
    title: string;
    theme: string;
    layout: string;
    layoutHint: string;
    designs: { design1: string; design2: string; design3: string };
    images: (n: number) => string;
    preview: string;
    qrTitle: string;
    qrPremium: string;
    qrCta: string;
    selected: string;
    lockedPro: string;
    lockedPremium: string;
    lockedOff: string;
    sectorColors: string;
  };
  tables: {
    title: string;
    desc: string;
    count: string;
    print: (n: number) => string;
    howTo: string;
    preview: string;
    tableLabel: (n: string) => string;
    scanHint: string;
    noAppNote: string;
    printTitle: (business: string) => string;
  };
  saved: string;
  save: string;
}

const fr: SettingsCopy = {
  title: "Paramètres",
  subtitle: "Votre boutique, vos moyens de paiement et vos livraisons.",
  tabs: { store: "Boutique", payments: "Paiements", delivery: "Livraison", look: "Apparence" },
  shortcuts: { subscription: "Abonnement", team: "Équipe" },
  store: {
    identity: "Identité de la boutique",
    cover: "Bannière",
    coverCta: "Ajouter",
    logo: "Logo",
    logoCta: "Ajouter",
    name: "Nom de la boutique",
    slogan: "Slogan",
    sloganPlaceholder: "Une phrase qui décrit votre boutique",
    promo: "Message de promotion",
    promoHint: "Le lien de votre vitrine est ajouté automatiquement à la fin du message.",
    promoPlaceholder: "Nouveautés de la semaine, réductions…",
    type: "Secteur d'activité",
    phone: "Numéro WhatsApp",
    changePhone: "Changer de numéro (vérification CONVERZA)",
    employees: "Nombre d'employés",
    hours: "Heures d'ouverture",
    hoursPlaceholder: "7h–19h",
    address: "Adresse",
    addressPlaceholder: "Delmas 31, Port-au-Prince",
    language: "Langue de l'application",
    languageHint: "Vos écrans et les messages envoyés aux clients suivent cette langue.",
    social: "Réseaux sociaux",
    showcase: {
      title: "Page d'accueil de CONVERZA",
      label: "Présenter ma boutique parmi celles qui vendent",
      hint: "Votre nom, votre logo et un lien vers votre vitrine, sur la page que voient les futurs commerçants. Rien d'autre que ce que votre vitrine montre déjà.",
    },
    directory: {
      label: "Apparaître dans l'annuaire CONVERZA",
      hint: "Quand quelqu'un cherche un produit que vous vendez, votre boutique apparaît et il ouvre votre vitrine. C'est la façon d'être découvert sans être sur les réseaux sociaux.",
      link: "Voir l'annuaire",
    },
  },
  payments: {
    title: "Comment vos clients vous paient",
    rate: "Taux du jour (1 USD en gourdes)",
    rateHint: "Utilisé pour afficher les prix en USD sur les factures. Laissez vide si vous ne vendez qu'en gourdes.",
    rateBadge: (rate) => `1 USD = ${rate} HTG`,
    ratePlaceholder: "132.50",
    banks: {
      title: "Comptes bancaires",
      add: "Ajouter un compte",
      empty: "Aucun compte bancaire enregistré.",
      bank: "Banque",
      currency: "Devise",
      holder: "Titulaire du compte",
      number: "Numéro de compte",
      remove: "Retirer ce compte",
    },
    moncash: {
      title: "MonCash (Digicel)",
      add: "Activer MonCash",
      remove: "Retirer MonCash",
      empty: "MonCash n'est pas activé.",
      number: "Numéro MonCash",
      holder: "Nom sur le compte",
      qr: "QR code MonCash",
      qrCta: "Ajouter le QR",
    },
    natcash: {
      title: "NatCash (Natcom)",
      add: "Activer NatCash",
      remove: "Retirer NatCash",
      empty: "NatCash n'est pas activé.",
      number: "Numéro NatCash",
      holder: "Nom sur le compte",
      qr: "QR code NatCash",
      qrCta: "Ajouter le QR",
    },
    zelle: {
      title: "Zelle",
      add: "Activer Zelle",
      remove: "Retirer Zelle",
      empty: "Zelle n'est pas activé.",
      placeholder: "e-mail ou téléphone / nom du compte",
      qr: "QR code Zelle (facultatif)",
      qrCta: "Ajouter le QR",
    },
    usdt: {
      title: "USDT (réseau TRC-20)",
      add: "Activer USDT",
      remove: "Retirer USDT",
      empty: "USDT n'est pas activé.",
      placeholder: "Adresse de votre portefeuille TRC-20",
      qr: "QR code du portefeuille (facultatif)",
      qrCta: "Ajouter le QR",
    },
  },
  delivery: {
    title: "Zones et frais de livraison",
    hint: "Le client choisit sa zone au moment de commander ; les frais s'ajoutent au total.",
    count: (n) => (n <= 1 ? `${n} zone` : `${n} zones`),
    empty: "Aucune zone de livraison. Sans zone, le client ne peut que retirer en boutique.",
    zoneName: "Nom de la zone",
    zoneNamePlaceholder: "Pétion-Ville",
    zoneFee: "Frais (HTG)",
    zoneFeePlaceholder: "100",
    add: "Ajouter la zone",
    free: "Gratuit",
  },
  look: {
    title: "Apparence de la vitrine",
    theme: "Couleur",
    layout: "Mise en page",
    layoutHint: "La vitrine montre seulement ces images ; tous vos autres produits sont dans le catalogue complet.",
    designs: {
      design1: "Grille",
      design2: "Vedette",
      design3: "Mosaïque",
    },
    lockedPro: "réservé au plan Pro",
    lockedPremium: "réservé au plan Premium",
    lockedOff: "Désactivée par CONVERZA",
    sectorColors: "Couleurs du secteur",
    images: (n: number) => `${n} images en vitrine`,
    preview: "Aperçu",
    qrTitle: "Menu QR pour les tables",
    qrPremium: "Le menu QR par table s'obtient avec le plan Menu QR Express, ou avec Premium qui l'inclut. Vos clients scannent, commandent depuis leur table, et la commande arrive sur votre WhatsApp.",
    qrCta: "Voir les offres",
    selected: "Choisie",
  },
  tables: {
    title: "QR codes de table",
    desc: "Imprimez un QR par table : le client scanne, voit le menu et commande depuis sa place.",
    count: "Nombre de tables",
    print: (n) => `Imprimer ${n} chevalets`,
    howTo: "Imprimez, découpez et posez un chevalet sur chaque table. Le numéro de table est ajouté à la commande reçue sur WhatsApp.",
    preview: "Aperçu",
    tableLabel: (n) => `Table ${n}`,
    scanHint: "Scannez pour voir le menu et commander",
    noAppNote: "Aucune application à installer · commande sur WhatsApp",
    printTitle: (business) => `Chevalets QR — ${business}`,
  },
  saved: "Modifications enregistrées",
  save: "Enregistrer",
};

const ht: SettingsCopy = {
  title: "Reglaj",
  subtitle: "Boutik ou, mwayen pèman ou ak livrezon ou.",
  tabs: { store: "Boutik", payments: "Pèman", delivery: "Livrezon", look: "Aparans" },
  shortcuts: { subscription: "Abònman", team: "Ekip" },
  store: {
    identity: "Idantite boutik la",
    cover: "Banyè",
    coverCta: "Ajoute",
    logo: "Logo",
    logoCta: "Ajoute",
    name: "Non boutik la",
    slogan: "Slogan",
    sloganPlaceholder: "Yon fraz ki dekri boutik ou",
    promo: "Mesaj pwomosyon",
    promoHint: "Lyen vitrin ou ajoute otomatikman nan fen mesaj la.",
    promoPlaceholder: "Nouvo pwodwi semèn nan, rabè…",
    type: "Sektè aktivite",
    phone: "Nimewo WhatsApp",
    changePhone: "Chanje nimewo (CONVERZA verifye)",
    employees: "Kantite anplwaye",
    hours: "Lè louvri",
    hoursPlaceholder: "7è–7è",
    address: "Adrès",
    addressPlaceholder: "Delmas 31, Pòtoprens",
    language: "Lang aplikasyon an",
    languageHint: "Ekran ou yo ak mesaj ou voye bay kliyan yo swiv lang sa a.",
    social: "Rezo sosyal",
    showcase: {
      title: "Paj akèy CONVERZA",
      label: "Montre boutik mwen pami sa k ap vann yo",
      hint: "Non w, logo w ak yon lyen sou vitrin ou, sou paj futur machann yo wè a. Anyen pase sa vitrin ou deja montre.",
    },
    directory: {
      label: "Parèt nan anyè CONVERZA a",
      hint: "Lè yon moun chèche yon pwodwi ou vann, boutik ou parèt epi l ouvri vitrin ou. Se konsa moun dekouvri w san w pa bezwen sou rezo sosyal yo.",
      link: "Gade anyè a",
    },
  },
  payments: {
    title: "Kijan kliyan yo peye w",
    rate: "To jounen an (1 USD an goud)",
    rateHint: "Li sèvi pou montre pri an USD sou fakti yo. Kite l vid si w vann an goud sèlman.",
    rateBadge: (rate) => `1 USD = ${rate} HTG`,
    ratePlaceholder: "132.50",
    banks: {
      title: "Kont labank",
      add: "Ajoute yon kont",
      empty: "Pa gen kont labank ki anrejistre.",
      bank: "Bank",
      currency: "Deviz",
      holder: "Titilè kont la",
      number: "Nimewo kont",
      remove: "Retire kont sa a",
    },
    moncash: {
      title: "MonCash (Digicel)",
      add: "Aktive MonCash",
      remove: "Retire MonCash",
      empty: "MonCash pa aktive.",
      number: "Nimewo MonCash",
      holder: "Non sou kont la",
      qr: "QR kòd MonCash",
      qrCta: "Ajoute QR a",
    },
    natcash: {
      title: "NatCash (Natcom)",
      add: "Aktive NatCash",
      remove: "Retire NatCash",
      empty: "NatCash pa aktive.",
      number: "Nimewo NatCash",
      holder: "Non sou kont la",
      qr: "QR kòd NatCash",
      qrCta: "Ajoute QR a",
    },
    zelle: {
      title: "Zelle",
      add: "Aktive Zelle",
      remove: "Retire Zelle",
      empty: "Zelle pa aktive.",
      placeholder: "imèl oswa telefòn / non kont la",
      qr: "QR kòd Zelle (opsyonèl)",
      qrCta: "Ajoute QR a",
    },
    usdt: {
      title: "USDT (rezo TRC-20)",
      add: "Aktive USDT",
      remove: "Retire USDT",
      empty: "USDT pa aktive.",
      placeholder: "Adrès pòtfèy TRC-20 ou",
      qr: "QR kòd pòtfèy la (opsyonèl)",
      qrCta: "Ajoute QR a",
    },
  },
  delivery: {
    title: "Zòn ak frè livrezon",
    hint: "Kliyan an chwazi zòn li lè l ap kòmande ; frè a ajoute nan total la.",
    count: (n) => `${n} zòn`,
    empty: "Pa gen zòn livrezon. San zòn, kliyan an ka sèlman vin chèche nan boutik la.",
    zoneName: "Non zòn nan",
    zoneNamePlaceholder: "Petyonvil",
    zoneFee: "Frè (HTG)",
    zoneFeePlaceholder: "100",
    add: "Ajoute zòn nan",
    free: "Gratis",
  },
  look: {
    title: "Aparans vitrin nan",
    theme: "Koulè",
    layout: "Mizanpaj",
    layoutHint: "Vitrin nan montre imaj sa yo sèlman ; tout lòt pwodui ou yo nan katalòg konplè a.",
    designs: {
      design1: "Kadriyaj",
      design2: "Vedèt",
      design3: "Mozayik",
    },
    lockedPro: "sèlman ak plan Pro",
    lockedPremium: "sèlman ak plan Premium",
    lockedOff: "CONVERZA dezaktive l",
    sectorColors: "Koulè sektè a",
    images: (n: number) => `${n} imaj nan vitrin`,
    preview: "Apèsi",
    qrTitle: "Menu QR pou tab yo",
    qrPremium: "Menu QR pa tab la vini ak plan Menu QR Express la, oswa ak Premium ki gen li ladan. Kliyan yo eskane, yo kòmande depi sou tab la, epi kòmand lan rive sou WhatsApp ou.",
    qrCta: "Gade òf yo",
    selected: "Chwazi",
  },
  tables: {
    title: "QR kòd pou tab yo",
    desc: "Enprime yon QR pou chak tab : kliyan an eskane, wè meni an epi kòmande san l pa leve.",
    count: "Kantite tab",
    print: (n) => `Enprime ${n} chevalèt`,
    howTo: "Enprime, koupe epi mete yon chevalèt sou chak tab. Nimewo tab la ajoute nan kòmand ou resevwa sou WhatsApp la.",
    preview: "Apèsi",
    tableLabel: (n) => `Tab ${n}`,
    scanHint: "Eskane pou wè meni an epi kòmande",
    noAppNote: "Pa gen aplikasyon pou enstale · kòmand sou WhatsApp",
    printTitle: (business) => `Chevalèt QR — ${business}`,
  },
  saved: "Chanjman anrejistre",
  save: "Anrejistre",
};

const en: SettingsCopy = {
  title: "Settings",
  subtitle: "Your store, your payment methods and your deliveries.",
  tabs: { store: "Store", payments: "Payments", delivery: "Delivery", look: "Appearance" },
  shortcuts: { subscription: "Subscription", team: "Team" },
  store: {
    identity: "Store identity",
    cover: "Banner",
    coverCta: "Add",
    logo: "Logo",
    logoCta: "Add",
    name: "Store name",
    slogan: "Tagline",
    sloganPlaceholder: "One sentence describing your store",
    promo: "Promotion message",
    promoHint: "Your storefront link is added automatically at the end of the message.",
    promoPlaceholder: "This week's arrivals, discounts…",
    type: "Industry",
    phone: "WhatsApp number",
    changePhone: "Change number (verified by CONVERZA)",
    employees: "Number of employees",
    hours: "Opening hours",
    hoursPlaceholder: "7am–7pm",
    address: "Address",
    addressPlaceholder: "Delmas 31, Port-au-Prince",
    language: "App language",
    languageHint: "Your screens and the messages sent to customers follow this language.",
    social: "Social networks",
    showcase: {
      title: "CONVERZA home page",
      label: "Feature my shop among those already selling",
      hint: "Your name, your logo and a link to your storefront, on the page future merchants see. Nothing beyond what your storefront already shows.",
    },
    directory: {
      label: "Appear in the CONVERZA directory",
      hint: "When someone searches for a product you sell, your shop shows up and they open your storefront. This is how you get found without being on social media.",
      link: "See the directory",
    },
  },
  payments: {
    title: "How customers pay you",
    rate: "Daily rate (1 USD in gourdes)",
    rateHint: "Used to show USD prices on invoices. Leave empty if you only sell in gourdes.",
    rateBadge: (rate) => `1 USD = ${rate} HTG`,
    ratePlaceholder: "132.50",
    banks: {
      title: "Bank accounts",
      add: "Add an account",
      empty: "No bank account saved.",
      bank: "Bank",
      currency: "Currency",
      holder: "Account holder",
      number: "Account number",
      remove: "Remove this account",
    },
    moncash: {
      title: "MonCash (Digicel)",
      add: "Enable MonCash",
      remove: "Remove MonCash",
      empty: "MonCash is not enabled.",
      number: "MonCash number",
      holder: "Name on the account",
      qr: "MonCash QR code",
      qrCta: "Add the QR",
    },
    natcash: {
      title: "NatCash (Natcom)",
      add: "Enable NatCash",
      remove: "Remove NatCash",
      empty: "NatCash is not enabled.",
      number: "NatCash number",
      holder: "Name on the account",
      qr: "NatCash QR code",
      qrCta: "Add the QR",
    },
    zelle: {
      title: "Zelle",
      add: "Enable Zelle",
      remove: "Remove Zelle",
      empty: "Zelle is not enabled.",
      placeholder: "email or phone / account name",
      qr: "Zelle QR code (optional)",
      qrCta: "Add the QR",
    },
    usdt: {
      title: "USDT (TRC-20 network)",
      add: "Enable USDT",
      remove: "Remove USDT",
      empty: "USDT is not enabled.",
      placeholder: "Your TRC-20 wallet address",
      qr: "Wallet QR code (optional)",
      qrCta: "Add the QR",
    },
  },
  delivery: {
    title: "Delivery zones and fees",
    hint: "Customers pick their zone at checkout; the fee is added to the total.",
    count: (n) => (n === 1 ? "1 zone" : `${n} zones`),
    empty: "No delivery zone. Without one, customers can only pick up in store.",
    zoneName: "Zone name",
    zoneNamePlaceholder: "Pétion-Ville",
    zoneFee: "Fee (HTG)",
    zoneFeePlaceholder: "100",
    add: "Add the zone",
    free: "Free",
  },
  look: {
    title: "Storefront appearance",
    theme: "Color",
    layout: "Layout",
    layoutHint: "Your storefront shows only these images; all your other products are in the full catalog.",
    designs: {
      design1: "Grid",
      design2: "Spotlight",
      design3: "Mosaic",
    },
    lockedPro: "Pro plan only",
    lockedPremium: "Premium plan only",
    lockedOff: "Turned off by CONVERZA",
    sectorColors: "Sector colors",
    images: (n: number) => `${n} images on the storefront`,
    preview: "Preview",
    qrTitle: "QR menu for tables",
    qrPremium: "The per-table QR menu comes with the Menu QR Express plan, or with Premium which includes it. Your customers scan, order from their table, and the order lands on your WhatsApp.",
    qrCta: "See the plans",
    selected: "Selected",
  },
  tables: {
    title: "Table QR codes",
    desc: "Print one QR per table: guests scan, see the menu and order from their seat.",
    count: "Number of tables",
    print: (n) => `Print ${n} table cards`,
    howTo: "Print, cut and place one card on each table. The table number is added to the order you receive on WhatsApp.",
    preview: "Preview",
    tableLabel: (n) => `Table ${n}`,
    scanHint: "Scan to see the menu and order",
    noAppNote: "No app to install · order on WhatsApp",
    printTitle: (business) => `Table QR cards — ${business}`,
  },
  saved: "Changes saved",
  save: "Save",
};

export const SETTINGS_COPY: Record<Language, SettingsCopy> = { fr, ht, en };
