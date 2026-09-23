-- ============================================================
-- CONVERZA — migration 10 (produits mis en vitrine)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-9-vitrine-accueil.sql. Le script est rejouable.
--
-- Le marchand choisit lui-même les produits qui s'affichent « À la une » sur
-- sa vitrine. Les autres restent visibles dans le catalogue complet : rien
-- n'est caché aux clients, c'est l'ordre de mise en avant qui change.
--
-- Tant qu'aucun produit n'est choisi, la vitrine garde son classement
-- automatique (promotions puis meilleures ventes) : une boutique qui ne touche
-- à rien ne change pas d'apparence.
-- ============================================================

alter table products add column if not exists in_showcase boolean not null default false;

-- La vitrine publique lit les produits actifs : l'index sert au tri des
-- produits mis en avant d'une boutique.
create index if not exists products_showcase_idx on products (business_id, in_showcase) where in_showcase;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 10))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(10, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
