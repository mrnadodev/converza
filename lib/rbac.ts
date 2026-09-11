import type { OrderStatus } from "./types";

export interface UserSession {
  full_name: string;
  role: "owner" | "agent";
  specialty?: string;
  agentId?: string;
}

export type NavTab = "tablo" | "chat" | "komand" | "stok" | "katalog" | "kliyan" | "audit";

export interface RolePermissions {
  canEditCatalog: boolean;
  canEditStock: boolean;
  canEditCustomers: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  canSwitchPipelineAgentFilter: boolean;
  canViewFinancialTurnover: boolean;
  allowedPipelineColumns: OrderStatus[];
  allowedNavTabs: NavTab[];
  isReadOnly: boolean;
}

export function getRolePermissions(session: UserSession): RolePermissions {
  if (session.role === "owner") {
    return {
      canEditCatalog: true,
      canEditStock: true,
      canEditCustomers: true,
      canManageTeam: true,
      canManageSettings: true,
      canSwitchPipelineAgentFilter: true,
      canViewFinancialTurnover: true,
      allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
      allowedNavTabs: ["tablo", "chat", "komand", "stok", "katalog", "kliyan", "audit"],
      isReadOnly: false,
    };
  }

  switch (session.agentId) {
    case "marie": // Caissière / Pèman
      return {
        canEditCatalog: false,
        canEditStock: false,
        canEditCustomers: false,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false, // 🔒 VERROUILLAGE STRICT
        canViewFinancialTurnover: false,     // 🔒 Masquage des chiffres financiers
        allowedPipelineColumns: ["konfime_peman"], // 🔒 Uniquement sa colonne dédiée
        allowedNavTabs: ["tablo", "chat", "komand"], // 🔒 Caissière : Tablo, Chat, Kòmand
        isReadOnly: true,
      };
    case "jean": // Commercial / Ventes
      return {
        canEditCatalog: false,
        canEditStock: false,
        canEditCustomers: true,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false,
        canViewFinancialTurnover: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman"],
        allowedNavTabs: ["tablo", "chat", "komand", "katalog", "kliyan"], // 🔒 Ventes : Tablo, Chat, Kòmand, Katalòg, Kliyan
        isReadOnly: false,
      };
    case "pierre": // Stockist / Livrezon
      return {
        canEditCatalog: false,
        canEditStock: true,
        canEditCustomers: false,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false,
        canViewFinancialTurnover: false,
        allowedPipelineColumns: ["sou_wout", "livre"],
        allowedNavTabs: ["tablo", "chat", "komand", "stok"], // 🔒 Stockist : Tablo, Chat, Kòmand, Stòk
        isReadOnly: false,
      };
    case "florence": // Sèvis Kliyan & Dèt
      return {
        canEditCatalog: false,
        canEditStock: false,
        canEditCustomers: true,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false,
        canViewFinancialTurnover: false,
        allowedPipelineColumns: ["swivi"],
        allowedNavTabs: ["tablo", "chat", "komand", "kliyan"], // 🔒 Sèvis Kliyan : Tablo, Chat, Kòmand, Kliyan
        isReadOnly: false,
      };
    case "steeve": // Ajan Relans & Promo
      return {
        canEditCatalog: false,
        canEditStock: false,
        canEditCustomers: false,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false,
        canViewFinancialTurnover: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "chat", "stok", "katalog"], // 🔒 Promo : Tablo, Chat, Stòk, Katalòg
        isReadOnly: true,
      };
    case "gerant": // Gérant Général (Délégué Interim)
      return {
        canEditCatalog: true,
        canEditStock: true,
        canEditCustomers: true,
        canManageTeam: false, // 🔒 Ne peut pas supprimer l'équipe ni l'owner
        canManageSettings: false, // 🔒 Verrouillage des coordonnées bancaires & MonCash
        canSwitchPipelineAgentFilter: true, // Peut voir et filtrer tout le pipeline
        canViewFinancialTurnover: false, // 🔒 Masquage du bénéfice net final
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "chat", "komand", "stok", "katalog", "kliyan", "audit"],
        isReadOnly: false,
      };
    default:
      return {
        canEditCatalog: false,
        canEditStock: false,
        canEditCustomers: false,
        canManageTeam: false,
        canManageSettings: false,
        canSwitchPipelineAgentFilter: false,
        canViewFinancialTurnover: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "chat", "komand"],
        isReadOnly: true,
      };
  }
}

