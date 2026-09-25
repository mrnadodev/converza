-- ============================================================
-- CONVERZA — enregistrer le plan « Menu QR Express » à 1 000 gourdes
--
-- À exécuter une fois dans l'éditeur SQL Supabase, sur la production.
-- Le script est rejouable : relancé, il ne crée pas de doublon.
--
-- Pourquoi c'est nécessaire : la console d'administration, l'écran
-- d'abonnement du marchand et la page d'accueil lisent tous les offres
-- depuis cette ligne. Tant que le plan n'y est pas, vous ne pouvez pas en
-- changer le prix depuis la console, et aucun marchand ne peut le choisir.
--
-- Le menu QR reste par ailleurs inclus dans Premium : ce plan-ci s'adresse
-- aux restaurants qui ne veulent que les chevalets.
-- ============================================================

update platform_settings
set value = jsonb_insert(
      value,
      '{1}',                       -- juste après le plan Gratuit
      jsonb_build_object(
        'key',       'qr_express',
        'name',      'Menu QR Express',
        'priceGdes', 1000,
        'tagline',   'Pou restoran, ba ak kafeterya',
        'features',  jsonb_build_array(
          'Tout sa ki nan Gratis',
          'Chevalè QR, jiska 25 tab',
          'Kòmand ak nimewo tab la',
          'Nòt pou kizin nan'
        )
      )
    ),
    updated_at = now()
where key = 'plans'
  and not (value @> '[{"key": "qr_express"}]'::jsonb);

-- Contrôle : quatre offres, dans l'ordre, avec leurs prix.
select
  e->>'key'       as plan,
  e->>'priceGdes' as prix_gourdes
from platform_settings, jsonb_array_elements(value) with ordinality as t(e, rang)
where key = 'plans'
order by rang;
