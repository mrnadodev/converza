import type { Language } from "./translations";

// Textes de la page d'accueil publique.
//
// Ils vivent à part du dictionnaire de l'application : ce sont des textes
// marketing, longs et retravaillés souvent, alors que translations.ts contient
// des libellés d'interface courts. Les mélanger rendrait les deux pénibles à
// relire.

import type { IndustrySectorKey } from "../verticals";

export interface AuthCopy {
  signInTitle: string;
  signInSubtitle: string;
  email: string;
  password: string;
  signInCta: string;
  signInPending: string;
  forgot: string;
  noAccount: string;
  createOne: string;
  registerTitle: string;
  registerSubtitle: string;
  finishTitle: string;
  finishSubtitle: string;
  businessName: string;
  sector: string;
  specialty: string;
  employees: string;
  whatsapp: string;
  yourName: string;
  registerCta: string;
  finishCta: string;
  registerPending: string;
  haveAccount: string;
  signInLink: string;
}

export interface LandingCopy {
  auth: AuthCopy;
  nav: {
    product: string;
    restaurants: string;
    pricing: string;
    help: string;
    signIn: string;
    createAccount: string;
    /** Libellé court pour l'en-tête sur téléphone, où la place manque. */
    createAccountShort: string;
  };
  hero: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: string[];
    orderPaid: string;
    orderCode: string;
    onDelivery: string;
  };
  shop: {
    open: string;
    product1: string;
    product2: string;
    delivery: string;
    send: string;
  };
  proof: { label: string };
  how: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: { title: string; body: string }[];
  };
  pipeline: {
    eyebrow: string;
    title: string;
    subtitle: string;
    boardTitle: string;
    inProgress: string;
    thisWeek: string;
    toCollect: string;
    columns: string[];
    remains: string;
    code: string;
  };
  message: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
    receivedOn: string;
    langNote: string;
    text: string;
  };
  features: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  sectors: {
    eyebrow: string;
    title: string;
    body: string;
    /**
     * Les onze secteurs, dans la langue du visiteur. Le type les exige tous :
     * un douzième secteur ajouté à lib/verticals.ts casse la compilation tant
     * qu'il n'est pas nommé dans les trois langues — plutôt que d'apparaître
     * en français sur une page créole.
     */
    names: Record<IndustrySectorKey, string>;
    /**
     * « 11 secteurs · 75 métiers ». Les nombres viennent de lib/verticals.ts et
     * sont substitués à {secteurs} et {metiers} au rendu.
     *
     * Ce sont des chaînes, pas des fonctions : la console d'administration
     * réécrit ces textes et les clone avec structuredClone, qui refuse une
     * fonction. Aucun champ de LandingCopy ne doit en contenir.
     */
    count: string;
    trades: string;
    trade: string;
  };
  resto: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    price: string;
    tables: string;
    scan: string;
    table: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    note: string;
    mostChosen: string;
    perMonth: string;
    currency: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  finalCta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
  footer: {
    tagline: string;
    productCol: string;
    companyCol: string;
    languageCol: string;
    productLinks: string[];
    companyLinks: string[];
    rights: string;
    city: string;
  };
}

