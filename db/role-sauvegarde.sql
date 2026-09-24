-- ============================================================
-- CONVERZA — un compte de base réservé aux sauvegardes
--
-- À exécuter une fois dans l'éditeur SQL Supabase, sur la production.
--
-- Le mot de passe « postgres » que Supabase vous donne permet de tout lire
-- ET de tout détruire. Le confier à un automate, c'est accepter qu'une fuite
-- de ce secret coûte la base entière.
--
-- Ce rôle-ci ne peut que LIRE. S'il fuite, on copie vos données — c'est grave,
-- mais on ne les efface pas, et vous gardez de quoi repartir.
--
-- REMPLACEZ le mot de passe ci-dessous par une chaîne longue et aléatoire.
-- Sous PowerShell, pour en fabriquer une :
--   [Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
-- ============================================================

-- 1. Le compte.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'sauvegarde') then
    create role sauvegarde with login password 'REMPLACEZ_MOI';
  end if;
end $$;

-- 2. Lecture seule sur tout, aujourd'hui et demain.
--    pg_read_all_data couvre les tables créées par les prochaines migrations :
--    sans lui, une nouvelle table sortirait silencieusement des sauvegardes.
grant pg_read_all_data to sauvegarde;

-- 3. De quoi traverser les schémas que pg_dump doit lire.
grant usage on schema public, auth to sauvegarde;

-- 4. Rien d'autre. Ni écriture, ni suppression, ni création.
revoke all on database postgres from sauvegarde;
grant connect on database postgres to sauvegarde;

-- ✅ Terminé. La chaîne à mettre dans le secret GitHub devient :
--    postgresql://sauvegarde:<le-mot-de-passe>@<hôte-du-session-pooler>:5432/postgres
--
-- L'hôte se lit dans Settings -> Database -> Connection string -> Session pooler.
-- Attention : l'utilisateur y est écrit « postgres.<référence> ». Pour ce rôle,
-- remplacez-le par « sauvegarde.<référence> » — le pooler attend ce format.
