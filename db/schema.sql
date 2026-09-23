-- ============================================================
-- CONVERZA — Schéma de base de données (Supabase / PostgreSQL)
-- WhatsApp Sales & Customer Management pour les entreprises en Haïti
-- Multi-tenant : chaque ligne appartient à un business_id.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type member_role   as enum ('owner', 'agent');
-- Cycle de vie de la commande = pipeline de vente :
-- à confirmer -> payé -> livré -> suivi (relance/fidélisation) ; annulé en sortie.
-- Les 7 colonnes du Kanban + les deux libellés historiques (pou_konfime/peye)
-- conservés pour les bases existantes.
create type order_status  as enum (
  'demand_acha', 'kontak', 'metod_peman', 'konfime_peman', 'sou_wout',
  'livre', 'swivi', 'anile', 'pou_konfime', 'peye'
);
create type followup_kind as enum ('det', 'rekomand', 'satisfaksyon'); -- dette / re-commande / satisfaction
create type pay_method    as enum (
  'moncash', 'natcash', 'kach', 'lot',                    -- kach = cash, lot = autre
  'crypto_usdt', 'zelle', 'banque_locale',
  'unibank_htg', 'unibank_usd', 'buh_htg', 'buh_usd', 'sogebank_htg', 'sogebank_usd'
);
create type currency_code as enum ('HTG', 'USD');
create type stock_state   as enum ('en_stok', 'ba_stok', 'fini');            -- en stock / stock bas / épuisé