const fr: LandingCopy = {
  auth: {
    signInTitle: "Connexion",
    signInSubtitle: "Accédez au compte de votre commerce.",
    email: "E-mail",
    password: "Mot de passe",
    signInCta: "Se connecter",
    signInPending: "Connexion…",
    forgot: "Mot de passe oublié ?",
    noAccount: "Vous n'avez pas encore de compte ?",
    createOne: "Créez votre commerce",
    registerTitle: "Créez votre commerce sur CONVERZA",
    registerSubtitle: "Configuration adaptée à votre secteur et à votre équipe",
    finishTitle: "Terminez la création de votre commerce",
    finishSubtitle: "Votre compte existe déjà. Il ne manque que la boutique.",
    businessName: "Nom du commerce",
    sector: "Secteur d'activité",
    specialty: "Spécialité",
    employees: "Nombre d'employés",
    whatsapp: "Numéro WhatsApp",
    yourName: "Votre nom",
    registerCta: "Créer mon commerce",
    finishCta: "Créer ma boutique",
    registerPending: "Création…",
    haveAccount: "Vous avez déjà un compte ?",
    signInLink: "Se connecter",
  },
  nav: {
    product: "Produit",
    restaurants: "Restaurants",
    pricing: "Tarifs",
    help: "Aide",
    signIn: "Se connecter",
    createAccount: "Créer mon compte",
    createAccountShort: "S'inscrire",
  },
  hero: {
    badge: "Sans API WhatsApp payante",
    titleLead: "Vendez sur WhatsApp, sans perdre",
    titleAccent: "une seule commande.",
    subtitle:
      "Une vitrine en ligne que vous partagez d'un lien, et chaque commande suivie du premier message jusqu'au paiement encaissé.",
    ctaPrimary: "Créer ma vitrine gratuitement",
    ctaSecondary: "Voir une vitrine",
    trust: ["Gratuit pour commencer", "Aucune carte bancaire", "En ligne en 5 minutes"],
    orderPaid: "Payée",
    orderCode: "Code 2842",
    onDelivery: "à la livraison",
  },
  shop: {
    open: "Ouvert · 7h–19h · Delmas 31",
    product1: "Œufs frais",
    product2: "Pain complet",
    delivery: "Livraison Delmas",
    send: "Envoyer",
  },
  proof: { label: "Ils vendent déjà avec CONVERZA" },
  how: {
    eyebrow: "Comment ça marche",
    title: "Trois étapes, et vous vendez",
    subtitle: "Vous n'installez rien, vos clients non plus. Tout passe par un lien et par WhatsApp.",
    steps: [
      {
        title: "Vous créez votre vitrine",
        body: "Nom du commerce, photos, prix, zones de livraison. Vous obtenez une adresse à vous, du type converza.ht/b/votre-boutique.",
      },
      {
        title: "Vous partagez le lien",
        body: "Dans votre statut WhatsApp, votre bio TikTok, vos publicités. Le client n'installe rien et n'ouvre aucun compte.",
      },
      {
        title: "La commande arrive écrite",
        body: "Sur votre WhatsApp habituel, avec les articles, les frais de livraison, le total et le code de retrait. Vous ne retapez rien.",
      },
    ],
  },
  pipeline: {
    eyebrow: "Suivi des commandes",
    title: "Chaque commande sait où elle en est",
    subtitle:
      "Sept étapes, de la demande jusqu'au recouvrement. Vous voyez ce qui reste à faire sans avoir à vous en souvenir.",
    boardTitle: "Commandes",
    inProgress: "en cours",
    thisWeek: "Cette semaine",
    toCollect: "à recouvrer",
    columns: ["Demande", "Contact", "Paiement", "Confirmé", "En route", "Livrée", "Suivi"],
    remains: "Reste",
    code: "Code 2842",
  },
  message: {
    eyebrow: "Sans API payante",
    title: "Votre numéro WhatsApp, celui que vos clients connaissent déjà",
    body: "CONVERZA n'utilise aucune API WhatsApp facturée et ne vous demande pas de changer de numéro. Le lien ouvre simplement la conversation avec le message déjà rédigé.",
    points: [
      "Aucun risque de blocage de compte",
      "Aucun abonnement WhatsApp Business à souscrire",
      "Fonctionne sur un téléphone d'entrée de gamme",
    ],
    receivedOn: "Reçu sur votre WhatsApp",
    langNote: "Le message est rédigé dans la langue choisie par votre client : français, créole ou anglais.",
    text: "Bonjour Ti Kòk Boutik ! Je voudrais commander :\n• 1× Pain complet (unité) — 155 HTG\n• 1× Œufs frais (douzaine) — 180 HTG\nLivraison (Delmas): 50 HTG\nTotal: 385 HTG",
  },
  features: {
    eyebrow: "Ce qui est inclus",
    title: "Tout ce dont un commerce a besoin pour vendre",
    items: [
      { title: "Catalogue produits", body: "Photos, prix, unités, catégories. Import de votre liste depuis un fichier Excel." },
      { title: "Suivi du stock", body: "Seuil d'alerte par produit et signalement des articles proches de la rupture." },
      { title: "Moyens de paiement", body: "MonCash, Natcash, espèces à la livraison, virement bancaire, Zelle, USDT." },
      { title: "Code de retrait", body: "Un code à quatre chiffres par commande. Sans le code, le colis ne part pas." },
      { title: "Comptes pour l'équipe", body: "Caisse, ventes, livraison, service client. Chacun ne voit que ce qui le concerne." },
      { title: "Rapports de vente", body: "Chiffre de la semaine, sommes à recouvrer, meilleurs produits, export Excel." },
    ],
  },
  sectors: {
    eyebrow: "Pour qui",
    title: "Onze secteurs, un seul outil",
    body: "CONVERZA ne se contente pas de changer de couleur : la vitrine, le vocabulaire, les catégories et les rôles de l'équipe s'ajustent au métier que vous exercez.",
    names: {
      commerce_vente: "Commerce & Vente",
      restauration: "Restauration & Alimentation",
      immobilier: "Immobilier & Gestion",
      automobile: "Automobile & Services",
      sante_bienetre: "Santé & Bien-être",
      beaute_services: "Beauté & Services personnels",
      education: "Éducation & Formation",
      services_pros: "Services professionnels",
      construction: "Construction & Habitat",
      digital_tech: "Digital & Technologie",
      grossistes_distribution: "Grossistes & Distribution",
    },
    count: "{secteurs} secteurs · {metiers} métiers déjà configurés",
    trades: "{n} métiers",
    trade: "1 métier",
  },
  resto: {
    eyebrow: "Pour les restaurants",
    title: "Menu QR Express, une offre à part",
    body: "Un chevalet QR par table, un menu visuel que le client parcourt sur son téléphone, et la commande qui arrive en cuisine avec le numéro de table.",
    cta: "Découvrir l'offre",
    price: "1 000 HTG / mois",
    tables: "jusqu'à 25 tables",
    scan: "Scannez pour commander",
    table: "Table 05",
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Commencez gratuitement, payez quand vous vendez",
    note: "Prix en gourdes, par mois. Résiliable à tout moment.",
    mostChosen: "Le plus choisi",
    perMonth: "HTG / mois",
    currency: "HTG",
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Avant de commencer",
    items: [
      {
        q: "Dois-je changer de numéro WhatsApp ?",
        a: "Non. Les commandes arrivent sur le numéro que vous utilisez déjà, dans l'application WhatsApp que vous connaissez.",
      },
      {
        q: "Mes clients doivent-ils installer quelque chose ?",
        a: "Non. Ils ouvrent votre lien dans leur navigateur, choisissent, et le message part vers votre WhatsApp. Aucun compte à créer.",
      },
      {
        q: "Comment se passe le paiement de l'abonnement ?",
        a: "Par MonCash, Natcash ou virement bancaire. Vous envoyez la référence du paiement, et le plan est activé après vérification.",
      },
      {
        q: "Que se passe-t-il si j'arrête de payer ?",
        a: "Votre compte revient au plan Gratuit. Votre vitrine et votre catalogue restent en ligne, vous perdez seulement les fonctions du plan payant.",
      },
    ],
  },
  finalCta: {
    title: "Votre vitrine peut être en ligne aujourd'hui",
    body: "Entrez le nom de votre commerce, ajoutez trois produits, partagez le lien.",
    primary: "Créer mon compte gratuitement",
    secondary: "Parler à quelqu'un",
  },
  footer: {
    tagline: "Vente et gestion clients par WhatsApp, pour les commerces en Haïti.",
    productCol: "Produit",
    companyCol: "Entreprise",
    languageCol: "Langue",
    productLinks: ["Vitrine", "Commandes", "Menu QR"],
    companyLinks: ["Tarifs", "Conditions d'utilisation", "Confidentialité"],
    rights: "© 2026 CONVERZA",
    city: "Port-au-Prince, Haïti",
  },
};

