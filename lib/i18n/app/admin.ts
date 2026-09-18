import type { Language } from "../translations";

// Console super-admin CONVERZA (plateforme), en français, kreyòl et anglais.
export interface AdminCopy {
  header: { title: string; subtitle: string; signOut: string };
  tabs: { overview: string; merchants: string; billing: string; qrMenu: string; platform: string; security: string };
  alerts: {
    title: string;
    duplicates: (n: number) => string;
    pending: (n: number) => string;
    expired: (n: number) => string;
    expiringSoon: (n: number) => string;
  };
  kpis: {
    mrr: string;
    mrrHint: string;
    gmv: string;
    gmvHint: string;
    merchants: string;
    newThisMonth: (n: number) => string;
    conversion: string;
    conversionHint: (n: number) => string;
    expiringSoon: string;
    expiringSoonHint: string;
    pending: string;
    pendingHint: string;
  };
  growth: { signups: string; signupsHint: string; planSplit: string; mrrByPlan: string; noRevenue: string };
  merchants: {
    title: string;
    search: string;
    none: string;
    exportCsv: string;
    filterPlan: string;
    allPlans: string;
    filterStatus: string;
    status: { all: string; active: string; expired: string; free: string };
    sort: string;
    sortBy: { recent: string; gmv: string; orders: string; name: string };
    owner: string;
    noOwner: string;
    lastOrder: string;
    never: string;
    joined: string;
    activeUntil: (date: string) => string;
    expiredSince: (date: string) => string;
    noSubscription: string;
    stats: { products: string; orders: string; agents: string; gmv: string; collected: string };
    renew: string;
    renewMonths: (n: number) => string;
    renewed: (date: string) => string;
    revoke: string;
    cockpit: string;
    storefront: string;
    changePlan: string;
  };
  billing: {
    pendingTitle: string;
    noPending: string;
    activate: string;
    reject: string;
    duplicateBadge: string;
    duplicateHint: string;
    reference: (ref: string) => string;
    historyTitle: string;
    noHistory: string;
    statuses: { confirmed: string; rejected: string; pending: string };
    platformTitle: string;
    platformHint: string;
    notConfigured: string;
    moncashNumber: string;
    natcashNumber: string;
    qrUpload: string;
    qrReady: string;
    qrRemove: string;
    noQr: string;
    banksTitle: string;
    addBank: string;
    noBank: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    accountHolder: string;
    removeBank: string;
    zelle: string;
    usdt: string;
    savePayments: string;
    plansTitle: string;
    plansHint: string;
    planPrice: string;
    planTagline: string;
    planFeatures: string;
    planFeaturesHint: string;
    savePlan: (name: string) => string;
    free: string;
    perMonth: string;
  };
  qr: {
    title: string;
    subtitle: string;
    priceTitle: string;
    priceHint: string;
    syncPrice: string;
    synced: (price: string) => string;
    kpis: { restaurants: string; restaurantsHint: (n: number) => string; mrr: string; mrrHint: string; orders: string; ordersHint: string; gmv: string; gmvHint: string };
    search: string;
    showing: (shown: number, total: number) => string;
    none: string;
    tableLimit: string;
    testTable: (n: number) => string;
    printCards: string;
    dishes: string;
    orders: string;
  };
  platform: {
    title: string;
    subtitle: string;
    saveAll: string;
    designsTitle: string;
    designsHint: string;
    minPlan: (plan: string) => string;
    enabled: string;
    disabled: string;
    minPlanLabel: string;
    alwaysOn: string;
    previewButton: string;
    previewTitle: string;
    previewOn: string;
    phone: string;
    desktop: string;
    openTab: string;
    noMerchant: string;
    imagesTitle: string;
    ratiosLabel: string;
    maxSize: string;
    quality: (q: number) => string;
    languagesTitle: string;
    languagesHint: string;
    defaultBadge: string;
    available: string;
    unavailable: string;
    payMethodsTitle: string;
    payMethodsHint: string;
    flagsTitle: string;
    flagsHint: string;
    flags: {
      aiAssistant: { label: string; desc: string };
      antiFraud: { label: string; desc: string };
      autoReminders: { label: string; desc: string };
      exports: { label: string; desc: string };
      maintenance: { label: string; desc: string };
    };
    qrServiceTitle: string;
    qrServiceStatus: string;
    qrServiceStatusHint: string;
    qrServicePrice: string;
    qrServicePriceHint: string;
    tableLimitsTitle: string;
    kitchenNotes: string;
    whatsappDirect: string;
    on: string;
    off: string;
    saved: string;
  };
  security: {
    title: string;
    subtitle: string;
    checksTitle: string;
    checks: {
      serviceRole: { label: string; desc: string };
      adminEmails: { label: string; desc: (n: number) => string };
      inviteSecret: { label: string; desc: string };
      siteUrl: { label: string; desc: string };
      auditTable: { label: string; desc: string };
      statsView: { label: string; desc: string };
      extendedStats: { label: string; desc: string };
    };
    ok: string;
    missing: string;
    migrationHint: string;
    fraudTitle: string;
    fraudHint: string;
    noFraud: string;
    auditTitle: string;
    auditHint: string;
    noAudit: string;
    actions: Record<string, string>;
  };
  cockpit: {
    title: string;
    idLine: (id: string, slug: string) => string;
    openStorefront: string;
    tabs: { structure: string; media: string; reports: string; tables: string; raw: string };
    structure: {
      name: string;
      slug: string;
      slugHint: string;
      phone: string;
      sector: string;
      layout: string;
      theme: string;
      currency: string;
      category: string;
      address: string;
      hours: string;
      instagram: string;
      facebook: string;
      tiktok: string;
      save: string;
      saved: string;
    };
    media: {
      title: string;
      desc: string;
      run: string;
      running: string;
      done: (n: number) => string;
      logoUrl: string;
      coverUrl: string;
    };
    reports: { title: string; desc: string; csv: string; json: string };
    tables: { title: string; desc: string };
    raw: string;
    footer: string;
    close: string;
    error: (message: string) => string;
  };
  notice: {
    noSupabase: { title: string; body: string };
    forbidden: { title: string; body: string };
    noServiceKey: { title: string; body: string };
  };
}

