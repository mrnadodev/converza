-- ============================================================
-- CONVERZA — contrôle d'isolation entre marchands
--
-- À lancer dans l'éditeur SQL, sur la production comme sur le staging.
-- Ne modifie rien : la requête ne fait que lire l'état de la base.
--
-- Chaque table porte les données de plusieurs marchands dans les mêmes
-- lignes. C'est la « row level security » qui empêche un marchand de lire
-- le catalogue, les commandes ou la caisse d'un autre.
--
-- Deux situations très différentes :
--
--   À CORRIGER     — la table n'a pas de RLS du tout. Tout compte connecté
--                    peut lire les données de tous les marchands.
--
--   Rôle de service — la table a la RLS sans aucune règle : personne n'y
--                    accède depuis l'application, seule la console
--                    (clé de service) la lit. C'est voulu pour
--                    platform_settings, security_audit_logs et app_errors.
--                    Toute AUTRE table dans cette liste est suspecte.
-- ============================================================

select
  c.relname as table_name,
  case
    when not c.relrowsecurity then 'À CORRIGER — aucune isolation'
    when c.relname in ('platform_settings', 'security_audit_logs', 'app_errors')
      then 'Rôle de service (attendu)'
    else 'À VÉRIFIER — réservée au rôle de service, est-ce voulu ?'
  end as etat,
  count(p.polname) as nb_regles
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
having not c.relrowsecurity or count(p.polname) = 0
order by c.relrowsecurity, c.relname;