const ht: LandingCopy = {
  auth: {
    signInTitle: "Konekte",
    signInSubtitle: "Antre nan kont biznis ou.",
    email: "Imèl",
    password: "Modpas",
    signInCta: "Konekte",
    signInPending: "N ap konekte…",
    forgot: "Modpas bliye ?",
    noAccount: "Ou poko gen yon kont ?",
    createOne: "Kreye biznis ou",
    registerTitle: "Kreye biznis ou sou CONVERZA",
    registerSubtitle: "Konfigirasyon ki adapte ak sektè ak ekip ou",
    finishTitle: "Fini kreyasyon biznis ou",
    finishSubtitle: "Kont ou egziste deja. Se boutik la ki manke.",
    businessName: "Non biznis lan",
    sector: "Sektè biznis la",
    specialty: "Espesyalite",
    employees: "Kantite anplwaye",
    whatsapp: "Nimewo WhatsApp",
    yourName: "Non ou",
    registerCta: "Kreye biznis mwen",
    finishCta: "Kreye boutik mwen",
    registerPending: "N ap kreye…",
    haveAccount: "Ou gen yon kont deja ?",
    signInLink: "Konekte",
  },
  nav: {
    product: "Pwodwi",
    restaurants: "Restoran",
    pricing: "Pri",
    help: "Èd",
    signIn: "Konekte",
    createAccount: "Kreye kont mwen",
    createAccountShort: "Enskri",
  },
  hero: {
    badge: "San API WhatsApp peye",
    titleLead: "Vann sou WhatsApp, san ou pa pèdi",
    titleAccent: "yon sèl kòmand.",
    subtitle:
      "Yon vitrin an liy ou pataje ak yon sèl lyen, epi chak kòmand swiv depi premye mesaj la jiskaske lajan an antre.",
    ctaPrimary: "Kreye vitrin mwen gratis",
    ctaSecondary: "Gade yon vitrin",
    trust: ["Gratis pou kòmanse", "Pa gen kat kredi", "An liy nan 5 minit"],
    orderPaid: "Peye",
    orderCode: "Kòd 2842",
    onDelivery: "nan livrezon",
  },
  shop: {
    open: "Louvri · 7am–7pm · Delmas 31",
    product1: "Ze fre",
    product2: "Pen konplè",
    delivery: "Livrezon Delmas",
    send: "Voye",
  },
  proof: { label: "Yo deja ap vann ak CONVERZA" },
  how: {
    eyebrow: "Kijan li mache",
    title: "Twa etap, epi w ap vann",
    subtitle: "Ou pa enstale anyen, kliyan w yo non plis. Tout bagay pase nan yon lyen ak nan WhatsApp.",
    steps: [
      {
        title: "Ou kreye vitrin ou",
        body: "Non biznis la, foto, pri, zòn livrezon. Ou jwenn yon adrès pa w, tankou converza.ht/b/boutik-ou.",
      },
      {
        title: "Ou pataje lyen an",
        body: "Nan estati WhatsApp ou, nan bio TikTok ou, nan piblisite ou yo. Kliyan an pa enstale anyen epi li pa louvri okenn kont.",
      },
      {
        title: "Kòmand la rive deja ekri",
        body: "Sou WhatsApp abityèl ou, ak atik yo, frè livrezon an, total la ak kòd retrè a. Ou pa retape anyen.",
      },
    ],
  },
  pipeline: {
    eyebrow: "Swivi kòmand yo",
    title: "Chak kòmand konnen kote li ye",
    subtitle:
      "Sèt etap, depi demann lan jiska rekouvreman an. Ou wè sa ki rete pou fè san ou pa bezwen sonje l.",
    boardTitle: "Kòmand",
    inProgress: "an kous",
    thisWeek: "Semèn sa a",
    toCollect: "pou rekouvre",
    columns: ["Demand", "Kontak", "Pèman", "Konfime", "Sou wout", "Livre", "Swivi"],
    remains: "Rete",
    code: "Kòd 2842",
  },
  message: {
    eyebrow: "San API peye",
    title: "Nimewo WhatsApp ou, sa kliyan w yo deja konnen",
    body: "CONVERZA pa sèvi ak okenn API WhatsApp ki fakti epi li pa mande w chanje nimewo. Lyen an jis louvri konvèsasyon an ak mesaj la deja ekri.",
    points: [
      "Pa gen risk pou kont ou bloke",
      "Pa gen abònman WhatsApp Business pou peye",
      "Li mache sou yon telefòn senp",
    ],
    receivedOn: "Resevwa sou WhatsApp ou",
    langNote: "Mesaj la ekri nan lang kliyan an chwazi a: franse, kreyòl oswa angle.",
    text: "Bonjou Ti Kòk Boutik! Mwen vle kòmande:\n• 1× Pen konplè (inite) — 155 HTG\n• 1× Ze fre (douzèn) — 180 HTG\nLivrezon (Delmas): 50 HTG\nTotal: 385 HTG",
  },
  features: {
    eyebrow: "Sa ki ladan l",
    title: "Tout sa yon biznis bezwen pou l vann",
    items: [
      { title: "Katalòg pwodwi", body: "Foto, pri, inite, kategori. Enpòte lis ou soti nan yon fichye Excel." },
      { title: "Swivi stòk", body: "Yon sèy alèt pou chak pwodwi epi siyal pou atik ki prèt pou fini." },
      { title: "Mwayen pèman", body: "MonCash, Natcash, kach nan livrezon, vireman bankè, Zelle, USDT." },
      { title: "Kòd retrè", body: "Yon kòd kat chif pou chak kòmand. San kòd la, kolis la pa soti." },
      { title: "Kont pou ekip la", body: "Kès, vant, livrezon, sèvis kliyan. Chak moun wè sèlman sa ki konsène l." },
      { title: "Rapò vant", body: "Chif semèn nan, lajan pou rekouvre, pi bon pwodwi, ekspòtasyon Excel." },
    ],
  },
  sectors: {
    eyebrow: "Pou ki moun",
    title: "Onz sektè, yon sèl zouti",
    body: "CONVERZA pa jis chanje koulè : vitrin nan, mo yo, kategori yo ak wòl ekip la ajiste yo ak metye w ap fè a.",
    names: {
      commerce_vente: "Komès & Vant",
      restauration: "Restoran & Manje",
      immobilier: "Kay & Jesyon",
      automobile: "Machin & Sèvis",
      sante_bienetre: "Sante & Byennèt",
      beaute_services: "Bote & Sèvis pèsonèl",
      education: "Edikasyon & Fòmasyon",
      services_pros: "Sèvis pwofesyonèl",
      construction: "Konstriksyon & Kay",
      digital_tech: "Dijital & Teknoloji",
      grossistes_distribution: "Gwosis & Distribisyon",
    },
    count: "{secteurs} sektè · {metiers} metye deja konfigire",
    trades: "{n} metye",
    trade: "1 metye",
  },
  resto: {
    eyebrow: "Pou restoran yo",
    title: "Menu QR Express, yon òf apa",
    body: "Yon chevalè QR pou chak tab, yon menu vizyèl kliyan an gade sou telefòn li, epi kòmand la rive nan kwizin nan ak nimewo tab la.",
    cta: "Dekouvri òf la",
    price: "1 000 HTG / mwa",
    tables: "jiska 25 tab",
    scan: "Eskane pou kòmande",
    table: "Tab 05",
  },
  pricing: {
    eyebrow: "Pri",
    title: "Kòmanse gratis, peye lè w ap vann",
    note: "Pri an goud, chak mwa. Ou ka sispann lè w vle.",
    mostChosen: "Pi chwazi",
    perMonth: "HTG / mwa",
    currency: "HTG",
  },
  faq: {
    eyebrow: "Kesyon moun poze souvan",
    title: "Anvan w kòmanse",
    items: [
      {
        q: "Èske m dwe chanje nimewo WhatsApp mwen?",
        a: "Non. Kòmand yo rive sou nimewo ou deja ap sèvi a, nan menm aplikasyon WhatsApp ou konnen an.",
      },
      {
        q: "Èske kliyan m yo dwe enstale yon bagay?",
        a: "Non. Yo louvri lyen ou an nan navigatè yo, yo chwazi, epi mesaj la pati sou WhatsApp ou. Pa gen kont pou kreye.",
      },
      {
        q: "Kijan pèman abònman an fèt?",
        a: "Ak MonCash, Natcash oswa vireman bankè. Ou voye referans pèman an, epi plan an aktive apre verifikasyon.",
      },
      {
        q: "Kisa k ap pase si m sispann peye?",
        a: "Kont ou retounen sou plan Gratis la. Vitrin ou ak katalòg ou rete an liy, ou pèdi sèlman fonksyon plan peye a.",
      },
    ],
  },
  finalCta: {
    title: "Vitrin ou ka an liy jodi a",
    body: "Antre non biznis ou, ajoute twa pwodwi, pataje lyen an.",
    primary: "Kreye kont mwen gratis",
    secondary: "Pale ak yon moun",
  },
  footer: {
    tagline: "Vant ak jesyon kliyan sou WhatsApp, pou biznis an Ayiti.",
    productCol: "Pwodwi",
    companyCol: "Konpayi",
    languageCol: "Lang",
    productLinks: ["Vitrin", "Kòmand", "Menu QR"],
    companyLinks: ["Pri", "Kondisyon itilizasyon", "Konfidansyalite"],
    rights: "© 2026 CONVERZA",
    city: "Pòtoprens, Ayiti",
  },
};

