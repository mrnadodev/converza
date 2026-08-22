-- ============================================================
-- Migration : Abonnement (plans + paiements manuels)
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

alter table businesses add column if not exists plan text default 'gratis';
alter table businesses add column if not exists plan_until timestamptz;

create table if not exists subscription_payments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  plan         text not null,
  amount_cents bigint not null,
  pay_method   text not null,                 -- moncash | natcash | bank | lot
  pay_ref      text,
  status       text not null default 'pending', -- pending | confirmed | rejected
  created_at   timestamptz not null default now()
);

alter table subscription_payments enable row level security;

create policy sub_pay_isolation on subscription_payments
  using (business_id = my_business_id())
  with check (business_id = my_business_id());

-- Pour activer un plan après vérification du paiement (à faire manuellement) :
--   update businesses set plan='pro', plan_until = now() + interval '1 month' where slug='...';
--   update subscription_payments set status='confirmed' where id='...';
