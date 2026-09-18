-- ============================================================
-- CONVERZA — migration 3 (console super-admin)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-2-schema.sql.
-- Sans elle, la console fonctionne : les colonnes ajoutées ici s'affichent
-- simplement comme « — » (dernière commande, chiffre encaissé).
-- ============================================================

-- ------------------------------------------------------------
-- 1. STATISTIQUES PAR MARCHAND — on ajoute la date de la dernière
--    commande et le montant réellement encaissé, pour distinguer un
--    marchand actif d'un compte ouvert puis abandonné.
-- ------------------------------------------------------------
create or replace view admin_business_stats as
select
  b.id                                   as business_id,
  coalesce(o.orders_count, 0)::bigint    as orders_count,
  coalesce(o.gmv_cents, 0)::bigint       as gmv_cents,
  coalesce(o.paid_cents, 0)::bigint      as paid_cents,
  o.last_order_at                        as last_order_at,
  coalesce(p.products_count, 0)::bigint  as products_count,
  coalesce(m.agents_count, 0)::bigint    as agents_count
from businesses b
left join (
  select t.business_id,
         count(*)                                   as orders_count,
         sum(t.total_cents)                         as gmv_cents,
         sum(least(t.amount_paid_cents, t.total_cents)) as paid_cents,
         max(t.created_at)                          as last_order_at
  from (
    select o.id,
           o.business_id,
           o.created_at,
           o.amount_paid_cents,
           o.delivery_fee_cents
             + coalesce(sum(round(i.unit_price_cents * i.qty)), 0) as total_cents
    from orders o
    left join order_items i on i.order_id = o.id
    where o.status <> 'anile'
    group by o.id, o.business_id, o.created_at, o.amount_paid_cents, o.delivery_fee_cents
  ) t
  group by t.business_id
) o on o.business_id = b.id
left join (
  select business_id, count(*) as products_count
  from products
  group by business_id
) p on p.business_id = b.id
left join (
  select business_id, count(*) filter (where role = 'agent') as agents_count
  from members
  group by business_id
) m on m.business_id = b.id;

-- Cette vue traverse tous les marchands : elle ne doit jamais être exposée
-- aux clés publiques. Seule la clé service role l'interroge.
revoke all on admin_business_stats from anon, authenticated;

-- ------------------------------------------------------------
-- 2. JOURNAL D'AUDIT ADMIN — créé par la migration 2 ; ce rappel ne sert
--    qu'aux installations qui l'auraient sautée. Les colonnes doivent
--    rester celles qu'écrit lib/audit-logger.ts.
-- ------------------------------------------------------------
create table if not exists security_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action      text not null,
  business_id uuid references businesses(id) on delete set null,
  payment_id  uuid references subscription_payments(id) on delete set null,
  details     jsonb not null default '{}'::jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);
create index if not exists security_audit_logs_created_idx on security_audit_logs (created_at desc);
alter table security_audit_logs enable row level security;
revoke all on security_audit_logs from anon, authenticated;

-- ✅ Migration terminée.
