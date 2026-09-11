-- ============================================================
-- CONVERZA — Migration corrective, FICHIER 2 sur 2
--
-- ⚠️  N'exécuter qu'APRÈS db/migrate-2026-1-enums.sql, dans une requête
--     séparée. Sinon la première mise à jour de statut ci-dessous échoue
--     avec ERROR 55P04, « unsafe use of new value ».
--
-- Autonome : ce fichier ne suppose pas que les migrations de 2025
-- (theme, verticals, delivery, subscription, payment-methods, storage,
-- onboarding, team) ont été jouées. Il les rattrape toutes en tête.
--
-- Idempotent : il peut être rejoué sans risque.
-- ============================================================


-- ------------------------------------------------------------
-- 0. RATTRAPAGE DES MIGRATIONS PRÉCÉDENTES
--    Ce fichier ne suppose plus que les anciennes migrations ont été
--    jouées : toutes les colonnes dont l'app a besoin sont (re)créées
--    ici en `if not exists`. C'est sans effet si elles existent déjà.
-- ------------------------------------------------------------

-- migrate-verticals.sql
alter table businesses add column if not exists business_type text default 'boutik';
alter table products   add column if not exists sold_count integer not null default 0;

-- migrate-theme.sql
alter table businesses add column if not exists employees_count integer;
alter table businesses add column if not exists theme text default 'whatsapp';
alter table businesses add column if not exists layout text default 'auto';

-- migrate-delivery.sql
alter table businesses add column if not exists delivery_zones jsonb not null default '[]'::jsonb;

-- Colonnes du schéma d'origine, reprises ici car la vue publique les sélectionne.
alter table businesses add column if not exists social_instagram text;
alter table businesses add column if not exists social_facebook text;
alter table businesses add column if not exists social_tiktok text;
alter table businesses add column if not exists default_currency currency_code not null default 'HTG';

-- migrate-subscription.sql
alter table businesses add column if not exists plan text default 'gratis';
alter table businesses add column if not exists plan_until timestamptz;

create table if not exists subscription_payments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  plan         text not null,
  amount_cents bigint not null,
  pay_method   text not null,
  pay_ref      text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);
alter table subscription_payments enable row level security;

-- migrate-payment-methods.sql — c'est l'absence de `slogan` qui faisait
-- échouer la création de la vue publique.
alter table businesses add column if not exists slogan text;
alter table businesses add column if not exists promo_text text;
alter table businesses add column if not exists usd_exchange_rate numeric;
alter table businesses add column if not exists bank_accounts text;
alter table businesses add column if not exists zelle_info text;
alter table businesses add column if not exists usdt_trc20_address text;
alter table businesses add column if not exists moncash_number text;
alter table businesses add column if not exists moncash_name text;
alter table businesses add column if not exists moncash_qr_url text;
alter table businesses add column if not exists natcash_number text;
alter table businesses add column if not exists natcash_name text;
alter table businesses add column if not exists natcash_qr_url text;
alter table businesses add column if not exists zelle_qr_url text;
alter table businesses add column if not exists usdt_qr_url text;