export function getRoleTailoredConfig(session: UserSession) {
  if (session.role === "owner") {
    return {
      title: "Tablo Debò Fondatè & Finans Global",
      subtitle: "Visiyon total sou tout kòmand, dèt, lavant ak finans konpayi an.",
      badge: "👑 Fondateur / Admin",
      focusColumn: null,
      hideFinancialTurnover: false,
      bannerMessage: "Tout bagay an lòd nan biznis la. 5 ajan ap jere pipeline la ak siksè !",
      quickActionLabel: "Pataje vitrin mwen",
      metrics: [
        { label: "Vant Semèn nan", value: "48,750 HTG", highlight: true },
        { label: "Kòmand Total", value: "7 kòmand" },
        { label: "Pèman solde", value: "37,950 HTG" },
        { label: "Dèt an kous", value: "9,000 HTG" },
      ],
    };
  }

  switch (session.agentId) {
    case "marie":
      return {
        title: "💳 Espas Travay Caissière — Pèman & Reçus",
        subtitle: "Verifikasyon vira MonCash/Natcash/Bank ak émission de reçus officiels.",
        badge: "💳 Caissière / Pèman",
        focusColumn: "Konfime Pèman",
        hideFinancialTurnover: true,
        bannerMessage: "⚡ 1 Pèman MonCash 8842 an atant de verifikasyon kounye a !",
        quickActionLabel: "✓ Emit Yon Reçu Pèman",
        metrics: [
          { label: "Pèman pou Konfime", value: "1 viman", highlight: true },
          { label: "Vireman Validé Jodi a", value: "3 pèman" },
          { label: "Reçus Émis", value: "14 reçus" },
        ],
      };
    case "jean":
      return {
        title: "💬 Espas Vant & Prospection",
        subtitle: "Akèy prospect, deviz ak voye mwayen pèman sou WhatsApp.",
        badge: "💬 Commercial / Ventes",
        focusColumn: "Kontak",
        hideFinancialTurnover: true,
        bannerMessage: "📩 2 Nouvo prospect an atant de mwayen pèman sou WhatsApp !",
        quickActionLabel: "💬 Voye Mwayen Pèman",
        metrics: [
          { label: "Prospect nan Kontak", value: "2 kliyan", highlight: true },
          { label: "Mwayen pèman voye", value: "5 deviz" },
          { label: "Konvèsyon Semèn", value: "85%" },
        ],
      };
    case "pierre":
      return {
        title: "📦 Espas Livrezon & Stockist",
        subtitle: "Preparasyon colis nan stok ak verifikasyon Kòd Sekirite 🔑 nan livrezon.",
        badge: "📦 Stockist / Livrezon",
        focusColumn: "Sou Wout",
        hideFinancialTurnover: true,
        bannerMessage: "🔑 2 Colis sou wout ak Kòd Sekirite 4 chif pou w mande nan livrezon !",
        quickActionLabel: "🔑 Antre Kòd Sekirite Livrezon",
        metrics: [
          { label: "Colis Sou Wout", value: "2 colis", highlight: true },
          { label: "Livrezon Fèt Jodi a", value: "4 colis" },
          { label: "Kòd Sekirite Requis", value: "100% verifye" },
        ],
      };
    case "florence":
      return {
        title: "🏷️ Espas Sèvis Kliyan & Dèt",
        subtitle: "Swivi satisfaksyon kliyan apre-vant ak relans 1-click pou dèt ki pa peye.",
        badge: "🏷️ Sèvis Kliyan & Dèt",
        focusColumn: "Dèt",
        hideFinancialTurnover: true,
        bannerMessage: "🏷️ 1 Dèt an kous (9,000 HTG) ready pou w relanse oswa regle !",
        quickActionLabel: "✓ Regle yon Dèt",
        metrics: [
          { label: "Total Dèt an Kous", value: "9,000 HTG", highlight: true },
          { label: "Kliyan nan Swivi", value: "1 kliyan" },
          { label: "Dèt Solde Semèn sa", value: "3 dèt solde" },
        ],
      };
    case "gerant":
      return {
        title: "🛡️ Espas Travay : Gérant Général (Délégué Interim)",
        subtitle: "Supervision globale des opérations, approbation des livraisons et contrôle d'audit an tan reyèl",
        badge: "🛡️ Gérant Général",
        focusColumn: "Toutes les étapes",
        hideFinancialTurnover: true,
        bannerMessage: "🛡️ Ròl Gérant Général active : Supervision globale des opérations ak kontwòl audit an tan reyèl !",
        quickActionLabel: "🔍 Ouvri Audit & Supervision",
        metrics: [
          { label: "Kòmand an Kous", value: "48 kòmand", highlight: true },
          { label: "Livrezon pou Valide", value: "6 colis" },
          { label: "Stòk Prèske Fini", value: "3 alèt" },
          { label: "Audit Ajan (Pa ankò li)", value: "3 aksyon" },
        ],
      };
    default:
      return {
        title: "📢 Espas Relans & Promosyon",
        subtitle: "Relans kliyan inaktif ak alèt aliman stok.",
        badge: "📢 Relans & Promo",
        focusColumn: null,
        hideFinancialTurnover: true,
        bannerMessage: "📢 Alèt Stok: Pwodwi nan risk rupture pou relanse sou WhatsApp!",
        quickActionLabel: "📢 Voye Promo Vitrin",
        metrics: [
          { label: "Alèt Stok", value: "0 rupture", highlight: true },
          { label: "Relans Voye", value: "12 mesaj" },
        ],
      };
  }
}