const fr: AdminCopy = {
  header: { title: "Console CONVERZA", subtitle: "Supervision de la plateforme et des abonnements", signOut: "Se déconnecter" },
  tabs: { overview: "Vue d'ensemble", merchants: "Marchands", billing: "Abonnements", qrMenu: "Menu QR", platform: "Plateforme", security: "Sécurité" },
  alerts: {
    title: "À traiter",
    duplicates: (n) => `${n} paiement${n > 1 ? "s" : ""} avec une référence déjà utilisée`,
    pending: (n) => `${n} paiement${n > 1 ? "s" : ""} en attente de vérification`,
    expired: (n) => `${n} abonnement${n > 1 ? "s" : ""} expiré${n > 1 ? "s" : ""}`,
    expiringSoon: (n) => `${n} abonnement${n > 1 ? "s" : ""} expire${n > 1 ? "nt" : ""} sous 7 jours`,
  },
  kpis: {
    mrr: "Revenu mensuel récurrent",
    mrrHint: "Abonnements payants encore actifs",
    gmv: "Volume de ventes",
    gmvHint: "Total des commandes des marchands",
    merchants: "Marchands",
    newThisMonth: (n) => `+${n} ce mois-ci`,
    conversion: "Conversion payante",
    conversionHint: (n) => `${n} abonnement${n > 1 ? "s" : ""} actif${n > 1 ? "s" : ""}`,
    expiringSoon: "Expirent sous 7 jours",
    expiringSoonHint: "À relancer avant la coupure",
    pending: "Paiements en attente",
    pendingHint: "En file de vérification",
  },
  growth: {
    signups: "Inscriptions",
    signupsHint: "8 dernières semaines",
    planSplit: "Répartition des plans",
    mrrByPlan: "Revenu par plan",
    noRevenue: "Aucun abonnement payant actif.",
  },
  merchants: {
    title: "Marchands",
    search: "Rechercher par nom ou adresse de boutique…",
    none: "Aucun marchand ne correspond.",
    exportCsv: "Exporter en CSV",
    filterPlan: "Plan",
    allPlans: "Tous les plans",
    filterStatus: "Statut",
    status: { all: "Tous", active: "Abonnement actif", expired: "Expiré", free: "Gratuit" },
    sort: "Trier par",
    sortBy: { recent: "Inscription récente", gmv: "Volume de ventes", orders: "Commandes", name: "Nom" },
    owner: "Propriétaire",
    noOwner: "Adresse inconnue",
    lastOrder: "Dernière commande",
    never: "Aucune commande",
    joined: "Inscrit le",
    activeUntil: (date) => `Actif jusqu'au ${date}`,
    expiredSince: (date) => `Expiré depuis le ${date}`,
    noSubscription: "Plan gratuit",
    stats: { products: "Produits", orders: "Commandes", agents: "Agents", gmv: "Ventes", collected: "Encaissé" },
    renew: "Prolonger",
    renewMonths: (n) => `+${n} mois`,
    renewed: (date) => `Abonnement prolongé jusqu'au ${date}.`,
    revoke: "Repasser en gratuit",
    cockpit: "Fiche technique",
    storefront: "Voir la vitrine",
    changePlan: "Changer de plan",
  },
  billing: {
    pendingTitle: "Paiements à vérifier",
    noPending: "Aucun paiement en attente.",
    activate: "Activer le plan",
    reject: "Rejeter",
    duplicateBadge: "Référence déjà vue",
    duplicateHint: "Cette référence de transaction a déjà été soumise. Vérifiez avant d'activer.",
    reference: (ref) => `réf. ${ref}`,
    historyTitle: "Historique des paiements",
    noHistory: "Aucun paiement traité pour le moment.",
    statuses: { confirmed: "Confirmé", rejected: "Rejeté", pending: "En attente" },
    platformTitle: "Encaissement des abonnements",
    platformHint: "Ces coordonnées s'affichent aux marchands sur la page Abonnement.",
    notConfigured: "Aucune coordonnée enregistrée : vos marchands ne voient aucun moyen de payer leur abonnement.",
    moncashNumber: "Numéro MonCash",
    natcashNumber: "Numéro NatCash",
    qrUpload: "Image du QR code",
    qrReady: "QR code enregistré",
    qrRemove: "Retirer l'image",
    noQr: "Aucune image de QR code.",
    banksTitle: "Comptes bancaires CONVERZA",
    addBank: "Ajouter un compte",
    noBank: "Aucun compte bancaire enregistré.",
    bankName: "Banque",
    accountNumber: "Numéro de compte",
    currency: "Devise",
    accountHolder: "Titulaire",
    removeBank: "Retirer",
    zelle: "Zelle (e-mail)",
    usdt: "Adresse USDT (TRC-20)",
    savePayments: "Enregistrer les coordonnées",
    plansTitle: "Tarifs et contenu des plans",
    plansHint: "Modifiés ici, les prix changent aussitôt sur la page d'accueil et la page Abonnement.",
    planPrice: "Prix mensuel (HTG)",
    planTagline: "Phrase d'accroche",
    planFeatures: "Fonctionnalités incluses",
    planFeaturesHint: "Séparez chaque ligne par une virgule.",
    savePlan: (name) => `Enregistrer le plan ${name}`,
    free: "Gratuit",
    perMonth: "/ mois",
  },
  qr: {
    title: "Menu QR Express",
    subtitle: "Suivi des restaurants, bars et cafétérias équipés de QR codes de table.",
    priceTitle: "Tarif mensuel du service",
    priceHint: "Le montant se répercute sur la page d'accueil et sur la page Abonnement.",
    syncPrice: "Enregistrer le tarif",
    synced: (price) => `Tarif mis à jour : ${price} par mois.`,
    kpis: {
      restaurants: "Établissements",
      restaurantsHint: (n) => `${n} abonné${n > 1 ? "s" : ""} au service`,
      mrr: "Revenu du service",
      mrrHint: "Abonnements Menu QR actifs",
      orders: "Commandes",
      ordersHint: "Toutes commandes de ces établissements",
      gmv: "Volume de ventes",
      gmvHint: "Total encaissable",
    },
    search: "Rechercher un établissement…",
    showing: (shown, total) => `${shown} sur ${total}`,
    none: "Aucun établissement de restauration pour le moment.",
    tableLimit: "Tables incluses",
    testTable: (n) => `Tester la table ${n}`,
    printCards: "Imprimer les chevalets",
    dishes: "Plats",
    orders: "Commandes",
  },
  platform: {
    title: "Réglages de la plateforme",
    subtitle: "Designs, images, langues, moyens de paiement et fonctionnalités proposés aux marchands.",
    saveAll: "Enregistrer",
    designsTitle: "Mises en page de vitrine",
    designsHint: "Chaque disposition montre un nombre fixe d'images ; les autres produits restent dans le catalogue complet.",
    minPlan: (plan) => `Plan minimum : ${plan}`,
    enabled: "Disponible",
    disabled: "Désactivée",
    minPlanLabel: "Plan minimum",
    alwaysOn: "Disposition de base, toujours disponible",
    previewButton: "Voir l'aperçu",
    previewTitle: "Aperçu des dispositions",
    previewOn: "Vitrine utilisée",
    phone: "Téléphone",
    desktop: "Ordinateur",
    openTab: "Ouvrir dans un onglet",
    noMerchant: "Aucune vitrine à afficher pour l'instant.",
    imagesTitle: "Images des vitrines",
    ratiosLabel: "Formats autorisés",
    maxSize: "Taille maximale par image (Mo)",
    quality: (q) => `Qualité de compression (${q} %)`,
    languagesTitle: "Langues",
    languagesHint: "Langues proposées dans l'application et sur les vitrines.",
    defaultBadge: "Par défaut",
    available: "Disponible",
    unavailable: "Désactivée",
    payMethodsTitle: "Moyens de paiement autorisés",
    payMethodsHint: "Ce qu'un marchand peut activer dans ses réglages.",
    flagsTitle: "Fonctionnalités",
    flagsHint: "Interrupteurs globaux de la plateforme.",
    flags: {
      aiAssistant: { label: "Assistant et alertes de stock", desc: "Suggestions automatiques sur le tableau de bord" },
      antiFraud: { label: "Contrôle des références de paiement", desc: "Signale une référence de transaction réutilisée" },
      autoReminders: { label: "Relances WhatsApp", desc: "Messages de relance en un clic" },
      exports: { label: "Exports CSV et PDF", desc: "Rapports téléchargeables par les marchands" },
      maintenance: { label: "Mode maintenance", desc: "Ferme les vitrines sauf pour les administrateurs" },
    },
    qrServiceTitle: "Service Menu QR",
    qrServiceStatus: "Service proposé aux restaurants",
    qrServiceStatusHint: "Offre autonome, facturée séparément",
    qrServicePrice: "Tarif mensuel (HTG)",
    qrServicePriceHint: "Pour un restaurant qui n'utilise que le menu sur table.",
    tableLimitsTitle: "Nombre de tables par plan",
    kitchenNotes: "Notes pour la cuisine",
    whatsappDirect: "Envoi direct sur WhatsApp",
    on: "Activé",
    off: "Désactivé",
    saved: "Réglages enregistrés.",
  },
  security: {
    title: "Sécurité et configuration",
    subtitle: "Ce que la console peut réellement vérifier sur cette installation.",
    checksTitle: "État de la configuration",
    checks: {
      serviceRole: { label: "Clé de service Supabase", desc: "Nécessaire à cette console" },
      adminEmails: { label: "Comptes super-admin", desc: (n) => `${n} adresse${n > 1 ? "s" : ""} autorisée${n > 1 ? "s" : ""} (ADMIN_EMAILS)` },
      inviteSecret: { label: "Signature des invitations", desc: "INVITE_SECRET : sans elle, aucun lien d'agent n'est signé" },
      siteUrl: { label: "Adresse publique du site", desc: "NEXT_PUBLIC_SITE_URL, utilisée dans les liens envoyés aux clients" },
      auditTable: { label: "Journal d'audit", desc: "Table security_audit_logs accessible" },
      statsView: { label: "Statistiques marchands", desc: "Vue admin_business_stats accessible" },
      extendedStats: { label: "Activité des marchands", desc: "Dernière commande et montant encaissé (migration 3)" },
    },
    ok: "En place",
    missing: "Manquant",
    migrationHint: "Exécutez db/migrate-2026-3-admin.sql dans Supabase pour activer les colonnes manquantes.",
    fraudTitle: "Références de paiement réutilisées",
    fraudHint: "Un même numéro de transaction soumis pour plusieurs abonnements.",
    noFraud: "Aucune référence suspecte.",
    auditTitle: "Journal des actions administrateur",
    auditHint: "50 dernières actions, dans l'ordre le plus récent.",
    noAudit: "Aucune action enregistrée pour le moment.",
    actions: {
      ACTIVATE_PLAN: "Plan activé",
      SET_PLAN: "Plan modifié",
      RENEW_PLAN: "Abonnement prolongé",
      REJECT_PAYMENT: "Paiement rejeté",
      REVOKE_PLAN: "Plan révoqué",
      UPGRADE_PLAN: "Plan augmenté",
      UPDATE_PLAN_CONFIG: "Tarif de plan modifié",
      UPDATE_PAYMENT_INFO: "Coordonnées de paiement modifiées",
      UPDATE_PLATFORM_SETTINGS: "Réglages plateforme modifiés",
      UPDATE_MERCHANT: "Fiche marchand modifiée",
      REPAIR_MERCHANT_MEDIA: "Médias marchand normalisés",
      SECURITY_ALERT: "Alerte de sécurité",
    },
  },
  cockpit: {
    title: "Fiche technique",
    idLine: (id, slug) => `Identifiant ${id} · /b/${slug}`,
    openStorefront: "Ouvrir la vitrine du marchand",
    tabs: { structure: "Fiche boutique", media: "Photos", reports: "Exports", tables: "Tables QR", raw: "Données brutes" },
    structure: {
      name: "Nom de la boutique",
      slug: "Adresse de la vitrine",
      slugHint: "Change l'adresse publique : les liens déjà partagés cesseront de fonctionner.",
      phone: "Numéro WhatsApp",
      sector: "Secteur",
      layout: "Mise en page",
      theme: "Couleur",
      currency: "Devise",
      category: "Catégorie",
      address: "Adresse",
      hours: "Heures d'ouverture",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      save: "Enregistrer la fiche",
      saved: "Fiche enregistrée.",
    },
    media: {
      title: "Normaliser les photos",
      desc: "Recale la photo principale et la galerie d'un produit quand l'une des deux manque. Aucune image n'est ajoutée au catalogue.",
      run: "Lancer la normalisation",
      running: "Traitement…",
      done: (n) => (n === 0 ? "Aucune incohérence trouvée." : `${n} produit${n > 1 ? "s" : ""} corrigé${n > 1 ? "s" : ""}.`),
      logoUrl: "Adresse du logo",
      coverUrl: "Adresse de la bannière",
    },
    reports: {
      title: "Exports de support",
      desc: "Pour transmettre l'état d'un compte à un marchand ou garder une trace.",
      csv: "Exporter la fiche en CSV",
      json: "Télécharger les données brutes (JSON)",
    },
    tables: { title: "Tables et QR codes", desc: "Générer et imprimer les chevalets de ce marchand." },
    raw: "Enregistrement tel qu'il est stocké",
    footer: "Chaque action est enregistrée dans le journal d'audit.",
    close: "Fermer",
    error: (message) => `Échec : ${message}`,
  },
  notice: {
    noSupabase: { title: "Console indisponible", body: "Supabase n'est pas configuré sur cet environnement." },
    forbidden: { title: "Accès refusé", body: "Cette page est réservée aux super-administrateurs CONVERZA." },
    noServiceKey: {
      title: "Configuration incomplète",
      body: "Ajoutez SUPABASE_SERVICE_ROLE_KEY aux variables d'environnement (Vercel et .env.local).",
    },
  },
};