-- ------------------------------------------------------------
-- BUSINESSES (le tenant)
-- ------------------------------------------------------------
create table businesses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,                 -- pour l'URL publique de la vitrine : converza.ht/b/<slug>
  category      text,                                 -- ex: "Boutik alimantè"
  address       text,                                 -- ex: "Delmas 31, Pòtoprens"
  phone_e164    text,                                 -- numéro WhatsApp principal, format +509...
  logo_url      text,                                 -- Supabase Storage
  cover_url     text,                                 -- bannière de couverture (écran #0)
  hours         text,                                 -- ex: "7am–7pm"
  business_type text default 'boutik',                 -- secteur : supermarket, autoparts, restoran, boulanjri… (voir lib/verticals.ts)
  employees_count integer,                             -- nb d'employés (info onboarding)
  theme         text default 'whatsapp',               -- thème vitrine (voir lib/themes.ts)
  layout        text default 'auto',                   -- disposition cartes : auto | grid | menu
  plan          text default 'gratis',                 -- abonnement : gratis | pro | premium
  plan_until    timestamptz,
  -- Réseaux sociaux : la vitrine sert de page d'atterrissage aux pubs
  -- TikTok/Instagram/Facebook, et renvoie le client vers la commande WhatsApp.
  social_instagram text,                              -- URL ou @handle
  social_facebook  text,
  social_tiktok    text,
  -- Zones de livraison : [{ "name": "Delmas", "fee_cents": 5000 }, ...]
  delivery_zones   jsonb not null default '[]'::jsonb,
  default_currency currency_code not null default 'HTG',
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MEMBERS (utilisateurs de l'app — liés à auth.users de Supabase)
-- Un employé peut appartenir à un seul business dans le MVP.
-- ------------------------------------------------------------
create table members (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  full_name     text not null,
  role          member_role not null default 'agent',
  -- Profil métier, qui décide des colonnes du pipeline et des écrans
  -- accessibles (voir lib/rbac.ts et les rôles par secteur de lib/verticals.ts).
  agent_profile text check (agent_profile is null or agent_profile in
                  ('marie', 'jean', 'pierre', 'florence', 'steeve', 'gerant')),
  created_at    timestamptz not null default now(),
  unique (user_id)
);
create index on members (business_id);

-- ------------------------------------------------------------
-- CUSTOMERS (kliyan) — écran Fich kliyan
-- ------------------------------------------------------------
create table customers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  full_name     text not null,
  phone_e164    text not null,                        -- sert à générer le lien wa.me
  address       text,
  tags          text[] not null default '{}',         -- ex: {'kliyan_fidel','nouvo_kliyan'}
  note          text,
  created_at    timestamptz not null default now(),
  unique (business_id, phone_e164)
);
create index on customers (business_id);
create index on customers (business_id, full_name);

-- ------------------------------------------------------------
-- PRODUCTS (pwodwi) — écran Katalòg
-- Montants stockés en centimes pour éviter les erreurs de flottant.
-- ------------------------------------------------------------
create table products (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  category      text,                                 -- ex: "Manje", "Bwason"
  price_cents   bigint not null check (price_cents >= 0),
  currency      currency_code not null default 'HTG',
  unit          text,                                 -- ex: "douzèn", "sak", "boutèy"
  stock_qty     integer,                              -- null = non suivi
  stock_threshold integer default 5,                  -- seuil d'alerte rupture pour l'IA
  stock_state   stock_state not null default 'en_stok',
  photo_url     text,
  photos        text[] not null default '{}',         -- galerie jusqu'à 5 photos
  sold_count    integer not null default 0,           -- nb d'unités vendues (best-sellers)
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on products (business_id) where is_active;

-- ------------------------------------------------------------
-- ORDERS (kòmand) — écran Kòmand + suivi de statut
-- ------------------------------------------------------------
create table orders (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  ref           text not null,                        -- ex: "0142", unique par business
  customer_id   uuid references customers(id) on delete set null,
  status        order_status not null default 'demand_acha',
  security_code text,                                 -- code livraison 4 chiffres, tiré au hasard à la création
  currency      currency_code not null default 'HTG',
  delivery_fee_cents bigint not null default 0,
  amount_paid_cents  bigint not null default 0,       -- vente à crédit : reste dû = total - payé
  delivery_addr text,
  pay_method    pay_method,
  pay_ref       text,                                 -- réf MonCash/Natcash
  assigned_to   uuid references members(id) on delete set null, -- "→ Jean" dans l'inbox
  note          text,
  source        text,                                 -- utm_source de la pub qui a amené la commande
  created_at    timestamptz not null default now(),
  paid_at       timestamptz,
  delivered_at  timestamptz,
  -- Étape Follow-up (swivi) : quand relancer, et si c'est fait.
  next_followup_at timestamptz,
  followed_up_at   timestamptz,
  unique (business_id, ref)
);
create index on orders (business_id, status);
create index on orders (business_id, customer_id);
create index on orders (business_id, created_at desc);
create index on orders (business_id, next_followup_at) where next_followup_at is not null;
create index on orders (business_id, source) where source is not null;

-- ------------------------------------------------------------
-- ORDER ITEMS (atik yo dans une kòmand)
-- On copie name/price au moment de la vente (snapshot historique).
-- ------------------------------------------------------------
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  name          text not null,
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  qty           numeric(10,2) not null check (qty > 0),
  created_at    timestamptz not null default now()
);
create index on order_items (order_id);

-- Total d'une commande (sous-total items + livraison), en centimes.
create or replace function order_total_cents(p_order uuid)
returns bigint language sql stable as $$
  select coalesce((select sum(round(unit_price_cents * qty)) from order_items where order_id = p_order), 0)
       + coalesce((select delivery_fee_cents from orders where id = p_order), 0);
$$;

-- Business_id du membre connecté.
--
-- Défini ici, avant tout ce qui s'en sert : PostgreSQL valide le corps d'une
-- fonction SQL au moment où il la crée. Placé plus bas, ce fichier ne pouvait
-- pas créer une base à partir de zéro — il n'avait jamais servi qu'à décrire
-- une base déjà construite par les migrations.
create or replace function my_business_id()
returns uuid language sql stable security definer set search_path = public as $$
  select business_id from members where user_id = auth.uid() limit 1;
$$;

-- Incrémente le compteur de ventes d'un produit (best-sellers).
create or replace function increment_product_sold(p_product uuid, p_qty numeric)
returns void language sql security definer set search_path = public as $$
  update products
  set sold_count = sold_count + greatest(p_qty::int, 0)
  where id = p_product
    and business_id = my_business_id();
$$;

-- Reste dû (dette) d'une commande = total - déjà payé.
create or replace function order_owed_cents(p_order uuid)
returns bigint language sql stable as $$
  select greatest(order_total_cents(p_order)
       - coalesce((select amount_paid_cents from orders where id = p_order), 0), 0);
$$;

-- Vue « Relans jodi a » : commandes avec une dette OU une relance planifiée échue.
-- security_invoker => la RLS des tables sous-jacentes s'applique au lecteur.
create or replace view followups_due
with (security_invoker = on) as
select o.id as order_id, o.business_id, o.ref, o.status,
       c.id as customer_id, c.full_name, c.phone_e164,
       order_owed_cents(o.id) as owed_cents,
       o.next_followup_at
from orders o
left join customers c on c.id = o.customer_id
where o.status <> 'anile'
  and ( order_owed_cents(o.id) > 0
        or (o.next_followup_at is not null
            and o.next_followup_at <= now()
            and o.followed_up_at is null) );

-- ------------------------------------------------------------
-- QUICK REPLIES (repons rapid) — écran Chat
-- ------------------------------------------------------------
create table quick_replies (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  label         text not null,                        -- ce qui s'affiche sur le chip
  body          text not null,                        -- le message envoyé (Kreyòl)
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index on quick_replies (business_id, sort_order);

-- ------------------------------------------------------------
-- SUBSCRIPTION PAYMENTS (paiements d'abonnement manuels)
-- ------------------------------------------------------------
create table subscription_payments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  plan         text not null,
  amount_cents bigint not null,
  pay_method   text not null,
  pay_ref      text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);
create index on subscription_payments (business_id, created_at desc);

-- ------------------------------------------------------------
-- SECURITY AUDIT LOGS — trace des actions du super-admin plateforme.
-- Accessible uniquement via la clé service role (aucune politique RLS).
-- ------------------------------------------------------------
create table security_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action      text not null,
  business_id uuid references businesses(id) on delete set null,
  payment_id  uuid references subscription_payments(id) on delete set null,
  details     jsonb not null default '{}'::jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);
create index on security_audit_logs (created_at desc);

-- ------------------------------------------------------------
-- PLATFORM SETTINGS — tarifs, coordonnées de paiement CONVERZA,
-- feature flags. Une ligne par clé, lue/écrite via la clé service role.
-- ------------------------------------------------------------
create table platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — isolation multi-tenant
-- Un membre ne voit que les données de SON business.
-- ============================================================
alter table businesses    enable row level security;
alter table members       enable row level security;
alter table customers     enable row level security;
alter table products      enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table quick_replies enable row level security;
alter table subscription_payments enable row level security;
alter table security_audit_logs enable row level security;
alter table platform_settings  enable row level security;

-- Politique générique : lecture/écriture uniquement sur son business.
create policy biz_isolation on customers
  using (business_id = my_business_id()) with check (business_id = my_business_id());
create policy biz_isolation on products
  using (business_id = my_business_id()) with check (business_id = my_business_id());
create policy biz_isolation on orders
  using (business_id = my_business_id()) with check (business_id = my_business_id());
create policy biz_isolation on quick_replies
  using (business_id = my_business_id()) with check (business_id = my_business_id());
create policy biz_isolation on subscription_payments
  using (business_id = my_business_id()) with check (business_id = my_business_id());

create policy biz_read on businesses
  for select using (id = my_business_id());
create policy members_read on members
  for select using (business_id = my_business_id());

-- Lecture PUBLIQUE pour la vitrine partageable (/b/<slug>).
-- On passe par une vue : une politique `using (true)` sur la table exposerait
-- aussi les comptes bancaires, MonCash, Natcash et l'adresse USDT du marchand.
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout, plan, social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, created_at
from businesses;
grant select on public_businesses to anon, authenticated;

create policy public_read_products on products
  for select using (is_active);

-- Le propriétaire peut modifier sa propre fiche business.
create policy biz_update on businesses
  for update using (id = my_business_id()) with check (id = my_business_id());

-- Inscription self-service : un utilisateur authentifié crée son business
-- puis s'y rattache comme owner.
create policy biz_create on businesses
  for insert to authenticated with check (true);
create policy member_self_insert on members
  for insert to authenticated with check (user_id = auth.uid());

-- L'owner peut retirer un agent de son business (jamais un autre owner).
create or replace function my_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from members where user_id = auth.uid() limit 1;
$$;
create policy member_owner_delete on members
  for delete
  using (business_id = my_business_id() and my_role() = 'owner' and role <> 'owner');

-- order_items suit la commande parente.
create policy biz_isolation on order_items
  using (exists (select 1 from orders o where o.id = order_id and o.business_id = my_business_id()))
  with check (exists (select 1 from orders o where o.id = order_id and o.business_id = my_business_id()));
