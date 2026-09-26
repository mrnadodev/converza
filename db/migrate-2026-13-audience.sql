-- ============================================================
-- CONVERZA — migration 13 (audience du site public)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-12-horaires.sql. Le script est rejouable.
--
-- Jusqu'ici, CONVERZA ne mesurait que les commandes. On savait ce qui se
-- vendait, jamais ce qui avait conduit à la vente — ni, surtout, ce qui n'y
-- avait pas conduit. L'annuaire venait d'ouvrir sans aucun moyen de savoir
-- s'il servait à quelque chose.
--
-- Trois évènements suffisent à répondre : on est venu, on a cherché, on a
-- cliqué sur une boutique. Le terme cherché est le plus précieux des trois :
-- il dit ce que les gens veulent et que personne ne vend.
--
-- CE QUI N'EST PAS ENREGISTRÉ, et ne doit pas l'être : aucune adresse IP,
-- aucun cookie, aucun identifiant de visiteur. On compte des évènements, pas
-- des personnes. « Visites » veut donc dire pages ouvertes, pas visiteurs
-- uniques — et les écrans doivent le dire ainsi.
-- ============================================================

create table if not exists site_events (
  id          uuid primary key default gen_random_uuid(),
  -- 'visit' : une page du site publique ouverte.
  -- 'search' : une recherche de produit dans l'annuaire.
  -- 'shop_click' : une vitrine ouverte depuis l'annuaire.
  kind        text not null check (kind in ('visit', 'search', 'shop_click')),
  path        text,
  -- Terme cherché, déjà mis en minuscules et tronqué côté application.
  term        text,
  business_id uuid references businesses(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Les trois lectures de la console : le décompte par jour, le classement des
-- termes, et celui des boutiques.
create index if not exists site_events_created_idx on site_events (created_at desc);
create index if not exists site_events_kind_idx on site_events (kind, created_at desc);
create index if not exists site_events_term_idx on site_events (term) where term is not null;

-- Personne ne lit ni n'écrit cette table depuis un navigateur.
--
-- Les écritures passent par le serveur, avec la clé de service ; les lectures
-- par la console d'administration, qui l'emploie aussi. Ouvrir la table au
-- rôle anonyme permettrait à n'importe qui de la remplir de faux évènements,
-- et de lire ce que les gens cherchent.
alter table site_events enable row level security;
revoke all on site_events from anon, authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 13))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(13, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
