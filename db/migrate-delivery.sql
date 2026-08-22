-- ============================================================
-- Migration : zones de livraison (checkout vitrine)
-- À exécuter dans Supabase SQL Editor sur une base déjà créée.
-- ============================================================

alter table businesses
  add column if not exists delivery_zones jsonb not null default '[]'::jsonb;

-- Zones de démo pour Ti Kòk Boutik (adapte les noms/prix à ta réalité)
update businesses
set delivery_zones = '[
  {"name": "Delmas",    "fee_cents": 5000},
  {"name": "Petyonvil", "fee_cents": 10000},
  {"name": "Tabarre",   "fee_cents": 7500}
]'::jsonb
where slug = 'ti-kok-boutik';