-- Galerie produit (jusqu'à 5 photos) utilisée par le catalogue et la vitrine.
alter table products add column if not exists photos text[] not null default '{}';

-- Helper d'isolation multi-tenant, requis par les politiques RLS et par la
-- fonction d'incrément plus bas.
create or replace function my_business_id()
returns uuid language sql stable security definer set search_path = public as $$
  select business_id from members where user_id = auth.uid() limit 1;
$$;


-- ------------------------------------------------------------
-- 0 bis. ALIGNEMENT DES STATUTS EXISTANTS
--    Les anciens libellés restent valides dans l'enum ; on migre les
--    lignes vers le vocabulaire du pipeline à 7 colonnes.
-- ------------------------------------------------------------
update orders set status = 'demand_acha'   where status = 'pou_konfime';
update orders set status = 'konfime_peman' where status = 'peye';


-- ------------------------------------------------------------
-- 1. CODE DE SÉCURITÉ LIVRAISON
--    Il était calculé depuis la référence de commande, donc devinable
--    par n'importe qui connaissant un numéro de commande. On le stocke.
-- ------------------------------------------------------------
alter table orders add column if not exists security_code text;

update orders
set security_code = lpad(((floor(random() * 9000) + 1000))::int::text, 4, '0')
where security_code is null;


-- ------------------------------------------------------------
-- 2. ATTRIBUTION PUBLICITAIRE
--    La source (utm_source) était lue dans l'URL de la vitrine et recopiée
--    dans le message WhatsApp, mais jamais enregistrée. On pouvait compter
--    les visites par campagne, jamais les ventes.
-- ------------------------------------------------------------
alter table orders add column if not exists source text;
create index if not exists orders_source_idx on orders (business_id, source)
  where source is not null;


-- ------------------------------------------------------------
-- 3. PROFIL MÉTIER DES AGENTS
--    Les permissions se décidaient sur des identifiants de personnages de
--    démonstration écrits en dur (marie, jean, pierre...). Un agent réel
--    recruté par un marchand ne correspondait à aucun et retombait sur un
--    profil générique, et rien n'était vérifié côté serveur.
--    Ces clés sont celles que lib/verticals.ts attribue déjà par secteur.
-- ------------------------------------------------------------
alter table members add column if not exists agent_profile text;

alter table members drop constraint if exists members_agent_profile_check;
alter table members add constraint members_agent_profile_check
  check (agent_profile is null or agent_profile in
    ('marie', 'jean', 'pierre', 'florence', 'steeve', 'gerant'));


-- ------------------------------------------------------------
-- 4. JOURNAL D'AUDIT SUPER-ADMIN
--    lib/audit-logger.ts écrivait dans une table inexistante :
--    toutes les actions d'administration étaient perdues.
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
-- Aucune politique : seule la clé service role (super-admin) y accède.


-- ------------------------------------------------------------
-- 5. VITRINE PUBLIQUE — fuite des coordonnées bancaires
--    `public_read_business using (true)` exposait TOUTES les colonnes
--    de businesses à la clé anon : comptes bancaires, MonCash, Natcash,
--    adresse USDT de chaque marchand étaient lisibles publiquement.
--    On remplace cette politique par une vue qui n'expose que les
--    champs nécessaires à la vitrine. La table elle-même redevient
--    lisible uniquement par son propre marchand (politique biz_read).
-- ------------------------------------------------------------
drop policy if exists public_read_business on businesses;

create or replace view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout, plan, social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at
from businesses;

-- La vue appartient au rôle propriétaire du schéma : elle contourne la RLS
-- de businesses, mais ne peut renvoyer que les colonnes listées ci-dessus.
grant select on public_businesses to anon, authenticated;


-- ------------------------------------------------------------
-- 6. STOCKAGE — n'importe quel compte connecté pouvait écraser ou
--    supprimer les images de n'importe quel autre marchand.
--    On restreint aux objets dont l'utilisateur est propriétaire.
-- ------------------------------------------------------------
-- Bucket public "media" (rattrapage de migrate-storage.sql).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media_auth_insert" on storage.objects;
create policy "media_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media_auth_update" on storage.objects;
drop policy if exists "media_auth_delete" on storage.objects;
drop policy if exists "media_owner_update" on storage.objects;
drop policy if exists "media_owner_delete" on storage.objects;

create policy "media_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner = auth.uid())
  with check (bucket_id = 'media' and owner = auth.uid());

create policy "media_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and owner = auth.uid());


-- ------------------------------------------------------------
-- 7. PRODUITS — seuil de rupture utilisé par l'assistant stock.
-- ------------------------------------------------------------
alter table products add column if not exists stock_threshold integer default 5;


-- ------------------------------------------------------------
-- 7 bis. POLITIQUES RLS DE RATTRAPAGE
--    Inscription self-service et paiements d'abonnement. Sans elles, la
--    création de compte marchand échoue silencieusement côté base.
-- ------------------------------------------------------------
drop policy if exists biz_create on businesses;
create policy biz_create on businesses
  for insert to authenticated with check (true);

drop policy if exists member_self_insert on members;
create policy member_self_insert on members
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists sub_pay_isolation on subscription_payments;
drop policy if exists biz_isolation on subscription_payments;
create policy sub_pay_isolation on subscription_payments
  using (business_id = my_business_id())
  with check (business_id = my_business_id());

-- Retrait d'un agent par le propriétaire (jamais un autre propriétaire).
create or replace function my_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from members where user_id = auth.uid() limit 1;
$$;

drop policy if exists member_owner_delete on members;
create policy member_owner_delete on members
  for delete
  using (business_id = my_business_id() and my_role() = 'owner' and role <> 'owner');


-- ------------------------------------------------------------
-- 8. CONFIGURATION PLATEFORME (tarifs, coordonnées de paiement CONVERZA,
--    feature flags). Elle vivait dans des variables de module : chaque
--    instance serverless avait sa copie et un redéploiement remettait les
--    prix d'origine. Un changement de tarif ne tenait pas une heure.
-- ------------------------------------------------------------
create table if not exists platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table platform_settings enable row level security;
-- Aucune politique : lecture et écriture par la clé service role uniquement.


-- ------------------------------------------------------------
-- 9. AGRÉGATS POUR LE TABLEAU DE BORD SUPER-ADMIN
--    Il chargeait toutes les commandes (avec leurs lignes), tous les produits
--    et tous les membres à chaque affichage, pour n'en tirer que des compteurs.
--    Cela tient à quelques dizaines de marchands et expire ensuite.
-- ------------------------------------------------------------
create or replace view admin_business_stats as
select
  b.id                                  as business_id,
  coalesce(o.orders_count, 0)::bigint   as orders_count,
  coalesce(o.gmv_cents, 0)::bigint      as gmv_cents,
  coalesce(p.products_count, 0)::bigint as products_count,
  coalesce(m.agents_count, 0)::bigint   as agents_count
from businesses b
left join (
  select t.business_id, count(*) as orders_count, sum(t.total_cents) as gmv_cents
  from (
    select o.id,
           o.business_id,
           o.delivery_fee_cents
             + coalesce(sum(round(i.unit_price_cents * i.qty)), 0) as total_cents
    from orders o
    left join order_items i on i.order_id = o.id
    where o.status <> 'anile'
    group by o.id, o.business_id, o.delivery_fee_cents
  ) t
  group by t.business_id
) o on o.business_id = b.id
left join (
  select business_id, count(*) as products_count from products group by business_id
) p on p.business_id = b.id
left join (
  select business_id, count(*) as agents_count
  from members where role = 'agent' group by business_id
) m on m.business_id = b.id;

-- Cette vue traverse tous les marchands : elle ne doit jamais être exposée
-- aux clés publiques. Seule la clé service role l'interroge.
revoke all on admin_business_stats from anon, authenticated;


-- ------------------------------------------------------------
-- 10. INCRÉMENT DES VENTES — la fonction s'exécutait avec les droits de
--     l'appelant et ignorait le tenant. On la borne explicitement.
-- ------------------------------------------------------------
create or replace function increment_product_sold(p_product uuid, p_qty numeric)
returns void language sql security definer set search_path = public as $$
  update products
  set sold_count = sold_count + greatest(p_qty::int, 0)
  where id = p_product
    and business_id = my_business_id();
$$;


-- ✅ Migration terminée.
