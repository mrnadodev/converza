// Types applicatifs — miroir du schéma db/schema.sql.

export type MemberRole = "owner" | "agent";
// Pipeline de vente : à confirmer -> payé -> livré -> suivi ; annulé en sortie.
export type OrderStatus = "pou_konfime" | "peye" | "livre" | "swivi" | "anile";
export type FollowupKind = "det" | "rekomand" | "satisfaksyon";
export type PayMethod = "moncash" | "natcash" | "kach" | "lot";
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
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  delivery_zones: DeliveryZone[];
  default_currency: Currency;
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
  stock_state: StockState;
  photo_url: string | null;
  is_active: boolean;
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
  pou_konfime: "Pou konfime",
  peye: "Peye",
  livre: "Livre",
  swivi: "Swivi",
  anile: "Anile",
};

// Ordre des colonnes dans la vue Pipeline (Kanban).
export const PIPELINE_COLUMNS: OrderStatus[] = ["pou_konfime", "peye", "livre", "swivi"];

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
  totalCents: number;
  owedCents: number;
  badge?: string; // ex: "→ Jean", "MonCash 8842"
}
