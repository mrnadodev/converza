-- ============================================================
-- CONVERZA — le compte de sauvegarde est-il vraiment en lecture seule ?
--
-- À lancer dans l'éditeur SQL de la production, après db/role-sauvegarde.sql.
-- Ne modifie rien.
--
-- Chaque ligne doit afficher « OK ». Un seul « NON » et le compte peut faire
-- plus que lire : ne le mettez pas dans un secret GitHub.
-- ============================================================

select 'le compte existe' as controle,
       case when exists (select 1 from pg_roles where rolname = 'sauvegarde')
            then 'OK' else 'NON — lancez db/role-sauvegarde.sql' end as resultat
union all
select 'il peut se connecter',
       case when exists (select 1 from pg_roles where rolname = 'sauvegarde' and rolcanlogin)
            then 'OK' else 'NON' end
union all
select 'il n''est PAS superutilisateur',
       case when exists (select 1 from pg_roles where rolname = 'sauvegarde' and not rolsuper)
            then 'OK' else 'NON — accès total, à corriger' end
union all
select 'il ne peut pas créer de rôles ni de bases',
       case when exists (select 1 from pg_roles where rolname = 'sauvegarde'
                         and not rolcreaterole and not rolcreatedb)
            then 'OK' else 'NON' end
union all
select 'il PEUT lire les boutiques',
       case when has_table_privilege('sauvegarde', 'public.businesses', 'SELECT')
            then 'OK' else 'NON — les sauvegardes seraient vides' end
union all
select 'il PEUT lire les comptes (auth.users)',
       case when has_table_privilege('sauvegarde', 'auth.users', 'SELECT')
            then 'OK' else 'NON — plus personne ne pourrait se reconnecter après restauration' end
union all
select 'il ne peut PAS écrire',
       case when not has_table_privilege('sauvegarde', 'public.businesses', 'INSERT')
             and not has_table_privilege('sauvegarde', 'public.businesses', 'UPDATE')
             and not has_table_privilege('sauvegarde', 'public.businesses', 'DELETE')
            then 'OK' else 'NON — ce compte peut modifier vos données' end
union all
select 'il ne peut PAS supprimer de tables',
       case when not has_table_privilege('sauvegarde', 'public.products', 'TRUNCATE')
            then 'OK' else 'NON — ce compte peut vider vos tables' end;
