-- ============================================================
-- CONVERZA — contrôle d'isolation entre marchands
--
-- À lancer dans l'éditeur SQL, sur la production comme sur le staging.
-- Ne modifie rien : la requête ne fait que lire l'état de la base.
--
-- Chaque table porte les données de plusieurs marchands dans les mêmes
-- lignes. C'est la « row level security » qui empêche un marchand de lire
-- le catalogue, les commandes ou la caisse d'un autre. Une table qui en
-- est dépourvue, ou qui en a sans aucune règle, ouvre tout à tout le monde.
--
-- Une table saine n'apparaît pas dans le résultat.
-- Résultat vide = rien à corriger.
-- ============================================================

select
  c.relname as table_name,
  case
    when not c.relrowsecurity then 'RLS DÉSACTIVÉE — table lisible par tout compte connecté'
    when count(p.polname) = 0 then 'RLS activée mais AUCUNE règle — table inaccessible, ou ouverte au rôle de service seul'
  end as probleme,
  count(p.polname) as nb_regles
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
having not c.relrowsecurity or count(p.polname) = 0
order by c.relrowsecurity, c.relname;
