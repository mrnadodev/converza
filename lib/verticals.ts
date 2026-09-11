// Configuration par type de business : CONVERZA s'adapte à chaque secteur
// (vocabulaire, mise en page de la vitrine, catégories par défaut, rôles d'équipe autorisés).

export type IndustrySectorKey =
  | "commerce_vente"
  | "restauration"
  | "immobilier"
  | "automobile"
  | "sante_bienetre"
  | "beaute_services"
  | "education"
  | "services_pros"
  | "construction"
  | "digital_tech"
  | "grossistes_distribution";

export interface AuthorizedRoleOption {
  title: string;
  agentId: string;
  description: string;
}

export interface IndustrySectorConfig {
  id: IndustrySectorKey;
  label: string;
  icon: string;
  theme: string;
  catalogWord: string;
  layout: "grid_fashion" | "menu_food" | "real_estate" | "auto_parts" | "health_care" | "beauty_booking" | "education_courses" | "pro_services" | "construction_projects" | "tech_portfolio" | "wholesale_b2b";
  subTypes: string[];
  defaultCategories: string[];
  authorizedRoles: AuthorizedRoleOption[];
}

export const INDUSTRY_SECTORS: Record<IndustrySectorKey, IndustrySectorConfig> = {
  commerce_vente: {
    id: "commerce_vente",
    label: "🛍️ Commerce & Vente",
    icon: "🛍️",
    theme: "emerald",
    catalogWord: "Katalòg",
    layout: "grid_fashion",
    subTypes: [
      "Boutique de vêtements et chaussures",
      "Boutique de cosmétiques",
      "Boutique de parfums",
      "Bijouterie",
      "Boutique d'électronique",
      "Boutique de téléphones et Accessoires",
      "Boutique d'ameublement",
      "Électroménager",
      "Boutique pour bébés",
      "Boutique en ligne",
      "Vendeur Facebook",
      "Vendeur TikTok",
    ],
    defaultCategories: ["Rad & Soulye", "Bote & Parfen", "Elektronik", "Akseswa", "Pwomo Flach"],
    authorizedRoles: [
      { title: "💬 Commercial / Ventes", agentId: "jean", description: "Traite les messages, devis & demandes clients" },
      { title: "💳 Caissière / Pèman", agentId: "marie", description: "Vérifie les règlements MonCash/Banque & émet les reçus" },
      { title: "📦 Stockist / Livrezon", agentId: "pierre", description: "Gère les stocks & valide les colis avec code PIN 🔑" },
      { title: "📞 Sèvis Kliyan & Dèt", agentId: "florence", description: "Suivi après-vente & relance des dettes" },
      { title: "📢 Ajan Relans & Promo", agentId: "steeve", description: "Diffusion de promos & partage de la vitrine" },
    ],
  },
  restauration: {
    id: "restauration",
    label: "🍔 Restauration & Alimentation",
    icon: "🍔",
    theme: "amber",
    catalogWord: "Menu",
    layout: "menu_food",
    subTypes: [
      "Restaurant",
      "Fast-food",
      "Boulangerie",
      "Pâtisserie",
      "Service traiteur",
      "Bar à jus",
      "Pizzeria",
      "Grillades",
      "Vente de produits alimentaires",
    ],
    defaultCategories: ["Antre", "Plat Prensipal", "Patisri & Desè", "Bwason", "Konbo Spesyal"],
    authorizedRoles: [
      { title: "📞 Responsable Prise de Commande", agentId: "jean", description: "Prend les commandes repas & valides le panier" },
      { title: "👨‍🍳 Responsable Cuisine / Prep", agentId: "pierre", description: "Prépare les commandes en cuisine & emballages" },
      { title: "🛵 Livreur Repas / Dispatcher", agentId: "steeve", description: "Livre les repas chauds & valide avec OTP" },
    ],
  },
  immobilier: {
    id: "immobilier",
    label: "🏠 Immobilier & Gestion",
    icon: "🏠",
    theme: "slate",
    catalogWord: "Portefeuille Propriétés",
    layout: "real_estate",
    subTypes: ["Agence immobilière", "Gestion immobilière"],
    defaultCategories: ["Appartements à Louer", "Maisons en Vente", "Terrains", "Espaces Commercial"],
    authorizedRoles: [
      { title: "🏡 Agent Immobiler / Négociateur", agentId: "jean", description: "Alimente les propriétés, organise les visites & devis" },
      { title: "📋 Gestionnaire Locatif & Dèt", agentId: "florence", description: "Suivi des baux, quittances & relance des loyers" },
    ],
  },
  automobile: {
    id: "automobile",
    label: "🚗 Automobile & Services",
    icon: "🚗",
    theme: "blue",
    catalogWord: "Catalogue Pièces & Véhicules",
    layout: "auto_parts",
    subTypes: [
      "Concessionnaire automobile",
      "Vente de véhicules d'occasion",
      "Location de voitures",
      "Garage automobile",
      "Vente de pièces automobiles",
      "Service de mécanique",
      "Station de lavage automobile",
    ],
    defaultCategories: ["Véhicules", "Pièces Moteur", "Freinage & Suspension", "Location & Car Wash"],
    authorizedRoles: [
      { title: "🚗 Conseiller Commercial / Vente", agentId: "jean", description: "Présente les véhicules & pièces, envoie les devis" },
      { title: "🛠️ Chef d'Atelier / Stockist", agentId: "pierre", description: "Gestion des pièces détaches & contrôle réparations" },
      { title: "🔑 Responsable Planning & Location", agentId: "steeve", description: "Suivi du parc de location & contrôles véhicules" },
    ],
  },
  sante_bienetre: {
    id: "sante_bienetre",
    label: "🏥 Santé & Bien-être",
    icon: "🏥",
    theme: "teal",
    catalogWord: "Services & Soins",
    layout: "health_care",
    subTypes: [
      "Clinique",
      "Cabinet médical",
      "Cabinet dentaire",
      "Laboratoire médical",
      "Pharmacie",
      "Centre d'esthétique",
      "Salon de beauté",
      "Spa",
    ],
    defaultCategories: ["Consultations", "Soins Esthétiques", "Pharmacie & Traitements", "Bilan & Labo"],
    authorizedRoles: [
      { title: "💊 Pharmacien / Stockist Médical", agentId: "marie", description: "Gestion des produits de santé & ordonnances" },
      { title: "📅 Secrétaire RDV & Accueil", agentId: "florence", description: "Prise de RDV WhatsApp & suivi des acomptes" },
      { title: "📢 Agent Relans Sante & Spa", agentId: "steeve", description: "Relance des traitements & abonnements soins" },
    ],
  },
  beaute_services: {
    id: "beaute_services",
    label: "💇 Beauté & Services Personnels",
    icon: "💇",
    theme: "purple",
    catalogWord: "Prestations & Tarifs",
    layout: "beauty_booking",
    subTypes: [
      "Salon de coiffure",
      "Barber shop",
      "Institut de beauté",
      "Salon de manucure",
      "Maquilleur professionnel",
      "Photographe",
      "Vidéaste",
    ],
    defaultCategories: ["Coiffure & Coupe", "Manucure & Pédicure", "Maquillage", "Shooting & Vidéo"],
    authorizedRoles: [
      { title: "📱 Responsable Réservation & CM", agentId: "jean", description: "Prend les rdv WhatsApp & gère le calendrier salon" },
      { title: "📢 Agent Promo & Portfolio", agentId: "steeve", description: "Partage le book photos & diffuse les forfaits" },
    ],
  },
  education: {
    id: "education",
    label: "🎓 Éducation & Formation",
    icon: "🎓",
    theme: "indigo",
    catalogWord: "Programmes & Cours",
    layout: "education_courses",
    subTypes: [
      "École privée",
      "Centre de formation",
      "Formation en ligne",
      "Académie de trading",
      "École de langues",
      "Formation informatique",
      "Coaching",
    ],
    defaultCategories: ["Formations Certifiantes", "Cours du Soir", "Ateliers & Bootcamp", "Coaching 1-on-1"],
    authorizedRoles: [
      { title: "🎓 Conseiller à l'Admission", agentId: "jean", description: "Présente les programmes, envoie les PDF & inscrit" },
      { title: "💳 Responsable Écolage & Dèt", agentId: "florence", description: "Suivi des mensualités d'écolage & relances" },
    ],
  },
  services_pros: {
    id: "services_pros",
    label: "💼 Services Professionnels",
    icon: "💼",
    theme: "navy",
    catalogWord: "Offres de Services",
    layout: "pro_services",
    subTypes: [
      "Cabinet comptable",
      "Consultant",
      "Cabinet de conseil",
      "Services juridiques",
      "Services d'assurance",
      "Services financiers",
    ],
    defaultCategories: ["Audit & Conseil", "Comptabilité", "Contrats & Juridique", "Assurance & Finance"],
    authorizedRoles: [
      { title: "💼 Chargé d'Affaires / Consultant", agentId: "jean", description: "Mène les cadrages & envoie les propales de service" },
      { title: "⚖️ Assistant Facturation & Dèt", agentId: "florence", description: "Facturation des honoraires & suivis de règlement" },
    ],
  },
  construction: {
    id: "construction",
    label: "🏗️ Construction & Habitat",
    icon: "🏗️",
    theme: "orange",
    catalogWord: "Catalogue Projets & Matériaux",
    layout: "construction_projects",
    subTypes: [
      "Entreprise de construction",
      "Architecte",
      "Menuisier",
      "Installation solaire",
      "Décoration intérieure",
    ],
    defaultCategories: ["Projets Clé en Main", "Kits Solaires", "Matériaux & Bois", "Rénovation & Déco"],
    authorizedRoles: [
      { title: "📐 Chargé d'Études & Devis", agentId: "jean", description: "Établit les devis de chantier sur-mesure" },
      { title: "🧱 Conducteur Travaux & Stòk", agentId: "pierre", description: "Suivi des livraisons de matériaux & chantier" },
    ],
  },
  digital_tech: {
    id: "digital_tech",
    label: "💻 Digital & Technologie",
    icon: "💻",
    theme: "cyan",
    catalogWord: "Packs Services Tech",
    layout: "tech_portfolio",
    subTypes: [
      "Agence digitale",
      "Agence de marketing",
      "Développeur web",
      "Designer graphique",
      "Community manager",
      "Services informatiques",
      "Freelance",
    ],
    defaultCategories: ["Développement Web/App", "Branding & Design", "Marketing Digital", "Maintenance Tech"],
    authorizedRoles: [
      { title: "🎯 Sales / Business Developer", agentId: "jean", description: "Qualifie les demandes de projets & conclut les abonnements" },
      { title: "💻 Project Manager & Support", agentId: "steeve", description: "Assure la livraison des jalons & support client" },
    ],
  },
  grossistes_distribution: {
    id: "grossistes_distribution",
    label: "📦 Grossistes & Distribution",
    icon: "📦",
    theme: "amber_dark",
    catalogWord: "Katalòg An Gwo (B2B)",
    layout: "wholesale_b2b",
    subTypes: [
      "Grossiste",
      "Distributeur",
      "Dépôt de marchandises",
      "Distribution de boissons",
      "Distribution de produits alimentaires",
    ],
    defaultCategories: ["Vente par Palettes", "Vente par Cartons", "Promos Volume B2B", "Produits Secs"],
    authorizedRoles: [
      { title: "🛡️ Gérant Général (Délégué Interim)", agentId: "gerant", description: "Supervision globale des opérations de dépôt" },
      { title: "💬 Commercial Vente Gros", agentId: "jean", description: "Gère le portefeuille de détaillants & commandes gros" },
      { title: "📦 Magasinier Dépôt & Stòk", agentId: "pierre", description: "Mouvements de stock & chargements camions" },
      { title: "🚚 Chauffeur Livreur B2B", agentId: "steeve", description: "Livre aux boutiques & encaisse avec code PIN 🔑" },
    ],
  },
};

export const VERTICALS = INDUSTRY_SECTORS;

export type BusinessType = string;

export interface VerticalConfig {
  label: string;
  catalogWord: string;
  layout: string;
  defaultCategories: string[];
  authorizedRoles: AuthorizedRoleOption[];
}

export function verticalOf(type: string | null | undefined): IndustrySectorConfig {
  if (!type) return INDUSTRY_SECTORS.commerce_vente;

  for (const sector of Object.values(INDUSTRY_SECTORS)) {
    if (sector.id === type || sector.subTypes.includes(type)) {
      return sector;
    }
  }

  return INDUSTRY_SECTORS.commerce_vente;
}
