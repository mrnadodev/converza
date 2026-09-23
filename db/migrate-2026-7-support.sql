-- ============================================================
-- CONVERZA — migration 7 (support et supervision)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-6-gestion.sql.
-- Le script peut être relancé sans risque.
--
--   1. Suspension d'un compte marchand (fraude, impayé)
--   2. Journal des erreurs techniques, visible dans la console
-- ============================================================

-- ------------------------------------------------------------
-- 1. SUSPENSION
--    Un compte suspendu garde ses données : il ne peut plus travailler
--    dans l'application, et sa vitrine publique disparaît.
-- ------------------------------------------------------------
alter table businesses add column if not exists suspended_at timestamptz;
alter table businesses add column if not exists suspended_reason text;

-- Le marchand ne peut pas lever sa propre suspension : seule la clé service
-- role (console) écrit ces colonnes. On complète le verrou de la migration 4.
create or replace function protect_business_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'gratis';
    new.plan_until := null;
    new.previous_phone_e164 := null;
    new.phone_changed_at := null;
    new.phone_notice_until := null;
    new.suspended_at := null;
    new.suspended_reason := null;
    return new;
  end if;

  new.plan := old.plan;
  new.plan_until := old.plan_until;
  new.previous_phone_e164 := old.previous_phone_e164;
  new.phone_changed_at := old.phone_changed_at;
  new.suspended_at := old.suspended_at;
  new.suspended_reason := old.suspended_reason;
  if old.phone_e164 is not null and old.phone_e164 <> '' then
    new.phone_e164 := old.phone_e164;
  end if;
  if new.phone_notice_until is distinct from old.phone_notice_until
     and not (old.phone_notice_until is not null
              and new.phone_notice_until is not null
              and new.phone_notice_until <= old.phone_notice_until) then
    new.phone_notice_until := old.phone_notice_until;
  end if;
  return new;
end $$;

drop trigger if exists protect_business_columns on businesses;
create trigger protect_business_columns
  before insert or update on businesses
  for each row execute function protect_business_columns();

-- La vitrine publique ignore les boutiques suspendues.
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout, plan, social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- ------------------------------------------------------------
-- 2. ERREURS TECHNIQUES
--    Écrites par le serveur quand une opération échoue. Sans ce journal,
--    une panne ne se voit que si un marchand téléphone.
-- ------------------------------------------------------------
create table if not exists app_errors (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null,
  message     text not null,
  business_id uuid references businesses(id) on delete set null,
  user_id     uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists app_errors_created_idx on app_errors (created_at desc);

-- Aucune lecture par les marchands : c'est un journal d'exploitation.
alter table app_errors enable row level security;
revoke all on app_errors from anon, authenticated;

-- ✅ Migration terminée.
