-- ============================================================
-- CONVERZA — migration 6 (Kès, achats, livraison)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-5-stock.sql.
-- Le script peut être relancé sans risque.
--
--   1. Prix d'achat et coût des ventes → bénéfice
--   2. Journal des encaissements → caisse par mode de paiement
--   3. Dépenses
--   4. Fournisseurs et réceptions de marchandise
--   5. Livreur et lien de suivi des commandes
--
-- Lecture : membres de la boutique (RLS). Écriture : uniquement par le
-- serveur (clé service role), après contrôle des droits dans l'application.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRIX D'ACHAT
--    Dans une table à part : la table products est lisible par tout
--    visiteur (vitrine publique), la marge du marchand ne doit pas l'être.
--    Le coût est recopié sur chaque ligne vendue au moment de la vente :
--    changer le prix d'achat plus tard ne fausse pas le bénéfice passé.
-- ------------------------------------------------------------
create table if not exists product_costs (
  product_id  uuid primary key references products(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  cost_cents  bigint not null check (cost_cents >= 0),
  updated_at  timestamptz not null default now()
);
alter table order_items add column if not exists unit_cost_cents bigint;

create or replace function order_items_cost_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.unit_cost_cents is null and new.product_id is not null then
    select cost_cents into new.unit_cost_cents from product_costs where product_id = new.product_id;
  end if;
  return new;
end $$;

drop trigger if exists order_items_cost_snapshot on order_items;
create trigger order_items_cost_snapshot
  before insert on order_items
  for each row execute function order_items_cost_snapshot();

-- ------------------------------------------------------------
-- 2. ENCAISSEMENTS
--    Chaque hausse de amount_paid_cents sur une commande devient une ligne,
--    quel que soit l'écran qui l'a enregistrée.
-- ------------------------------------------------------------
create table if not exists order_payments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  order_id     uuid not null references orders(id) on delete cascade,
  amount_cents bigint not null,
  currency     text not null default 'HTG',
  pay_method   text,
  paid_at      timestamptz not null default now()
);
create index if not exists order_payments_business_idx on order_payments (business_id, paid_at desc);

create or replace function orders_payment_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_delta bigint := coalesce(new.amount_paid_cents, 0) - case when tg_op = 'UPDATE' then coalesce(old.amount_paid_cents, 0) else 0 end;
begin
  if v_delta <> 0 then
    insert into order_payments (business_id, order_id, amount_cents, currency, pay_method, paid_at)
    values (new.business_id, new.id, v_delta, coalesce(new.currency::text, 'HTG'), new.pay_method::text, now());
  end if;
  return new;
end $$;

drop trigger if exists orders_payment_log on orders;
create trigger orders_payment_log
  after insert or update of amount_paid_cents on orders
  for each row execute function orders_payment_log();

-- Reprise de l'existant : un encaissement par commande déjà payée, à sa
-- date de paiement (ou de création).
insert into order_payments (business_id, order_id, amount_cents, currency, pay_method, paid_at)
select o.business_id, o.id, o.amount_paid_cents, coalesce(o.currency::text, 'HTG'), o.pay_method::text, coalesce(o.paid_at, o.created_at)
from orders o
where o.amount_paid_cents > 0
  and not exists (select 1 from order_payments p where p.order_id = o.id);

-- ------------------------------------------------------------
-- 3. DÉPENSES
-- ------------------------------------------------------------
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  currency     text not null default 'HTG',
  category     text not null default 'autre'
               check (category in ('loyer', 'transport', 'electricite', 'communication', 'salaire', 'emballage', 'publicite', 'autre')),
  pay_method   text,
  note         text,
  spent_on     date not null default current_date,
  created_by   uuid,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_business_idx on expenses (business_id, spent_on desc);

-- ------------------------------------------------------------
-- 4. FOURNISSEURS ET RÉCEPTIONS
-- ------------------------------------------------------------
create table if not exists suppliers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  phone_e164  text,
  note        text,
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists purchases (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  supplier_id  uuid references suppliers(id) on delete set null,
  total_cents  bigint not null default 0,
  paid_cents   bigint not null default 0,
  currency     text not null default 'HTG',
  pay_method   text,
  note         text,
  received_on  date not null default current_date,
  created_by   uuid,
  created_at   timestamptz not null default now()
);
create index if not exists purchases_business_idx on purchases (business_id, received_on desc);

