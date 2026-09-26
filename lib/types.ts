// Types applicatifs — miroir du schéma db/schema.sql.

export type MemberRole = "owner" | "agent";
// Pipeline de vente : à confirmer -> payé -> en route -> livré -> suivi ; annulé en sortie.
export type OrderStatus =
  | "demand_acha"
  | "kontak"
  | "metod_peman"
  | "konfime_peman"
  | "sou_wout"
  | "livre"
  | "swivi"
  | "anile"
  | "pou_konfime"
  | "peye";
export type FollowupKind = "det" | "rekomand" | "satisfaksyon";
export type PayMethod =
  | "moncash"
  | "natcash"
  | "kach"
  | "crypto_usdt"
  | "zelle"
  | "unibank_htg"
  | "unibank_usd"
  | "buh_htg"
  | "buh_usd"
  | "sogebank_htg"
  | "sogebank_usd"
  | "banque_locale"
  | "lot";
export type Currency = "HTG" | "USD";
export type StockState = "en_stok" | "ba_stok" | "fini";

export interface Business {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  address: string | null;
  phone_e164: string | null;
  logo_url: string | null;
  cover_url: string | null;
  hours: string | null;
  /** Horaires structures (migration 12). `hours` reste le texte libre. */
  opens_at?: string | null;
  closes_at?: string | null;
  open_days?: number[] | null;
  business_type: string | null;
  employees_count: number | null;
  theme: string | null;
  layout: string | null; // 'auto' | 'grid' | 'menu'
  plan: string | null; // 'gratis' | 'pro' | 'premium'
  plan_until: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  slogan?: string | null;
  promo_text?: string | null;
  usd_exchange_rate?: number | null;
  bank_accounts?: string | null;
  zelle_info?: string | null;
  usdt_trc20_address?: string | null;
  moncash_number?: string | null;
  moncash_name?: string | null;
  moncash_qr_url?: string | null;
  natcash_number?: string | null;
  natcash_name?: string | null;
  natcash_qr_url?: string | null;
  zelle_qr_url?: string | null;
  usdt_qr_url?: string | null;
  delivery_zones: DeliveryZone[];
  /** Refus d’apparaître sur la page d’accueil de CONVERZA (migration 9). */
  showcase_opt_out?: boolean | null;
  /** Inscrit dans l'annuaire public (migration 11). Vrai par defaut. */
  listed?: boolean | null;
  default_currency: Currency;
  // Changement de numéro validé par CONVERZA (db/migrate-2026-4-numero.sql).
  previous_phone_e164?: string | null;
  phone_changed_at?: string | null;
  phone_notice_until?: string | null;
}

// Zone de livraison configurée par le marchand (nom + frais).
export interface DeliveryZone {
  name: string;
  fee_cents: number;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone_e164: string;
  address: string | null;
  tags: string[];
  note: string | null;
  created_at: string;
  orders_count?: number;
  total_spent_cents?: number;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  price_cents: number;
  currency: Currency;
  unit: string | null;
  stock_qty: number | null;
  stock_threshold?: number | null;
  stock_state: StockState;
  photo_url: string | null;
  photos?: string[];
  /** Mis en avant sur la vitrine par le marchand (migration 10). */
  in_showcase?: boolean | null;
  sold_count: number;
  is_active: boolean;
  /** Prix d'achat unitaire (migration 6), pour le calcul du bénéfice. */
  cost_cents?: number | null;
}

export interface Order {
  id: string;
  business_id: string;
  ref: string;
  customer_id: string | null;
  status: OrderStatus;
  currency: Currency;
  delivery_fee_cents: number;
  amount_paid_cents: number;
  delivery_addr: string | null;
  pay_method: PayMethod | null;
  pay_ref: string | null;
  assigned_to: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  next_followup_at: string | null;
  followed_up_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price_cents: number;
  qty: number;
}

export interface QuickReply {
  id: string;
  business_id: string;
  label: string;
  body: string;
  sort_order: number;
}

// Libellés Kreyòl pour l'affichage des statuts.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  demand_acha: "Demand Acha",
  kontak: "Kontak",
  metod_peman: "Mwayen Peman",
  konfime_peman: "Konfime Pèman",
  sou_wout: "Sou wout",
  livre: "Livre",
  swivi: "Swivi",
  anile: "Anile",
  pou_konfime: "Demand Acha",
  peye: "Konfime Pèman",
};

// Ordre des 7 colonnes dans la vue Pipeline (Kanban).
export const PIPELINE_COLUMNS: OrderStatus[] = [
  "demand_acha",
  "kontak",
  "metod_peman",
  "konfime_peman",
  "sou_wout",
  "livre",
  "swivi",
];

export const FOLLOWUP_KIND_LABEL: Record<FollowupKind, string> = {
  det: "Lajan pou resevwa",
  rekomand: "Re-kòmand",
  satisfaksyon: "Satisfaksyon",
};

// Carte affichée dans la vue Pipeline (Kanban).
export interface PipelineCard {
  id: string;
  ref: string;
  status: OrderStatus;
  customerName: string;
  phone_e164: string;
  itemsSummary: string;
  /** Lignes réelles de la commande, quand elles sont connues (facture exacte). */
  items?: { name: string; qty: number; unitPriceCents: number }[];
  totalCents: number;
  owedCents: number;
  deliveryFeeCents?: number;
  currency?: Currency;
  pay_method?: PayMethod | null;
  securityCode?: string | null; // code livraison stocké en base (4 chiffres)
  badge?: string; // ex: "→ Jean", "MonCash 8842"
  // Livraison (migration 6).
  deliveryAddr?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  trackingToken?: string | null;
  deliveredWithCode?: boolean;
}
