-- ============================================================
-- CONVERZA — migration 9 (présence sur la page d'accueil)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-8-abonnement.sql.
-- Le script peut être relancé sans risque.
--
-- La page d'accueil présente jusqu'à quatre boutiques qui vendent, avec leur
-- nom, leur logo et un lien vers leur vitrine. Un commerçant peut le refuser
-- depuis ses réglages : ce choix vit ici.
--
-- Par défaut, une boutique peut être présentée (false = pas de refus). Le
-- commerçant écrit lui-même cette colonne : elle ne fait pas partie des
-- colonnes verrouillées par protect_business_columns.
-- ============================================================

alter table businesses add column if not exists showcase_opt_out boolean not null default false;

-- La vue publique reprend exactement la migration 8 — plan réellement dû,
-- boutiques suspendues exclues — et ajoute la colonne en dernière position :
-- create or replace view n'accepte de nouvelles colonnes qu'à la fin.
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout,
  case
    when coalesce(plan, 'gratis') <> 'gratis'
         and plan_until is not null
         and plan_until + interval '3 days' < now()
    then 'gratis'
    else coalesce(plan, 'gratis')
  end as plan,
  social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until,
  showcase_opt_out
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- Repère de version lu par la console. Il ne recule jamais.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 9))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(9, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