create table if not exists purchase_items (
  id              uuid primary key default gen_random_uuid(),
  purchase_id     uuid not null references purchases(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  qty             numeric not null check (qty > 0),
  unit_cost_cents bigint not null check (unit_cost_cents >= 0)
);

-- Enregistre une réception en une seule transaction : l'achat, ses lignes,
-- l'entrée en stock de chaque produit et son nouveau prix d'achat.
-- p_items : [{"product_id": "...", "qty": 10, "unit_cost_cents": 12500}, ...]
create or replace function record_purchase(
  p_business    uuid,
  p_supplier    uuid,
  p_items       jsonb,
  p_paid_cents  bigint,
  p_pay_method  text,
  p_note        text,
  p_received_on date,
  p_actor       uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_purchase uuid;
  v_total    bigint := 0;
  it         jsonb;
  v_product  uuid;
  v_qty      numeric;
  v_cost     bigint;
begin
  if p_supplier is not null and not exists (select 1 from suppliers where id = p_supplier and business_id = p_business) then
    raise exception 'fournisseur introuvable';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'réception vide';
  end if;

  insert into purchases (business_id, supplier_id, paid_cents, pay_method, note, received_on, created_by)
  values (p_business, p_supplier, greatest(coalesce(p_paid_cents, 0), 0), p_pay_method, nullif(trim(coalesce(p_note, '')), ''),
          coalesce(p_received_on, current_date), p_actor)
  returning id into v_purchase;

  for it in select * from jsonb_array_elements(p_items) loop
    v_product := (it ->> 'product_id')::uuid;
    v_qty := (it ->> 'qty')::numeric;
    v_cost := (it ->> 'unit_cost_cents')::bigint;
    if v_qty is null or v_qty <= 0 or v_cost is null or v_cost < 0 then
      raise exception 'ligne invalide';
    end if;
    -- apply_stock_movement vérifie aussi que le produit est à cette boutique.
    perform apply_stock_movement(p_business, v_product, 'entree', v_qty, null, 'Réception', p_actor);
    insert into product_costs (product_id, business_id, cost_cents, updated_at)
    values (v_product, p_business, v_cost, now())
    on conflict (product_id) do update set cost_cents = excluded.cost_cents, updated_at = now();
    insert into purchase_items (purchase_id, product_id, qty, unit_cost_cents) values (v_purchase, v_product, v_qty, v_cost);
    v_total := v_total + round(v_qty * v_cost);
  end loop;

  update purchases set total_cents = v_total, paid_cents = least(paid_cents, v_total) where id = v_purchase;
  return v_purchase;
end $$;

revoke all on function record_purchase(uuid, uuid, jsonb, bigint, text, text, date, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 5. LIVRAISON
--    Le lien de suivi est un jeton aléatoire, sans lien avec le numéro de
--    commande : impossible de deviner la commande d'un autre client.
-- ------------------------------------------------------------
alter table orders add column if not exists courier_name text;
alter table orders add column if not exists courier_phone text;
alter table orders add column if not exists tracking_token uuid default gen_random_uuid();
alter table orders add column if not exists delivered_with_code boolean not null default false;
update orders set tracking_token = gen_random_uuid() where tracking_token is null;
create unique index if not exists orders_tracking_token_idx on orders (tracking_token);

-- ------------------------------------------------------------
-- 6. DROITS
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['product_costs', 'order_payments', 'expenses', 'suppliers', 'purchases', 'purchase_items'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon', t);
  end loop;
end $$;

drop policy if exists product_costs_read on product_costs;
create policy product_costs_read on product_costs for select to authenticated using (business_id = my_business_id());
drop policy if exists order_payments_read on order_payments;
create policy order_payments_read on order_payments for select to authenticated using (business_id = my_business_id());
drop policy if exists expenses_read on expenses;
create policy expenses_read on expenses for select to authenticated using (business_id = my_business_id());
drop policy if exists suppliers_read on suppliers;
create policy suppliers_read on suppliers for select to authenticated using (business_id = my_business_id());
drop policy if exists purchases_read on purchases;
create policy purchases_read on purchases for select to authenticated using (business_id = my_business_id());
drop policy if exists purchase_items_read on purchase_items;
create policy purchase_items_read on purchase_items for select to authenticated
  using (exists (select 1 from purchases p where p.id = purchase_id and p.business_id = my_business_id()));

-- ✅ Migration terminée.