const ht: AdminCopy = {
  header: { title: "Konsòl CONVERZA", subtitle: "Sipèvizyon plataform lan ak abònman yo", signOut: "Dekonekte" },
  tabs: { overview: "Apèsi", merchants: "Machann", billing: "Abònman", qrMenu: "Meni QR", platform: "Plataform", security: "Sekirite" },
  alerts: {
    title: "Pou trete",
    duplicates: (n) => `${n} pèman ak yon referans ki deja sèvi`,
    pending: (n) => `${n} pèman k ap tann verifikasyon`,
    expired: (n) => `${n} abònman ki ekspire`,
    expiringSoon: (n) => `${n} abònman ap ekspire nan 7 jou`,
  },
  kpis: {
    mrr: "Revni chak mwa",
    mrrHint: "Abònman peye ki toujou aktif",
    gmv: "Volim vant",
    gmvHint: "Total kòmand machann yo",
    merchants: "Machann",
    newThisMonth: (n) => `+${n} mwa sa a`,
    conversion: "Konvèsyon peye",
    conversionHint: (n) => `${n} abònman aktif`,
    expiringSoon: "Ap ekspire nan 7 jou",
    expiringSoonHint: "Pou relanse anvan koupi",
    pending: "Pèman k ap tann",
    pendingHint: "Nan liy verifikasyon",
  },
  growth: {
    signups: "Enskripsyon",
    signupsHint: "8 dènye semèn",
    planSplit: "Repatisyon plan yo",
    mrrByPlan: "Revni pa plan",
    noRevenue: "Pa gen abònman peye ki aktif.",
  },
  merchants: {
    title: "Machann",
    search: "Chèche pa non oswa adrès boutik…",
    none: "Pa gen machann ki koresponn.",
    exportCsv: "Eksporte an CSV",
    filterPlan: "Plan",
    allPlans: "Tout plan",
    filterStatus: "Estati",
    status: { all: "Tout", active: "Abònman aktif", expired: "Ekspire", free: "Gratis" },
    sort: "Klase pa",
    sortBy: { recent: "Enskripsyon resan", gmv: "Volim vant", orders: "Kòmand", name: "Non" },
    owner: "Pwopriyetè",
    noOwner: "Adrès pa konnen",
    lastOrder: "Dènye kòmand",
    never: "Pa gen kòmand",
    joined: "Enskri",
    activeUntil: (date) => `Aktif jiska ${date}`,
    expiredSince: (date) => `Ekspire depi ${date}`,
    noSubscription: "Plan gratis",
    stats: { products: "Pwodwi", orders: "Kòmand", agents: "Ajan", gmv: "Vant", collected: "Ki antre" },
    renew: "Pwolonje",
    renewMonths: (n) => `+${n} mwa`,
    renewed: (date) => `Abònman pwolonje jiska ${date}.`,
    revoke: "Tounen sou gratis",
    cockpit: "Fich teknik",
    storefront: "Wè vitrin nan",
    changePlan: "Chanje plan",
  },
  billing: {
    pendingTitle: "Pèman pou verifye",
    noPending: "Pa gen pèman k ap tann.",
    activate: "Aktive plan an",
    reject: "Rejte",
    duplicateBadge: "Referans deja wè",
    duplicateHint: "Referans tranzaksyon sa a deja soumèt. Verifye anvan w aktive.",
    reference: (ref) => `ref. ${ref}`,
    historyTitle: "Istorik pèman yo",
    noHistory: "Pa gen pèman ki trete pou kounye a.",
    statuses: { confirmed: "Konfime", rejected: "Rejte", pending: "K ap tann" },
    platformTitle: "Kote abònman yo peye",
    platformHint: "Enfòmasyon sa yo parèt bay machann yo sou paj Abònman an.",
    notConfigured: "Pa gen okenn kowòdone ki anrejistre : machann ou yo pa wè okenn mwayen pou peye abònman an.",
    moncashNumber: "Nimewo MonCash",
    natcashNumber: "Nimewo NatCash",
    qrUpload: "Imaj QR kòd la",
    qrReady: "QR kòd anrejistre",
    qrRemove: "Retire imaj la",
    noQr: "Pa gen imaj QR kòd.",
    banksTitle: "Kont labank CONVERZA",
    addBank: "Ajoute yon kont",
    noBank: "Pa gen kont labank ki anrejistre.",
    bankName: "Bank",
    accountNumber: "Nimewo kont",
    currency: "Deviz",
    accountHolder: "Titilè",
    removeBank: "Retire",
    zelle: "Zelle (imèl)",
    usdt: "Adrès USDT (TRC-20)",
    savePayments: "Anrejistre enfòmasyon yo",
    plansTitle: "Pri ak kontni plan yo",
    plansHint: "Lè w chanje yo isit, pri a chanje tousuit sou paj akèy la ak paj Abònman an.",
    planPrice: "Pri chak mwa (HTG)",
    planTagline: "Fraz akwoch",
    planFeatures: "Sa ki enkli",
    planFeaturesHint: "Separe chak liy ak yon vigil.",
    savePlan: (name) => `Anrejistre plan ${name}`,
    free: "Gratis",
    perMonth: "/ mwa",
  },
  qr: {
    title: "Meni QR Express",
    subtitle: "Swivi restoran, bar ak kafeterya ki gen QR kòd sou tab yo.",
    priceTitle: "Pri sèvis la chak mwa",
    priceHint: "Montan an parèt sou paj akèy la ak sou paj Abònman an.",
    syncPrice: "Anrejistre pri a",
    synced: (price) => `Pri a mete ajou : ${price} chak mwa.`,
    kpis: {
      restaurants: "Etablisman",
      restaurantsHint: (n) => `${n} abònman sou sèvis la`,
      mrr: "Revni sèvis la",
      mrrHint: "Abònman Meni QR aktif",
      orders: "Kòmand",
      ordersHint: "Tout kòmand etablisman sa yo",
      gmv: "Volim vant",
      gmvHint: "Total ki ka antre",
    },
    search: "Chèche yon etablisman…",
    showing: (shown, total) => `${shown} sou ${total}`,
    none: "Pa gen etablisman restorasyon pou kounye a.",
    tableLimit: "Tab ki enkli",
    testTable: (n) => `Teste tab ${n}`,
    printCards: "Enprime chevalèt yo",
    dishes: "Plat",
    orders: "Kòmand",
  },
  platform: {
    title: "Reglaj plataform lan",
    subtitle: "Mizanpaj, imaj, lang, mwayen pèman ak fonksyon ki ofri bay machann yo.",
    saveAll: "Anrejistre",
    designsTitle: "Mizanpaj vitrin yo",
    designsHint: "Chak mizanpaj montre yon kantite imaj fiks ; lòt pwodui yo rete nan katalòg konplè a.",
    minPlan: (plan) => `Plan minimòm : ${plan}`,
    enabled: "Disponib",
    disabled: "Dezaktive",
    minPlanLabel: "Plan minimòm",
    alwaysOn: "Mizanpaj debaz, toujou disponib",
    previewButton: "Wè apèsi a",
    previewTitle: "Apèsi mizanpaj yo",
    previewOn: "Vitrin pou apèsi a",
    phone: "Telefòn",
    desktop: "Òdinatè",
    openTab: "Louvri nan yon lòt onglè",
    noMerchant: "Poko gen vitrin pou montre.",
    imagesTitle: "Imaj vitrin yo",
    ratiosLabel: "Fòma ki otorize",
    maxSize: "Gwosè maksimòm pou chak imaj (Mo)",
    quality: (q) => `Kalite konpresyon (${q} %)`,
    languagesTitle: "Lang",
    languagesHint: "Lang ki ofri nan aplikasyon an ak sou vitrin yo.",
    defaultBadge: "Pa defo",
    available: "Disponib",
    unavailable: "Dezaktive",
    payMethodsTitle: "Mwayen pèman ki otorize",
    payMethodsHint: "Sa yon machann ka aktive nan reglaj li.",
    flagsTitle: "Fonksyon",
    flagsHint: "Bouton global plataform lan.",
    flags: {
      aiAssistant: { label: "Asistan ak alèt stòk", desc: "Sijesyon otomatik sou tablo a" },
      antiFraud: { label: "Kontwòl referans pèman", desc: "Siyale yon referans tranzaksyon ki repete" },
      autoReminders: { label: "Relans WhatsApp", desc: "Mesaj relans an yon klik" },
      exports: { label: "Ekspò CSV ak PDF", desc: "Rapò machann yo ka telechaje" },
      maintenance: { label: "Mòd antretyen", desc: "Fèmen vitrin yo sof pou administratè yo" },
    },
    qrServiceTitle: "Sèvis Meni QR",
    qrServiceStatus: "Sèvis ki ofri bay restoran yo",
    qrServiceStatusHint: "Òf apa, faktire separeman",
    qrServicePrice: "Pri chak mwa (HTG)",
    qrServicePriceHint: "Pou yon restoran ki sèvi sèlman ak meni sou tab la.",
    tableLimitsTitle: "Kantite tab pa plan",
    kitchenNotes: "Nòt pou kwizin nan",
    whatsappDirect: "Voye dirèk sou WhatsApp",
    on: "Aktive",
    off: "Dezaktive",
    saved: "Reglaj yo anrejistre.",
  },
  security: {
    title: "Sekirite ak konfigirasyon",
    subtitle: "Sa konsòl la ka reyèlman verifye sou enstalasyon sa a.",
    checksTitle: "Eta konfigirasyon an",
    checks: {
      serviceRole: { label: "Kle sèvis Supabase", desc: "Konsòl sa a bezwen li" },
      adminEmails: { label: "Kont super-admin", desc: (n) => `${n} adrès otorize (ADMIN_EMAILS)` },
      inviteSecret: { label: "Siyati envitasyon yo", desc: "INVITE_SECRET : san li, okenn lyen ajan pa siyen" },
      siteUrl: { label: "Adrès piblik sit la", desc: "NEXT_PUBLIC_SITE_URL, ki sèvi nan lyen kliyan yo resevwa" },
      auditTable: { label: "Jounal odit", desc: "Tab security_audit_logs aksesib" },
      statsView: { label: "Estatistik machann", desc: "Vi admin_business_stats aksesib" },
      extendedStats: { label: "Aktivite machann", desc: "Dènye kòmand ak lajan ki antre (migrasyon 3)" },
    },
    ok: "An plas",
    missing: "Manke",
    migrationHint: "Egzekite db/migrate-2026-3-admin.sql nan Supabase pou aktive kolòn ki manke yo.",
    fraudTitle: "Referans pèman ki repete",
    fraudHint: "Yon menm nimewo tranzaksyon soumèt pou plizyè abònman.",
    noFraud: "Pa gen referans sispèk.",
    auditTitle: "Jounal aksyon administratè",
    auditHint: "50 dènye aksyon yo, pi resan an anwo.",
    noAudit: "Pa gen aksyon ki anrejistre pou kounye a.",
    actions: {
      ACTIVATE_PLAN: "Plan aktive",
      SET_PLAN: "Plan chanje",
      RENEW_PLAN: "Abònman pwolonje",
      REJECT_PAYMENT: "Pèman rejte",
      REVOKE_PLAN: "Plan retire",
      UPGRADE_PLAN: "Plan monte",
      UPDATE_PLAN_CONFIG: "Pri plan chanje",
      UPDATE_PAYMENT_INFO: "Enfòmasyon pèman chanje",
      UPDATE_PLATFORM_SETTINGS: "Reglaj plataform chanje",
      UPDATE_MERCHANT: "Fich machann chanje",
      REPAIR_MERCHANT_MEDIA: "Medya machann normalize",
      SECURITY_ALERT: "Alèt sekirite",
    },
  },
  cockpit: {
    title: "Fich teknik",
    idLine: (id, slug) => `Idantifyan ${id} · /b/${slug}`,
    openStorefront: "Ouvri vitrin machann nan",
    tabs: { structure: "Fich boutik", media: "Foto", reports: "Ekspò", tables: "Tab QR", raw: "Done brit" },
    structure: {
      name: "Non boutik la",
      slug: "Adrès vitrin nan",
      slugHint: "Sa chanje adrès piblik la : lyen ki deja pataje yo p ap mache ankò.",
      phone: "Nimewo WhatsApp",
      sector: "Sektè",
      layout: "Mizanpaj",
      theme: "Koulè",
      currency: "Deviz",
      category: "Kategori",
      address: "Adrès",
      hours: "Lè louvri",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      save: "Anrejistre fich la",
      saved: "Fich la anrejistre.",
    },
    media: {
      title: "Normalize foto yo",
      desc: "Rekale foto prensipal la ak galri a lè youn nan de a manke. Nou pa ajoute okenn imaj nan katalòg la.",
      run: "Lanse normalizasyon an",
      running: "N ap trete…",
      done: (n) => (n === 0 ? "Pa gen pwoblèm ki jwenn." : `${n} pwodwi korije.`),
      logoUrl: "Adrès logo a",
      coverUrl: "Adrès banyè a",
    },
    reports: {
      title: "Ekspò pou sipò",
      desc: "Pou voye eta yon kont bay yon machann oswa kenbe yon tras.",
      csv: "Eksporte fich la an CSV",
      json: "Telechaje done brit yo (JSON)",
    },
    tables: { title: "Tab ak QR kòd", desc: "Kreye epi enprime chevalèt machann sa a." },
    raw: "Done yo jan yo estoke",
    footer: "Chak aksyon anrejistre nan jounal odit la.",
    close: "Fèmen",
    error: (message) => `Echèk : ${message}`,
  },
  notice: {
    noSupabase: { title: "Konsòl la pa disponib", body: "Supabase pa konfigire sou anviwonman sa a." },
    forbidden: { title: "Aksè refize", body: "Paj sa a se pou super-administratè CONVERZA sèlman." },
    noServiceKey: {
      title: "Konfigirasyon pa konplè",
      body: "Ajoute SUPABASE_SERVICE_ROLE_KEY nan varyab anviwonman yo (Vercel ak .env.local).",
    },
  },
};

