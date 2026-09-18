-- ============================================================
-- CONVERZA — correctif urgent de la migration 5 (stock)
-- À exécuter dans l'éditeur SQL Supabase si migrate-2026-5-stock.sql a
-- déjà été exécuté. Le script peut être relancé sans risque.
--
-- La colonne products.stock_state est de type énuméré (stock_state) ; la
-- fonction y écrivait du texte sans conversion. Résultat : confirmer une
-- commande, l'annuler ou enregistrer un mouvement de stock échouait.
-- ============================================================

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
  -- stock_state est un type énuméré dans schema.sql : sans conversion
  -- explicite, Postgres refuse le texte renvoyé par stock_state_of.
  update products
  set stock_qty = v_after,
      stock_state = stock_state_of(v_after, stock_threshold)::stock_state
  where id = p_product;
  perform set_config('converza.stock_logged', '0', true);

  insert into stock_movements (business_id, product_id, delta, kind, order_id, note, qty_after, created_by)
  values (p_business, p_product, v_delta, p_kind, p_order, nullif(trim(coalesce(p_note, '')), ''), v_after, coalesce(p_actor, auth.uid()));

  return v_after;
end $$;

-- Les droits restent réservés au serveur.
revoke all on function apply_stock_movement(uuid, uuid, text, numeric, uuid, text, uuid) from public, anon, authenticated;

-- ✅ Correctif appliqué.