const en: LandingCopy = {
  auth: {
    signInTitle: "Sign in",
    signInSubtitle: "Open your business account.",
    email: "Email",
    password: "Password",
    signInCta: "Sign in",
    signInPending: "Signing in…",
    forgot: "Forgot your password?",
    noAccount: "Don't have an account yet?",
    createOne: "Create your business",
    registerTitle: "Create your business on CONVERZA",
    registerSubtitle: "Set up around your sector and your team",
    finishTitle: "Finish setting up your business",
    finishSubtitle: "Your account already exists. Only the shop is missing.",
    businessName: "Business name",
    sector: "Sector",
    specialty: "Speciality",
    employees: "Number of employees",
    whatsapp: "WhatsApp number",
    yourName: "Your name",
    registerCta: "Create my business",
    finishCta: "Create my shop",
    registerPending: "Creating…",
    haveAccount: "Already have an account?",
    signInLink: "Sign in",
  },
  nav: {
    product: "Product",
    restaurants: "Restaurants",
    pricing: "Pricing",
    help: "Help",
    signIn: "Sign in",
    createAccount: "Create account",
    createAccountShort: "Sign up",
  },
  hero: {
    badge: "No paid WhatsApp API",
    titleLead: "Sell on WhatsApp, without losing",
    titleAccent: "a single order.",
    subtitle:
      "An online storefront you share with one link, and every order tracked from the first message to the payment in hand.",
    ctaPrimary: "Create my storefront free",
    ctaSecondary: "See a storefront",
    trust: ["Free to start", "No credit card", "Online in 5 minutes"],
    orderPaid: "Paid",
    orderCode: "Code 2842",
    onDelivery: "on delivery",
  },
  shop: {
    open: "Open · 7am–7pm · Delmas 31",
    product1: "Fresh eggs",
    product2: "Whole bread",
    delivery: "Delmas delivery",
    send: "Send",
  },
  proof: { label: "Already selling with CONVERZA" },
  how: {
    eyebrow: "How it works",
    title: "Three steps, and you are selling",
    subtitle: "You install nothing, and neither do your customers. Everything runs on a link and WhatsApp.",
    steps: [
      {
        title: "You build your storefront",
        body: "Business name, photos, prices, delivery zones. You get your own address, like converza.ht/b/your-shop.",
      },
      {
        title: "You share the link",
        body: "In your WhatsApp status, your TikTok bio, your ads. The customer installs nothing and creates no account.",
      },
      {
        title: "The order arrives written",
        body: "On your usual WhatsApp, with the items, delivery fee, total and pickup code. You retype nothing.",
      },
    ],
  },
  pipeline: {
    eyebrow: "Order tracking",
    title: "Every order knows where it stands",
    subtitle:
      "Seven stages, from the request through to collection. You see what is left to do without having to remember it.",
    boardTitle: "Orders",
    inProgress: "in progress",
    thisWeek: "This week",
    toCollect: "to collect",
    columns: ["Request", "Contact", "Payment", "Confirmed", "On the way", "Delivered", "Follow-up"],
    remains: "Owing",
    code: "Code 2842",
  },
  message: {
    eyebrow: "No paid API",
    title: "Your WhatsApp number, the one your customers already know",
    body: "CONVERZA uses no billed WhatsApp API and does not ask you to change numbers. The link simply opens the conversation with the message already written.",
    points: [
      "No risk of your account being blocked",
      "No WhatsApp Business subscription to buy",
      "Works on an entry-level phone",
    ],
    receivedOn: "Received on your WhatsApp",
    langNote: "The message is written in the language your customer picked: French, Creole or English.",
    text: "Hello Ti Kòk Boutik! I would like to order:\n• 1× Whole bread (unit) — 155 HTG\n• 1× Fresh eggs (dozen) — 180 HTG\nDelivery (Delmas): 50 HTG\nTotal: 385 HTG",
  },
  features: {
    eyebrow: "What's included",
    title: "Everything a shop needs in order to sell",
    items: [
      { title: "Product catalogue", body: "Photos, prices, units, categories. Import your list from an Excel file." },
      { title: "Stock tracking", body: "An alert threshold per product and a flag on items close to running out." },
      { title: "Payment methods", body: "MonCash, Natcash, cash on delivery, bank transfer, Zelle, USDT." },
      { title: "Pickup code", body: "A four-digit code per order. Without the code, the parcel does not leave." },
      { title: "Team accounts", body: "Till, sales, delivery, customer service. Each person sees only their own work." },
      { title: "Sales reports", body: "Weekly revenue, amounts to collect, best sellers, Excel export." },
    ],
  },
  sectors: {
    eyebrow: "Who it is for",
    title: "Eleven sectors, one tool",
    body: "CONVERZA does more than change colour: the storefront, the wording, the categories and the team roles all adjust to the trade you actually practise.",
    names: {
      commerce_vente: "Retail & Sales",
      restauration: "Food & Restaurants",
      immobilier: "Property & Management",
      automobile: "Automotive & Services",
      sante_bienetre: "Health & Wellbeing",
      beaute_services: "Beauty & Personal services",
      education: "Education & Training",
      services_pros: "Professional services",
      construction: "Construction & Housing",
      digital_tech: "Digital & Technology",
      grossistes_distribution: "Wholesale & Distribution",
    },
    count: "{secteurs} sectors · {metiers} trades already set up",
    trades: "{n} trades",
    trade: "1 trade",
  },
  resto: {
    eyebrow: "For restaurants",
    title: "Menu QR Express, a separate offer",
    body: "One QR table tent per table, a visual menu the guest browses on their phone, and the order landing in the kitchen with the table number.",
    cta: "See the offer",
    price: "1 000 HTG / month",
    tables: "up to 25 tables",
    scan: "Scan to order",
    table: "Table 05",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Start free, pay once you are selling",
    note: "Prices in gourdes, per month. Cancel any time.",
    mostChosen: "Most chosen",
    perMonth: "HTG / month",
    currency: "HTG",
  },
  faq: {
    eyebrow: "Common questions",
    title: "Before you start",
    items: [
      {
        q: "Do I have to change my WhatsApp number?",
        a: "No. Orders arrive on the number you already use, in the WhatsApp app you know.",
      },
      {
        q: "Do my customers have to install anything?",
        a: "No. They open your link in their browser, choose, and the message goes to your WhatsApp. No account to create.",
      },
      {
        q: "How do I pay for the subscription?",
        a: "By MonCash, Natcash or bank transfer. You send the payment reference, and the plan is activated after verification.",
      },
      {
        q: "What happens if I stop paying?",
        a: "Your account returns to the Free plan. Your storefront and catalogue stay online, you only lose the paid features.",
      },
    ],
  },
  finalCta: {
    title: "Your storefront can be online today",
    body: "Enter your business name, add three products, share the link.",
    primary: "Create my free account",
    secondary: "Talk to someone",
  },
  footer: {
    tagline: "WhatsApp sales and customer management, for shops in Haiti.",
    productCol: "Product",
    companyCol: "Company",
    languageCol: "Language",
    productLinks: ["Storefront", "Orders", "QR Menu"],
    companyLinks: ["Pricing", "Terms of use", "Privacy"],
    rights: "© 2026 CONVERZA",
    city: "Port-au-Prince, Haiti",
  },
};

export const LANDING_COPY: Record<Language, LandingCopy> = { fr, ht, en };

export function landingCopy(language: Language): LandingCopy {
  return LANDING_COPY[language] ?? LANDING_COPY.fr;
}