const en: AdminCopy = {
  header: { title: "CONVERZA console", subtitle: "Platform and subscription oversight", signOut: "Sign out" },
  tabs: { overview: "Overview", merchants: "Merchants", billing: "Billing", qrMenu: "QR menu", platform: "Platform", security: "Security" },
  alerts: {
    title: "Needs attention",
    duplicates: (n) => `${n} payment${n > 1 ? "s" : ""} with an already-used reference`,
    pending: (n) => `${n} payment${n > 1 ? "s" : ""} awaiting verification`,
    expired: (n) => `${n} expired subscription${n > 1 ? "s" : ""}`,
    expiringSoon: (n) => `${n} subscription${n > 1 ? "s" : ""} expiring within 7 days`,
  },
  kpis: {
    mrr: "Monthly recurring revenue",
    mrrHint: "Paid subscriptions still active",
    gmv: "Sales volume",
    gmvHint: "Total merchant orders",
    merchants: "Merchants",
    newThisMonth: (n) => `+${n} this month`,
    conversion: "Paid conversion",
    conversionHint: (n) => `${n} active subscription${n > 1 ? "s" : ""}`,
    expiringSoon: "Expiring within 7 days",
    expiringSoonHint: "Follow up before the cut-off",
    pending: "Pending payments",
    pendingHint: "In the verification queue",
  },
  growth: {
    signups: "Sign-ups",
    signupsHint: "Last 8 weeks",
    planSplit: "Plan split",
    mrrByPlan: "Revenue per plan",
    noRevenue: "No active paid subscription.",
  },
  merchants: {
    title: "Merchants",
    search: "Search by name or storefront address…",
    none: "No merchant matches.",
    exportCsv: "Export as CSV",
    filterPlan: "Plan",
    allPlans: "All plans",
    filterStatus: "Status",
    status: { all: "All", active: "Active subscription", expired: "Expired", free: "Free" },
    sort: "Sort by",
    sortBy: { recent: "Recently joined", gmv: "Sales volume", orders: "Orders", name: "Name" },
    owner: "Owner",
    noOwner: "Email unknown",
    lastOrder: "Last order",
    never: "No orders",
    joined: "Joined",
    activeUntil: (date) => `Active until ${date}`,
    expiredSince: (date) => `Expired since ${date}`,
    noSubscription: "Free plan",
    stats: { products: "Products", orders: "Orders", agents: "Agents", gmv: "Sales", collected: "Collected" },
    renew: "Extend",
    renewMonths: (n) => `+${n} month${n > 1 ? "s" : ""}`,
    renewed: (date) => `Subscription extended to ${date}.`,
    revoke: "Move back to free",
    cockpit: "Account sheet",
    storefront: "View storefront",
    changePlan: "Change plan",
  },
  billing: {
    pendingTitle: "Payments to verify",
    noPending: "No pending payment.",
    activate: "Activate the plan",
    reject: "Reject",
    duplicateBadge: "Reference already seen",
    duplicateHint: "This transaction reference was submitted before. Check it before activating.",
    reference: (ref) => `ref. ${ref}`,
    historyTitle: "Payment history",
    noHistory: "No processed payment yet.",
    statuses: { confirmed: "Confirmed", rejected: "Rejected", pending: "Pending" },
    platformTitle: "Where subscriptions are paid",
    platformHint: "These details are shown to merchants on the Subscription page.",
    notConfigured: "No details saved: your merchants see no way to pay their subscription.",
    moncashNumber: "MonCash number",
    natcashNumber: "NatCash number",
    qrUpload: "QR code image",
    qrReady: "QR code saved",
    qrRemove: "Remove the image",
    noQr: "No QR code image.",
    banksTitle: "CONVERZA bank accounts",
    addBank: "Add an account",
    noBank: "No bank account saved.",
    bankName: "Bank",
    accountNumber: "Account number",
    currency: "Currency",
    accountHolder: "Account holder",
    removeBank: "Remove",
    zelle: "Zelle (email)",
    usdt: "USDT address (TRC-20)",
    savePayments: "Save payment details",
    plansTitle: "Plan pricing and content",
    plansHint: "Changed here, prices update right away on the home page and the Subscription page.",
    planPrice: "Monthly price (HTG)",
    planTagline: "Tagline",
    planFeatures: "Included features",
    planFeaturesHint: "Separate each line with a comma.",
    savePlan: (name) => `Save the ${name} plan`,
    free: "Free",
    perMonth: "/ month",
  },
  qr: {
    title: "QR Express menu",
    subtitle: "Tracking restaurants, bars and cafés running table QR codes.",
    priceTitle: "Monthly service price",
    priceHint: "The amount flows through to the home page and the Subscription page.",
    syncPrice: "Save the price",
    synced: (price) => `Price updated: ${price} per month.`,
    kpis: {
      restaurants: "Venues",
      restaurantsHint: (n) => `${n} subscribed to the service`,
      mrr: "Service revenue",
      mrrHint: "Active QR menu subscriptions",
      orders: "Orders",
      ordersHint: "All orders from these venues",
      gmv: "Sales volume",
      gmvHint: "Total collectable",
    },
    search: "Search for a venue…",
    showing: (shown, total) => `${shown} of ${total}`,
    none: "No food venue yet.",
    tableLimit: "Tables included",
    testTable: (n) => `Test table ${n}`,
    printCards: "Print table cards",
    dishes: "Dishes",
    orders: "Orders",
  },
  platform: {
    title: "Platform settings",
    subtitle: "Layouts, images, languages, payment methods and features offered to merchants.",
    saveAll: "Save",
    designsTitle: "Storefront layouts",
    designsHint: "Each layout shows a fixed number of images; other products stay in the full catalog.",
    minPlan: (plan) => `Minimum plan: ${plan}`,
    enabled: "Available",
    disabled: "Disabled",
    minPlanLabel: "Minimum plan",
    alwaysOn: "Base layout, always available",
    previewButton: "Preview",
    previewTitle: "Layout preview",
    previewOn: "Storefront used",
    phone: "Phone",
    desktop: "Desktop",
    openTab: "Open in a new tab",
    noMerchant: "No storefront to show yet.",
    imagesTitle: "Storefront images",
    ratiosLabel: "Allowed ratios",
    maxSize: "Maximum size per image (MB)",
    quality: (q) => `Compression quality (${q}%)`,
    languagesTitle: "Languages",
    languagesHint: "Languages offered in the app and on storefronts.",
    defaultBadge: "Default",
    available: "Available",
    unavailable: "Disabled",
    payMethodsTitle: "Allowed payment methods",
    payMethodsHint: "What a merchant can turn on in their settings.",
    flagsTitle: "Features",
    flagsHint: "Platform-wide switches.",
    flags: {
      aiAssistant: { label: "Assistant and stock alerts", desc: "Automatic suggestions on the dashboard" },
      antiFraud: { label: "Payment reference check", desc: "Flags a reused transaction reference" },
      autoReminders: { label: "WhatsApp follow-ups", desc: "One-click follow-up messages" },
      exports: { label: "CSV and PDF exports", desc: "Reports merchants can download" },
      maintenance: { label: "Maintenance mode", desc: "Closes storefronts except for administrators" },
    },
    qrServiceTitle: "QR menu service",
    qrServiceStatus: "Service offered to restaurants",
    qrServiceStatusHint: "Standalone offer, billed separately",
    qrServicePrice: "Monthly price (HTG)",
    qrServicePriceHint: "For a restaurant using only the table menu.",
    tableLimitsTitle: "Tables per plan",
    kitchenNotes: "Kitchen notes",
    whatsappDirect: "Send straight to WhatsApp",
    on: "On",
    off: "Off",
    saved: "Settings saved.",
  },
  security: {
    title: "Security and configuration",
    subtitle: "What the console can actually verify on this installation.",
    checksTitle: "Configuration status",
    checks: {
      serviceRole: { label: "Supabase service key", desc: "Required by this console" },
      adminEmails: { label: "Super-admin accounts", desc: (n) => `${n} allowed address${n > 1 ? "es" : ""} (ADMIN_EMAILS)` },
      inviteSecret: { label: "Invitation signing", desc: "INVITE_SECRET: without it, no agent link is signed" },
      siteUrl: { label: "Public site address", desc: "NEXT_PUBLIC_SITE_URL, used in links sent to customers" },
      auditTable: { label: "Audit log", desc: "security_audit_logs table reachable" },
      statsView: { label: "Merchant statistics", desc: "admin_business_stats view reachable" },
      extendedStats: { label: "Merchant activity", desc: "Last order and collected amount (migration 3)" },
    },
    ok: "In place",
    missing: "Missing",
    migrationHint: "Run db/migrate-2026-3-admin.sql in Supabase to enable the missing columns.",
    fraudTitle: "Reused payment references",
    fraudHint: "The same transaction number submitted for several subscriptions.",
    noFraud: "No suspicious reference.",
    auditTitle: "Administrator action log",
    auditHint: "Last 50 actions, newest first.",
    noAudit: "No action recorded yet.",
    actions: {
      ACTIVATE_PLAN: "Plan activated",
      SET_PLAN: "Plan changed",
      RENEW_PLAN: "Subscription extended",
      REJECT_PAYMENT: "Payment rejected",
      REVOKE_PLAN: "Plan revoked",
      UPGRADE_PLAN: "Plan upgraded",
      UPDATE_PLAN_CONFIG: "Plan pricing changed",
      UPDATE_PAYMENT_INFO: "Payment details changed",
      UPDATE_PLATFORM_SETTINGS: "Platform settings changed",
      UPDATE_MERCHANT: "Merchant record changed",
      REPAIR_MERCHANT_MEDIA: "Merchant media normalised",
      SECURITY_ALERT: "Security alert",
    },
  },
  cockpit: {
    title: "Account sheet",
    idLine: (id, slug) => `Id ${id} · /b/${slug}`,
    openStorefront: "Open the merchant storefront",
    tabs: { structure: "Store record", media: "Photos", reports: "Exports", tables: "QR tables", raw: "Raw data" },
    structure: {
      name: "Store name",
      slug: "Storefront address",
      slugHint: "Changes the public address: links already shared will stop working.",
      phone: "WhatsApp number",
      sector: "Industry",
      layout: "Layout",
      theme: "Color",
      currency: "Currency",
      category: "Category",
      address: "Address",
      hours: "Opening hours",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      save: "Save the record",
      saved: "Record saved.",
    },
    media: {
      title: "Normalise photos",
      desc: "Realigns a product's main photo and gallery when one of the two is missing. No image is added to the catalog.",
      run: "Run the normalisation",
      running: "Working…",
      done: (n) => (n === 0 ? "No inconsistency found." : `${n} product${n > 1 ? "s" : ""} fixed.`),
      logoUrl: "Logo URL",
      coverUrl: "Banner URL",
    },
    reports: {
      title: "Support exports",
      desc: "To send a merchant their account status, or keep a record.",
      csv: "Export the record as CSV",
      json: "Download raw data (JSON)",
    },
    tables: { title: "Tables and QR codes", desc: "Generate and print this merchant's table cards." },
    raw: "Record as stored",
    footer: "Every action is written to the audit log.",
    close: "Close",
    error: (message) => `Failed: ${message}`,
  },
  notice: {
    noSupabase: { title: "Console unavailable", body: "Supabase is not configured on this environment." },
    forbidden: { title: "Access denied", body: "This page is for CONVERZA super-administrators only." },
    noServiceKey: {
      title: "Incomplete configuration",
      body: "Add SUPABASE_SERVICE_ROLE_KEY to the environment variables (Vercel and .env.local).",
    },
  },
};

export const ADMIN_COPY: Record<Language, AdminCopy> = { fr, ht, en };
