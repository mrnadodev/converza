-- ============================================================
-- CONVERZA — migration 11 (annuaire des boutiques, fournisseurs partagés)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-10-vitrine-produits.sql. Le script est rejouable.
--
-- Deux ouvertures vers l'extérieur, et deux réglages opposés — à dessein.
--
-- 1. L'ANNUAIRE DES BOUTIQUES est ouvert par défaut. Un marchand publie déjà
--    sa vitrine et la partage ; y figurer ne révèle rien de plus, et un
--    annuaire à moitié vide ne rend service à personne. Le retrait reste
--    possible d'une case dans les Paramètres.
--
-- 2. LES FOURNISSEURS sont privés par défaut. Un carnet d'adresses
--    fournisseurs est un actif concurrentiel : le marchand qui saisit un
--    numéro ne s'attend pas à ce que la boutique d'en face le lise. Le
--    partage est donc un choix explicite, fournisseur par fournisseur.
--
-- La différence tient à qui possède la donnée. La vitrine appartient au
-- marchand et il la montre déjà ; le contact du fournisseur appartient à la
-- relation entre eux deux.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Annuaire des boutiques
-- ------------------------------------------------------------

alter table businesses add column if not exists listed boolean not null default true;

-- L'annuaire cherche par produit puis remonte à la boutique : l'index sert au
-- filtre « boutiques inscrites » appliqué avant la jointure.
create index if not exists businesses_listed_idx on businesses (listed) where listed;

-- ------------------------------------------------------------
-- 2. Fournisseurs partagés
-- ------------------------------------------------------------

alter table suppliers add column if not exists shared boolean not null default false;

create index if not exists suppliers_shared_idx on suppliers (shared) where shared;

-- ------------------------------------------------------------
-- 3. Lectures publiques
--
-- L'annuaire est lu sans être connecté : les politiques existantes, bornées à
-- `my_business_id()`, ne s'appliquent qu'aux membres. On expose donc des vues
-- restreintes plutôt que d'ouvrir les tables.
-- ------------------------------------------------------------

-- Boutiques inscrites à l'annuaire. Aucune coordonnée bancaire, aucun réglage
-- interne : le strict nécessaire pour qu'un visiteur trouve et ouvre la vitrine.
create or replace view public_directory_businesses as
select
  b.id,
  b.name,
  b.slug,
  b.business_type,
  b.address,
  b.logo_url,
  b.cover_url,
  b.slogan
from businesses b
where b.listed;

-- Produits visibles des boutiques inscrites. C'est la table que l'annuaire
-- interroge : on cherche un produit, on obtient la boutique qui le vend.
create or replace view public_directory_products as
select
  p.id,
  p.name,
  p.category,
  p.price_cents,
  p.currency,
  p.photo_url,
  p.stock_state,
  b.id   as business_id,
  b.name as business_name,
  b.slug as business_slug,
  b.address as business_address,
  b.business_type
from products p
join businesses b on b.id = p.business_id
where b.listed
  and p.is_active
  and coalesce(p.stock_state, 'en_stok') <> 'fini';

-- Fournisseurs que leur boutique accepte de partager.
--
-- Le nom de la boutique qui les a saisis n'apparaît pas : l'information utile
-- est le fournisseur, pas qui travaille avec lui. Les produits déjà livrés
-- sont agrégés, sans quantités ni prix — c'est ce qui permet de chercher un
-- produit et de voir qui le fournit, sans révéler les achats de personne.
create or replace view public_shared_suppliers as
select
  s.id,
  s.name,
  s.phone_e164,
  s.note,
  coalesce(
    array_agg(distinct p.name) filter (where p.name is not null),
    '{}'::text[]
  ) as products
from suppliers s
left join purchases pu on pu.supplier_id = s.id
left join purchase_items pi on pi.purchase_id = pu.id
left join products p on p.id = pi.product_id
where s.shared
group by s.id, s.name, s.phone_e164, s.note;

grant select on public_directory_businesses to anon, authenticated;
grant select on public_directory_products to anon, authenticated;
grant select on public_shared_suppliers to authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 11))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(11, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
