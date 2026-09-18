-- ============================================================
-- CONVERZA — migration 5 (stock fiable)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-4-numero.sql.
-- Le script peut être relancé sans risque.
--
-- Avant : une vente ne faisait pas baisser la quantité en stock (seul le
-- compteur de ventes montait, et deux fois si une commande repassait par
-- « livré »). Désormais la base tient le stock elle-même :
--   · commande confirmée → le stock baisse, une seule fois ;
--   · commande annulée après confirmation → le stock revient ;
--   · entrées, pertes et corrections passent par un journal.
-- ============================================================

-- ------------------------------------------------------------
-- 1. JOURNAL DES MOUVEMENTS
-- ------------------------------------------------------------
create table if not exists stock_movements (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  -- Positif = entrée, négatif = sortie.
  delta       numeric not null,
  kind        text not null check (kind in ('vente', 'annulation', 'entree', 'perte', 'correction')),
  order_id    uuid references orders(id) on delete set null,
  note        text,
  qty_after   numeric,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_business_idx on stock_movements (business_id, created_at desc);
create index if not exists stock_movements_product_idx on stock_movements (product_id, created_at desc);

-- Lecture pour les membres de la boutique ; aucune écriture directe : tout
-- passe par apply_stock_movement (serveur) ou par les déclencheurs ci-dessous.
alter table stock_movements enable row level security;
revoke all on stock_movements from anon;
drop policy if exists stock_movements_read on stock_movements;
create policy stock_movements_read on stock_movements
  for select to authenticated using (business_id = my_business_id());

-- Une commande ne retire le stock qu'une fois.
alter table orders add column if not exists stock_applied boolean not null default false;

-- Les commandes déjà confirmées avant cette migration ont été comptées par
-- l'ancien code (compteur de ventes) : on les marque comme traitées, sans
-- toucher au stock, pour ne pas les décompter une seconde fois.
update orders set stock_applied = true
where stock_applied = false
  and status in ('konfime_peman', 'sou_wout', 'livre', 'swivi', 'peye');

-- ------------------------------------------------------------
-- 2. ÉTAT DU STOCK — même règle que lib/stock_ai.ts (stockStateFor)
-- ------------------------------------------------------------
create or replace function stock_state_of(p_qty numeric, p_threshold numeric)
returns text language sql immutable as $$
  select case
    when p_qty is null then 'en_stok'
    when p_qty <= 0 then 'fini'
    when p_qty <= coalesce(p_threshold, 5) then 'ba_stok'
    else 'en_stok'
  end;
$$;

-- ------------------------------------------------------------
-- 3. APPLIQUER UN MOUVEMENT
--    p_qty : quantité du mouvement (toujours positive), sauf pour
--    'correction' où c'est le nouveau total compté.
-- ------------------------------------------------------------
create or replace function apply_stock_movement(
  p_business uuid,
  p_product  uuid,
  p_kind     text,
  p_qty      numeric,
  p_order    uuid default null,
  p_note     text default null,
  p_actor    uuid default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_before numeric;
  v_after  numeric;
  v_delta  numeric;
begin
  select stock_qty into v_before from products
  where id = p_product and business_id = p_business
  for update;
  if not found then
    raise exception 'produit introuvable';
  end if;

  v_delta := case p_kind
    when 'entree'     then abs(p_qty)
    when 'annulation' then abs(p_qty)
    when 'vente'      then -abs(p_qty)
    when 'perte'      then -abs(p_qty)
    when 'correction' then greatest(p_qty, 0) - coalesce(v_before, 0)
    else null
  end;
  if v_delta is null then
    raise exception 'type de mouvement inconnu: %', p_kind;
  end if;

  -- Un produit sans quantité suivie (stock_qty vide) le reste, sauf si le
  -- marchand fait une entrée ou un inventaire : il commence alors à le suivre.
  if v_before is null and p_kind not in ('entree', 'correction') then
    v_after := null;
  else
    v_after := greatest(coalesce(v_before, 0) + v_delta, 0);
    -- Le journal garde la variation réelle : une perte de 50 sur un stock
    -- de 4 retire 4 unités, pas 50.
    v_delta := v_after - coalesce(v_before, 0);
  end if;

  -- Signale au déclencheur des produits que ce changement est déjà journalisé.
  perform set_config('converza.stock_logged', '1', true);
  update products
  set stock_qty = v_after,
      stock_state = stock_state_of(v_after, stock_threshold)
  where id = p_product;
  perform set_config('converza.stock_logged', '0', true);

  insert into stock_movements (business_id, product_id, delta, kind, order_id, note, qty_after, created_by)
  values (p_business, p_product, v_delta, p_kind, p_order, nullif(trim(coalesce(p_note, '')), ''), v_after, coalesce(p_actor, auth.uid()));

  return v_after;
end $$;

-- Réservée au serveur (clé service role) et aux déclencheurs : un membre ne
-- doit pas pouvoir l'appeler directement pour une autre boutique.
-- Une version antérieure de ce script avait une signature sans p_actor.
drop function if exists apply_stock_movement(uuid, uuid, text, numeric, uuid, text);
revoke all on function apply_stock_movement(uuid, uuid, text, numeric, uuid, text, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 4. COMMANDES : sortie à la confirmation, retour à l'annulation
-- ------------------------------------------------------------
create or replace function orders_stock_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  it record;
  confirmed boolean := new.status in ('konfime_peman', 'sou_wout', 'livre', 'swivi', 'peye');
  applied boolean := case when tg_op = 'UPDATE' then coalesce(old.stock_applied, false) else false end;
begin
  if confirmed and not applied then
    -- À l'insertion, les articles n'existent pas encore : le déclencheur des
    -- articles les décomptera en voyant stock_applied.
    if tg_op = 'UPDATE' then
      for it in select product_id, qty from order_items where order_id = new.id and product_id is not null loop
        perform apply_stock_movement(new.business_id, it.product_id, 'vente', it.qty, new.id, null);
        update products set sold_count = sold_count + greatest(it.qty::int, 0) where id = it.product_id;
      end loop;
    end if;
    new.stock_applied := true;
  elsif new.status = 'anile' and applied then
    for it in select product_id, qty from order_items where order_id = new.id and product_id is not null loop
      perform apply_stock_movement(new.business_id, it.product_id, 'annulation', it.qty, new.id, null);
      update products set sold_count = greatest(sold_count - greatest(it.qty::int, 0), 0) where id = it.product_id;
    end loop;
    new.stock_applied := false;
  end if;
  return new;
end $$;

drop trigger if exists orders_stock_sync on orders;
create trigger orders_stock_sync
  before insert or update of status on orders
  for each row execute function orders_stock_sync();

create or replace function order_items_stock_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o record;
begin
  select business_id, stock_applied into o from orders where id = new.order_id;
  if new.product_id is not null and coalesce(o.stock_applied, false) then
    perform apply_stock_movement(o.business_id, new.product_id, 'vente', new.qty, new.order_id, null);
    update products set sold_count = sold_count + greatest(new.qty::int, 0) where id = new.product_id;
  end if;
  return new;
end $$;

drop trigger if exists order_items_stock_sync on order_items;
create trigger order_items_stock_sync
  after insert on order_items
  for each row execute function order_items_stock_sync();

-- L'ancien compteur, appelé par l'application à la livraison, n'a plus lieu
-- d'être : on le neutralise pour qu'une ancienne version en ligne ne compte
-- pas les ventes en double pendant le déploiement.
create or replace function increment_product_sold(p_product uuid, p_qty numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  return;
end $$;

-- ------------------------------------------------------------
-- 5. MODIFICATIONS DIRECTES DE LA QUANTITÉ (fiche produit, import Excel)
--    Elles restent possibles, mais sont journalisées comme corrections.
-- ------------------------------------------------------------
create or replace function products_stock_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('converza.stock_logged', true), '0') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.stock_qty is not null and new.stock_qty <> 0 then
      insert into stock_movements (business_id, product_id, delta, kind, note, qty_after)
      values (new.business_id, new.id, new.stock_qty, 'correction', 'stock initial', new.stock_qty);
    end if;
  elsif new.stock_qty is distinct from old.stock_qty then
    insert into stock_movements (business_id, product_id, delta, kind, qty_after)
    values (new.business_id, new.id, coalesce(new.stock_qty, 0) - coalesce(old.stock_qty, 0), 'correction', new.stock_qty);
  end if;
  return new;
end $$;

drop trigger if exists products_stock_log on products;
create trigger products_stock_log
  after insert or update of stock_qty on products
  for each row execute function products_stock_log();

-- ✅ Migration terminée.
