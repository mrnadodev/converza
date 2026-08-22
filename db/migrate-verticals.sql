-- ============================================================
-- Migration : multi-secteurs + best-sellers
-- À exécuter dans Supabase SQL Editor (base déjà créée).
-- ============================================================

alter table businesses add column if not exists business_type text default 'boutik';
alter table products   add column if not exists sold_count integer not null default 0;

-- Fonction d'incrément du compteur de ventes (appelée à la livraison).
create or replace function increment_product_sold(p_product uuid, p_qty numeric)
returns void language sql as $$
  update products set sold_count = sold_count + p_qty::int where id = p_product;
$$;

-- Valeurs de démo pour Ti Kòk Boutik
update businesses set business_type = 'boutik' where slug = 'ti-kok-boutik';

update products set sold_count = 48, category = 'Manje'      where name = 'Ze fre'      and business_id = '11111111-1111-1111-1111-111111111111';
update products set sold_count = 12, category = 'Grenn'      where name = 'Diri Tchako' and business_id = '11111111-1111-1111-1111-111111111111';
update products set sold_count = 31, category = 'Boulanjri'  where name = 'Pen konplè'  and business_id = '11111111-1111-1111-1111-111111111111';
update products set sold_count = 22, category = 'Manje'      where name = 'Lwil'        and business_id = '11111111-1111-1111-1111-111111111111';
