-- ============================================================
-- CONVERZA — migration 8 (abonnement réellement dû)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-7-support.sql.
-- Le script peut être relancé sans risque.
--
-- Problème corrigé : la vitrine publique lisait `plan` tel qu'écrit en base.
-- Après l'échéance, la colonne garde la valeur `pro` ou `premium`, donc un
-- marchand qui payait un seul mois gardait les mises en page payantes pour
-- toujours. La vue renvoie désormais le plan réellement dû.
--
-- Trois jours de tolérance : entre le paiement du marchand et sa vérification
-- par la console, la vitrine ne doit pas changer d'apparence.
-- `plan_until` vide = plan accordé depuis la console, sans échéance connue :
-- on le laisse actif, c'est une décision humaine.
-- ============================================================

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
  previous_phone_e164, phone_changed_at, phone_notice_until
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- ------------------------------------------------------------
-- Repère de version : la console lit cette clé pour dire au super-admin
-- quelles migrations manquent sur la base connectée. Une vue ne se
-- reconnaît pas depuis l'application ; ce repère, si.
-- ------------------------------------------------------------
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 8))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(8, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
