// Platform Governance & Global Settings (Contrôle Super-Admin)

export interface ImageRatioOption {
  key: "1:1" | "3:4" | "16:9" | "stretch";
  label: string;
  enabled: boolean;
}

export interface PlatformLanguageOption {
  code: "ht" | "fr" | "en" | "es";
  name: string;
  flag: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface DesignLayoutConfig {
  key: "design1" | "design2" | "design3";
  name: string;
  tag: string;
  minPlanRequired: "gratis" | "pro" | "premium";
  enabled: boolean;
}

export interface QrMenuServiceConfig {
  enabled: boolean;
  standalonePriceGdes: number;
  tableLimits: {
    gratis: number;
    pro: number;
    premium: number;
  };
  allowKitchenNotes: boolean;
  autoOpenWhatsapp: boolean;
}

export interface PlatformGlobalSettings {
  // Designs & Catalogue
  designs: DesignLayoutConfig[];
  catalogStyles: { key: string; label: string; enabled: boolean }[];
  
  // Image Ratios & Compression
  imageRatios: ImageRatioOption[];
  maxImageSizeMb: number;
  imageCompressionQuality: number; // 50 to 100

  // Langues
  languages: PlatformLanguageOption[];

  // Service Menu QR Standalone & Resto
  qrMenuService: QrMenuServiceConfig;

  // Options de Paiement
  paymentMethods: {
    moncashEnabled: boolean;
    natcashEnabled: boolean;
    bankEnabled: boolean;
    zelleEnabled: boolean;
    usdtEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
  };

  // Feature Flags Globaux
  featureFlags: {
    aiAssistantEnabled: boolean;
    antiFraudDetectorEnabled: boolean;
    whatsappAutoRemindersEnabled: boolean;
    excelExportEnabled: boolean;
    maintenanceMode: boolean;
  };
}

// Valeurs par défaut. La configuration active est lue en base
// (lib/platform-store.ts).
export const DEFAULT_PLATFORM_SETTINGS: PlatformGlobalSettings = {
  designs: [
    { key: "design1", name: "Design 1: Héros & Grille Standard", tag: "Standard", minPlanRequired: "gratis", enabled: true },
    { key: "design2", name: "Design 2: Wireframe Spécifique Secteur", tag: "Avancé", minPlanRequired: "pro", enabled: true },
    { key: "design3", name: "Design 3: Carousel Showcase Deluxe VIP", tag: "Deluxe VIP", minPlanRequired: "premium", enabled: true },
  ],
  catalogStyles: [
    { key: "grid", label: "Grille Standard (2x2 / 4x4)", enabled: true },
    { key: "list", label: "Liste Compacte", enabled: true },
    { key: "bistro_circle", label: "Plats en Cercle (Bistrot Food)", enabled: true },
    { key: "prestige_16_9", label: "Banner Prestige 16:9 (Immobilier)", enabled: true },
    { key: "masonry_hd", label: "Masonry HD Portfolio (Beauté)", enabled: true },
  ],
  imageRatios: [
    { key: "1:1", label: "Carré (1:1)", enabled: true },
    { key: "3:4", label: "Portrait (3:4)", enabled: true },
    { key: "16:9", label: "Bannière (16:9)", enabled: true },
    { key: "stretch", label: "Étiré Full-Width (100% 100%)", enabled: true },
  ],
  maxImageSizeMb: 5,
  imageCompressionQuality: 85,
  languages: [
    { code: "ht", name: "Kreyòl Ayisyen", flag: "🇭🇹", enabled: true, isDefault: true },
    { code: "fr", name: "Français", flag: "🇫🇷", enabled: true },
    { code: "en", name: "English", flag: "🇺🇸", enabled: true },
    { code: "es", name: "Español", flag: "🇩🇴", enabled: false },
  ],
  qrMenuService: {
    enabled: true,
    standalonePriceGdes: 500,
    tableLimits: {
      gratis: 5,
      pro: 25,
      premium: 50,
    },
    allowKitchenNotes: true,
    autoOpenWhatsapp: true,
  },
  paymentMethods: {
    moncashEnabled: true,
    natcashEnabled: true,
    bankEnabled: true,
    zelleEnabled: true,
    usdtEnabled: true,
    cashOnDeliveryEnabled: true,
  },
  featureFlags: {
    aiAssistantEnabled: true,
    antiFraudDetectorEnabled: true,
    whatsappAutoRemindersEnabled: true,
    excelExportEnabled: true,
    maintenanceMode: false,
  },
};

