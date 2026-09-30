-- ============================================================
-- CONVERZA — migration 15 (prix promotionnel par produit)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-14-taille.sql. Le script est rejouable.
--
-- Il existait déjà une « promotion » : elle créait un SECOND produit en
-- catégorie « Pwomosyon », avec un stock figé à 25 unités, pendant que
-- l'article d'origine restait en vitrine au vieux prix. Le client voyait deux
-- fois le même article à deux prix, et vendre la promo ne retirait rien du
-- stock réel. Le marchand se retrouvait à vendre ce qu'il n'avait plus.
--
-- La remise appartient au produit, pas à une copie du produit. Deux colonnes
-- suffisent, et le stock, les photos, la taille et l'historique restent ceux
-- de l'article d'origine.
--
-- `promo_price_cents` n'est lu que s'il est STRICTEMENT inférieur au prix
-- normal (voir lib/prix.ts). La contrainte ci-dessous n'interdit pas un prix
-- promo plus élevé — le marchand peut se tromper en saisissant — elle empêche
-- seulement le négatif. Un faux rabais est ignoré à l'affichage plutôt que
-- rejeté à l'écriture : mieux vaut un produit qui reste vendable au prix
-- normal qu'un enregistrement qui échoue.
--
-- `promo_ends_at` nul veut dire « jusqu'à ce que le marchand l'enlève ».
-- ============================================================

alter table products add column if not exists promo_price_cents bigint;
alter table products add column if not exists promo_ends_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_promo_price_cents_positive'
  ) then
    alter table products
      add constraint products_promo_price_cents_positive
      check (promo_price_cents is null or promo_price_cents >= 0);
  end if;
end $$;

-- Les vitrines ne lisent que les produits actifs d'une boutique : l'index
-- suit ce chemin-là, pour que compter les promos ne coûte pas un parcours
-- complet du catalogue à chaque visite.
create index if not exists products_promo_idx
  on products (business_id)
  where promo_price_cents is not null;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 15))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(15, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
