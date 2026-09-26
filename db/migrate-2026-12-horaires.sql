-- ============================================================
-- CONVERZA — migration 12 (horaires d'ouverture structurés)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-11-annuaire.sql. Le script est rejouable.
--
-- La colonne `hours` existait, mais en texte libre : « 8h – 18h », « 7am–7pm »,
-- « lundi au samedi ». On peut l'afficher, on ne peut rien en déduire. Or un
-- client qui commande à 22 h n'a pas besoin qu'on lui montre des horaires : il
-- a besoin qu'on lui dise quand il aura une réponse.
--
-- Trois colonnes suffisent pour une boutique de quartier : une heure
-- d'ouverture, une heure de fermeture, et les jours travaillés. Une grille
-- jour par jour serait plus juste pour une minorité et plus pénible à remplir
-- pour tout le monde.
--
-- `hours` est conservée : elle reste ce que le marchand veut écrire en toutes
-- lettres, et les boutiques qui ne renseignent pas les nouvelles colonnes ne
-- changent pas d'apparence.
-- ============================================================

alter table businesses add column if not exists opens_at time;
alter table businesses add column if not exists closes_at time;

-- Jours travaillés, au format de Date.getDay() : 0 = dimanche … 6 = samedi.
-- Le défaut couvre lundi à samedi, la semaine de la plupart des commerces.
alter table businesses add column if not exists open_days smallint[] not null default '{1,2,3,4,5,6}';

-- ------------------------------------------------------------
-- La vitrine lit la boutique par `public_businesses` : sans ces colonnes dans
-- la vue, la page ne les verrait jamais.
--
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent : on la
-- supprime d'abord, et les droits sont réattribués juste en dessous.
-- ------------------------------------------------------------

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
  showcase_opt_out,
  opens_at, closes_at, open_days
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 12))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(12, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
