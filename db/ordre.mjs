// L'ordre dans lequel un projet Supabase neuf doit être monté.
//
// Les fichiers db/migrate-*.sql sans numéro (delivery, team, theme, verticals,
// storage, onboarding, payment-methods, subscription) sont des rattrapages
// historiques déjà absorbés par les migrations numérotées : ils ne font pas
// partie du montage.
export const ORDRE_MONTAGE = [
  "schema.sql",
  "migrate-2026-1-enums.sql",
  "migrate-2026-2-schema.sql",
  "migrate-2026-3-admin.sql",
  "migrate-2026-4-numero.sql",
  "migrate-2026-5-stock.sql",
  "migrate-2026-5b-correctif-stock.sql",
  "migrate-2026-6-gestion.sql",
  "migrate-2026-7-support.sql",
  "migrate-2026-8-abonnement.sql",
  "migrate-2026-9-vitrine-accueil.sql",
  "migrate-2026-10-vitrine-produits.sql",
  "migrate-2026-11-annuaire.sql",
  "migrate-2026-12-horaires.sql",
];
