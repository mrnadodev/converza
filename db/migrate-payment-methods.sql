-- ============================================================
-- Migration: Add payment methods and custom QR code columns
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slogan text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS promo_text text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS usd_exchange_rate numeric default 132.5;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bank_accounts text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zelle_info text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS usdt_trc20_address text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS moncash_number text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS moncash_name text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS moncash_qr_url text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS natcash_number text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS natcash_name text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS natcash_qr_url text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zelle_qr_url text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS usdt_qr_url text;
