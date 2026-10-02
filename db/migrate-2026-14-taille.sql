-- ============================================================
-- PASRÈL — migration 14 (taille des articles de mode)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-13-audience.sql. Le script est rejouable.
--
-- Un vêtement, une chaussure, une sandale ou une paire de tennis ne se vend
-- pas sans sa taille. Le client demandait « vous l'avez en 40 ? » dans la
-- conversation WhatsApp, et le marchand répondait à la main, dix fois par
-- jour, pour la même paire.
--
-- CE QUE CETTE COLONNE N'EST PAS : un stock par taille. Elle dit quelles
-- tailles existent pour cet article — « 38 à 42 », « M », « S, M, L » — pas
-- combien il en reste de chaque. Compter le stock taille par taille demande
-- des déclinaisons de produit, donc une ligne de commande par déclinaison et
-- un inventaire par déclinaison : un autre chantier, qu'il ne faut pas faire
-- croire livré en ajoutant un champ texte.
-- ============================================================

alter table products add column if not exists size text;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 14))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(14, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
