import type { OrderStatus } from "./types";

export interface UserSession {
  full_name: string;
  role: "owner" | "agent";
  specialty?: string;
  agentId?: string;
}

export type NavTab = "tablo" | "komand" | "stok" | "katalog" | "kliyan" | "kes";

export interface RolePermissions {
  canEditCatalog: boolean;
  canEditStock: boolean;
  canEditCustomers: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  canSwitchPipelineAgentFilter: boolean;
  canViewFinancialTurnover: boolean;
  /**
   * Inventaire de stock : produits, quantités, rotation, valeur du stock.
   * Aucun client, aucun chiffre d'affaires.
   *
   * Séparé de `canEditStock` à dessein : un agent promotionnel doit savoir ce
   * qu'il reste à vendre sans pouvoir toucher aux quantités.
   */
  canViewStockReport: boolean;
  /**
   * Rapport de ventes : chiffre d'affaires, encaissé, reste à encaisser, et le
   * détail des commandes — donc le nom et le numéro de chaque client.
   *
   * Un seul rapport mélangeait les deux. L'application masquait les chiffres
   * financiers au stockiste à l'écran, puis lui laissait télécharger un fichier
   * qui les contenait tous, avec le carnet d'adresses de la boutique.
   */
  canViewSalesReport: boolean;
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
      canViewStockReport: true,
      canViewSalesReport: true,
      allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
      allowedNavTabs: ["tablo", "komand", "stok", "katalog", "kliyan", "kes"],
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
        canViewStockReport: false,
        canViewSalesReport: false,
        allowedPipelineColumns: ["konfime_peman"], // 🔒 Uniquement sa colonne dédiée
        allowedNavTabs: ["tablo", "komand"],
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
        canViewStockReport: false,
        canViewSalesReport: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman"],
        allowedNavTabs: ["tablo", "komand", "katalog", "kliyan"],
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
        canViewStockReport: true,  // c'est son metier
        canViewSalesReport: false,
        allowedPipelineColumns: ["sou_wout", "livre"],
        allowedNavTabs: ["tablo", "komand", "stok"],
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
        canViewStockReport: false,
        canViewSalesReport: false,
        allowedPipelineColumns: ["swivi"],
        allowedNavTabs: ["tablo", "komand", "kliyan"],
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
        canViewStockReport: true,  // il doit savoir quoi promouvoir
        canViewSalesReport: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "stok", "katalog"],
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
        canViewStockReport: true,
        canViewSalesReport: true,   // il voit deja chaque commande dans le pipeline
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "komand", "stok", "katalog", "kliyan", "kes"],
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
        canViewStockReport: false,
        canViewSalesReport: false,
        allowedPipelineColumns: ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"],
        allowedNavTabs: ["tablo", "komand"],
        isReadOnly: true,
      };
  }
}
