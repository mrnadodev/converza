-- ============================================================
-- CONVERZA — montage complet d'une base neuve
--
-- GÉNÉRÉ par scripts/build-staging-sql.mjs — ne pas modifier à la main.
-- Source : les 14 fichiers de db/, dans l'ordre de montage.
--
-- À coller dans l'éditeur SQL d'un projet Supabase VIDE.
-- Ne jamais lancer sur la production : le script recrée tout.
--
-- Après exécution, lancer db/verifier-rls.sql pour contrôler l'isolation.
-- ============================================================


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 1 / 14 — schema.sql
-- ══════════════════════════════════════════════════════════

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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 2 / 14 — migrate-2026-1-enums.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — Migration corrective, FICHIER 1 sur 2
--
-- ⚠️  EXÉCUTER CE FICHIER SEUL, PUIS SEULEMENT APRÈS LE FICHIER 2
--     (db/migrate-2026-2-schema.sql).
--
-- Pourquoi deux fichiers : l'éditeur SQL de Supabase enveloppe tout ce
-- qu'on lui envoie dans UNE transaction, et PostgreSQL refuse d'utiliser
-- une valeur d'enum dans la transaction qui vient de la créer
-- (ERROR 55P04, « unsafe use of new value »). Les ajouts d'enum doivent
-- donc être validés avant que la suite ne s'en serve.
--
-- Prérequis : db/schema.sql puis les migrations précédentes
-- (notamment migrate-payment-methods.sql, qui crée slogan / promo_text).
--
-- Idempotent : ce fichier peut être rejoué sans risque.
-- ============================================================


-- 1. PIPELINE — les 7 étapes utilisées par l'app n'existaient pas
--    dans l'enum. Sans ça, déplacer une commande vers « Kontak »,
--    « Mwayen Peman », « Konfime Pèman » ou « Sou wout » échoue en base.
alter type order_status add value if not exists 'demand_acha';
alter type order_status add value if not exists 'kontak';
alter type order_status add value if not exists 'metod_peman';
alter type order_status add value if not exists 'konfime_peman';
alter type order_status add value if not exists 'sou_wout';


-- 2. MOYENS DE PAIEMENT — l'app propose Zelle, USDT et les banques
--    locales ; l'enum n'en connaissait aucun.
alter type pay_method add value if not exists 'crypto_usdt';
alter type pay_method add value if not exists 'zelle';
alter type pay_method add value if not exists 'unibank_htg';
alter type pay_method add value if not exists 'unibank_usd';
alter type pay_method add value if not exists 'buh_htg';
alter type pay_method add value if not exists 'buh_usd';
alter type pay_method add value if not exists 'sogebank_htg';
alter type pay_method add value if not exists 'sogebank_usd';
alter type pay_method add value if not exists 'banque_locale';


-- ✅ Fichier 1 terminé. Ouvrir maintenant db/migrate-2026-2-schema.sql
--    dans une NOUVELLE requête et l'exécuter.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 3 / 14 — migrate-2026-2-schema.sql
-- ══════════════════════════════════════════════════════════

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

-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 4 / 14 — migrate-2026-3-admin.sql
-- ══════════════════════════════════════════════════════════

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
--    `create or replace view` n'accepte de nouvelles colonnes qu'en fin de
--    liste : les cinq premières restent dans l'ordre de la migration 2.
-- ------------------------------------------------------------
create or replace view admin_business_stats as
select
  b.id                                   as business_id,
  coalesce(o.orders_count, 0)::bigint    as orders_count,
  coalesce(o.gmv_cents, 0)::bigint       as gmv_cents,
  coalesce(p.products_count, 0)::bigint  as products_count,
  coalesce(m.agents_count, 0)::bigint    as agents_count,
  coalesce(o.paid_cents, 0)::bigint      as paid_cents,
  o.last_order_at                        as last_order_at
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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 5 / 14 — migrate-2026-4-numero.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 4 (changement de numéro WhatsApp)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-3-admin.sql.
-- Le script peut être relancé sans risque.
--
-- Un compte WhatsApp piraté ne doit plus coûter sa clientèle au marchand :
-- il demande un nouveau numéro avec preuves, CONVERZA vérifie, et la vitrine
-- bascule. En contrepartie, le numéro ne se modifie plus librement : c'est
-- lui qui reçoit les commandes et l'argent des clients.
-- ============================================================

-- ------------------------------------------------------------
-- 1. HISTORIQUE DU NUMÉRO SUR LA BOUTIQUE
-- ------------------------------------------------------------
alter table businesses add column if not exists previous_phone_e164 text;
alter table businesses add column if not exists phone_changed_at    timestamptz;
-- Fin du bandeau « notre numéro a changé » sur la vitrine. Le marchand peut
-- le retirer plus tôt, pas le prolonger.
alter table businesses add column if not exists phone_notice_until  timestamptz;

-- ------------------------------------------------------------
-- 2. COLONNES PROTÉGÉES
--    La politique biz_update laisse un membre modifier sa boutique. Sans ce
--    garde-fou, un appel direct à l'API (hors application) permettait de
--    changer le numéro sans vérification, ou de s'attribuer le plan Premium.
--    Seule la clé service role (console admin, validations) peut les écrire.
-- ------------------------------------------------------------
create or replace function protect_business_columns()
returns trigger language plpgsql as $$
begin
  -- auth.role() est vide dans l'éditeur SQL et vaut 'service_role' pour la
  -- console : dans ces deux cas on laisse passer.
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'gratis';
    new.plan_until := null;
    new.previous_phone_e164 := null;
    new.phone_changed_at := null;
    new.phone_notice_until := null;
    return new;
  end if;

  new.plan := old.plan;
  new.plan_until := old.plan_until;
  new.previous_phone_e164 := old.previous_phone_e164;
  new.phone_changed_at := old.phone_changed_at;
  -- Un premier numéro peut être saisi librement ; le remplacer passe par une
  -- demande validée.
  if old.phone_e164 is not null and old.phone_e164 <> '' then
    new.phone_e164 := old.phone_e164;
  end if;
  -- Le bandeau peut être retiré plus tôt, jamais prolongé.
  if new.phone_notice_until is distinct from old.phone_notice_until
     and not (old.phone_notice_until is not null
              and new.phone_notice_until is not null
              and new.phone_notice_until <= old.phone_notice_until) then
    new.phone_notice_until := old.phone_notice_until;
  end if;
  return new;
end $$;

drop trigger if exists protect_business_columns on businesses;
create trigger protect_business_columns
  before insert or update on businesses
  for each row execute function protect_business_columns();

-- ------------------------------------------------------------
-- 3. VITRINE PUBLIQUE — les colonnes du bandeau, ajoutées en fin de vue
--    (create or replace view n'accepte de nouvelles colonnes qu'à la fin).
-- ------------------------------------------------------------
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout, plan, social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until
from businesses;
grant select on public_businesses to anon, authenticated;

-- ------------------------------------------------------------
-- 4. DEMANDES DE CHANGEMENT
-- ------------------------------------------------------------
create table if not exists phone_change_requests (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  requested_by    uuid not null,
  old_phone_e164  text,
  new_phone_e164  text not null,
  reason          text not null check (reason in ('piratage', 'perte', 'autre')),
  note            text,
  notice_days     int  not null default 7 check (notice_days in (0, 3, 7, 14)),
  -- Chemins dans le bucket privé ; vidés dès la décision prise.
  proof_paths     text[] not null default '{}',
  id_doc_path     text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_email     text,
  admin_note      text,
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  docs_purged_at  timestamptz
);
create index if not exists phone_change_requests_status_idx on phone_change_requests (status, created_at desc);
create index if not exists phone_change_requests_business_idx on phone_change_requests (business_id, created_at desc);
-- Une seule demande en cours par boutique.
create unique index if not exists phone_change_requests_one_pending
  on phone_change_requests (business_id) where status = 'pending';

-- Toutes les écritures passent par le serveur (clé service role) : il vérifie
-- que l'auteur est le propriétaire. Le marchand peut seulement relire ses
-- demandes.
alter table phone_change_requests enable row level security;
revoke all on phone_change_requests from anon;
drop policy if exists phone_change_read on phone_change_requests;
create policy phone_change_read on phone_change_requests
  for select to authenticated using (business_id = my_business_id());

-- ------------------------------------------------------------
-- 5. PIÈCES JUSTIFICATIVES — bucket PRIVÉ
--    Aucune politique de lecture : pièces d'identité et captures ne sont
--    accessibles que par des liens signés de courte durée générés pour la
--    console, puis supprimées après décision.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('verification', 'verification', false)
on conflict (id) do update set public = false;

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 6 / 14 — migrate-2026-5-stock.sql
-- ══════════════════════════════════════════════════════════

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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 7 / 14 — migrate-2026-5b-correctif-stock.sql
-- ══════════════════════════════════════════════════════════

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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 8 / 14 — migrate-2026-6-gestion.sql
-- ══════════════════════════════════════════════════════════

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


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 9 / 14 — migrate-2026-7-support.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 7 (support et supervision)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-6-gestion.sql.
-- Le script peut être relancé sans risque.
--
--   1. Suspension d'un compte marchand (fraude, impayé)
--   2. Journal des erreurs techniques, visible dans la console
-- ============================================================

-- ------------------------------------------------------------
-- 1. SUSPENSION
--    Un compte suspendu garde ses données : il ne peut plus travailler
--    dans l'application, et sa vitrine publique disparaît.
-- ------------------------------------------------------------
alter table businesses add column if not exists suspended_at timestamptz;
alter table businesses add column if not exists suspended_reason text;

-- Le marchand ne peut pas lever sa propre suspension : seule la clé service
-- role (console) écrit ces colonnes. On complète le verrou de la migration 4.
create or replace function protect_business_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), 'service_role') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'gratis';
    new.plan_until := null;
    new.previous_phone_e164 := null;
    new.phone_changed_at := null;
    new.phone_notice_until := null;
    new.suspended_at := null;
    new.suspended_reason := null;
    return new;
  end if;

  new.plan := old.plan;
  new.plan_until := old.plan_until;
  new.previous_phone_e164 := old.previous_phone_e164;
  new.phone_changed_at := old.phone_changed_at;
  new.suspended_at := old.suspended_at;
  new.suspended_reason := old.suspended_reason;
  if old.phone_e164 is not null and old.phone_e164 <> '' then
    new.phone_e164 := old.phone_e164;
  end if;
  if new.phone_notice_until is distinct from old.phone_notice_until
     and not (old.phone_notice_until is not null
              and new.phone_notice_until is not null
              and new.phone_notice_until <= old.phone_notice_until) then
    new.phone_notice_until := old.phone_notice_until;
  end if;
  return new;
end $$;

drop trigger if exists protect_business_columns on businesses;
create trigger protect_business_columns
  before insert or update on businesses
  for each row execute function protect_business_columns();

-- La vitrine publique ignore les boutiques suspendues.
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout, plan, social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- ------------------------------------------------------------
-- 2. ERREURS TECHNIQUES
--    Écrites par le serveur quand une opération échoue. Sans ce journal,
--    une panne ne se voit que si un marchand téléphone.
-- ------------------------------------------------------------
create table if not exists app_errors (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null,
  message     text not null,
  business_id uuid references businesses(id) on delete set null,
  user_id     uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists app_errors_created_idx on app_errors (created_at desc);

-- Aucune lecture par les marchands : c'est un journal d'exploitation.
alter table app_errors enable row level security;
revoke all on app_errors from anon, authenticated;

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 10 / 14 — migrate-2026-8-abonnement.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 8 (abonnement réellement dû)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-7-support.sql.
-- Le script peut être relancé sans risque.
--
-- Problème corrigé : la vitrine publique lisait `plan` tel qu'écrit en base.
-- Après l'échéance, la colonne garde la valeur `pro` ou `premium`, donc un
-- marchand qui payait un seul mois gardait les mises en page payantes pour
-- toujours. La vue renvoie désormais le plan réellement dû.
--
-- Trois jours de tolérance : entre le paiement du marchand et sa vérification
-- par la console, la vitrine ne doit pas changer d'apparence.
-- `plan_until` vide = plan accordé depuis la console, sans échéance connue :
-- on le laisse actif, c'est une décision humaine.
-- ============================================================

-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout,
  case
    when coalesce(plan, 'gratis') <> 'gratis'
         and plan_until is not null
         and plan_until + interval '3 days' < now()
    then 'gratis'
    else coalesce(plan, 'gratis')
  end as plan,
  social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- ------------------------------------------------------------
-- Repère de version : la console lit cette clé pour dire au super-admin
-- quelles migrations manquent sur la base connectée. Une vue ne se
-- reconnaît pas depuis l'application ; ce repère, si.
-- ------------------------------------------------------------
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 8))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(8, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 11 / 14 — migrate-2026-9-vitrine-accueil.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 9 (présence sur la page d'accueil)
-- À exécuter dans l'éditeur SQL Supabase après migrate-2026-8-abonnement.sql.
-- Le script peut être relancé sans risque.
--
-- La page d'accueil présente jusqu'à quatre boutiques qui vendent, avec leur
-- nom, leur logo et un lien vers leur vitrine. Un commerçant peut le refuser
-- depuis ses réglages : ce choix vit ici.
--
-- Par défaut, une boutique peut être présentée (false = pas de refus). Le
-- commerçant écrit lui-même cette colonne : elle ne fait pas partie des
-- colonnes verrouillées par protect_business_columns.
-- ============================================================

alter table businesses add column if not exists showcase_opt_out boolean not null default false;

-- La vue publique reprend exactement la migration 8 — plan réellement dû,
-- boutiques suspendues exclues — et ajoute la colonne en dernière position :
-- create or replace view n'accepte de nouvelles colonnes qu'à la fin.
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent d'ordre ou
-- de nom : « create or replace » seul empêchait de monter une base neuve, car
-- chaque migration redéfinit la vue avec une colonne de plus. On la supprime
-- d'abord ; les droits sont réattribués juste en dessous.
drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout,
  case
    when coalesce(plan, 'gratis') <> 'gratis'
         and plan_until is not null
         and plan_until + interval '3 days' < now()
    then 'gratis'
    else coalesce(plan, 'gratis')
  end as plan,
  social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until,
  showcase_opt_out
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- Repère de version lu par la console. Il ne recule jamais.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 9))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(9, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 12 / 14 — migrate-2026-10-vitrine-produits.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 10 (produits mis en vitrine)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-9-vitrine-accueil.sql. Le script est rejouable.
--
-- Le marchand choisit lui-même les produits qui s'affichent « À la une » sur
-- sa vitrine. Les autres restent visibles dans le catalogue complet : rien
-- n'est caché aux clients, c'est l'ordre de mise en avant qui change.
--
-- Tant qu'aucun produit n'est choisi, la vitrine garde son classement
-- automatique (promotions puis meilleures ventes) : une boutique qui ne touche
-- à rien ne change pas d'apparence.
-- ============================================================

alter table products add column if not exists in_showcase boolean not null default false;

-- La vitrine publique lit les produits actifs : l'index sert au tri des
-- produits mis en avant d'une boutique.
create index if not exists products_showcase_idx on products (business_id, in_showcase) where in_showcase;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 10))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(10, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 13 / 14 — migrate-2026-11-annuaire.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 11 (annuaire des boutiques, fournisseurs partagés)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-10-vitrine-produits.sql. Le script est rejouable.
--
-- Deux ouvertures vers l'extérieur, et deux réglages opposés — à dessein.
--
-- 1. L'ANNUAIRE DES BOUTIQUES est ouvert par défaut. Un marchand publie déjà
--    sa vitrine et la partage ; y figurer ne révèle rien de plus, et un
--    annuaire à moitié vide ne rend service à personne. Le retrait reste
--    possible d'une case dans les Paramètres.
--
-- 2. LES FOURNISSEURS sont privés par défaut. Un carnet d'adresses
--    fournisseurs est un actif concurrentiel : le marchand qui saisit un
--    numéro ne s'attend pas à ce que la boutique d'en face le lise. Le
--    partage est donc un choix explicite, fournisseur par fournisseur.
--
-- La différence tient à qui possède la donnée. La vitrine appartient au
-- marchand et il la montre déjà ; le contact du fournisseur appartient à la
-- relation entre eux deux.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Annuaire des boutiques
-- ------------------------------------------------------------

alter table businesses add column if not exists listed boolean not null default true;

-- L'annuaire cherche par produit puis remonte à la boutique : l'index sert au
-- filtre « boutiques inscrites » appliqué avant la jointure.
create index if not exists businesses_listed_idx on businesses (listed) where listed;

-- ------------------------------------------------------------
-- 2. Fournisseurs partagés
-- ------------------------------------------------------------

alter table suppliers add column if not exists shared boolean not null default false;

create index if not exists suppliers_shared_idx on suppliers (shared) where shared;

-- ------------------------------------------------------------
-- 3. Lectures publiques
--
-- L'annuaire est lu sans être connecté : les politiques existantes, bornées à
-- `my_business_id()`, ne s'appliquent qu'aux membres. On expose donc des vues
-- restreintes plutôt que d'ouvrir les tables.
-- ------------------------------------------------------------

-- Boutiques inscrites à l'annuaire. Aucune coordonnée bancaire, aucun réglage
-- interne : le strict nécessaire pour qu'un visiteur trouve et ouvre la vitrine.
create or replace view public_directory_businesses as
select
  b.id,
  b.name,
  b.slug,
  b.business_type,
  b.address,
  b.logo_url,
  b.cover_url,
  b.slogan
from businesses b
where b.listed;

-- Produits visibles des boutiques inscrites. C'est la table que l'annuaire
-- interroge : on cherche un produit, on obtient la boutique qui le vend.
create or replace view public_directory_products as
select
  p.id,
  p.name,
  p.category,
  p.price_cents,
  p.currency,
  p.photo_url,
  p.stock_state,
  b.id   as business_id,
  b.name as business_name,
  b.slug as business_slug,
  b.address as business_address,
  b.business_type
from products p
join businesses b on b.id = p.business_id
where b.listed
  and p.is_active
  and coalesce(p.stock_state, 'en_stok') <> 'fini';

-- Fournisseurs que leur boutique accepte de partager.
--
-- Le nom de la boutique qui les a saisis n'apparaît pas : l'information utile
-- est le fournisseur, pas qui travaille avec lui. Les produits déjà livrés
-- sont agrégés, sans quantités ni prix — c'est ce qui permet de chercher un
-- produit et de voir qui le fournit, sans révéler les achats de personne.
create or replace view public_shared_suppliers as
select
  s.id,
  s.name,
  s.phone_e164,
  s.note,
  coalesce(
    array_agg(distinct p.name) filter (where p.name is not null),
    '{}'::text[]
  ) as products
from suppliers s
left join purchases pu on pu.supplier_id = s.id
left join purchase_items pi on pi.purchase_id = pu.id
left join products p on p.id = pi.product_id
where s.shared
group by s.id, s.name, s.phone_e164, s.note;

grant select on public_directory_businesses to anon, authenticated;
grant select on public_directory_products to anon, authenticated;
grant select on public_shared_suppliers to authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 11))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(11, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.


-- ══════════════════════════════════════════════════════════
-- ÉTAPE 14 / 14 — migrate-2026-12-horaires.sql
-- ══════════════════════════════════════════════════════════

-- ============================================================
-- CONVERZA — migration 12 (horaires d'ouverture structurés)
-- À exécuter dans l'éditeur SQL Supabase après
-- migrate-2026-11-annuaire.sql. Le script est rejouable.
--
-- La colonne `hours` existait, mais en texte libre : « 8h – 18h », « 7am–7pm »,
-- « lundi au samedi ». On peut l'afficher, on ne peut rien en déduire. Or un
-- client qui commande à 22 h n'a pas besoin qu'on lui montre des horaires : il
-- a besoin qu'on lui dise quand il aura une réponse.
--
-- Trois colonnes suffisent pour une boutique de quartier : une heure
-- d'ouverture, une heure de fermeture, et les jours travaillés. Une grille
-- jour par jour serait plus juste pour une minorité et plus pénible à remplir
-- pour tout le monde.
--
-- `hours` est conservée : elle reste ce que le marchand veut écrire en toutes
-- lettres, et les boutiques qui ne renseignent pas les nouvelles colonnes ne
-- changent pas d'apparence.
-- ============================================================

alter table businesses add column if not exists opens_at time;
alter table businesses add column if not exists closes_at time;

-- Jours travaillés, au format de Date.getDay() : 0 = dimanche … 6 = samedi.
-- Le défaut couvre lundi à samedi, la semaine de la plupart des commerces.
alter table businesses add column if not exists open_days smallint[] not null default '{1,2,3,4,5,6}';

-- ------------------------------------------------------------
-- La vitrine lit la boutique par `public_businesses` : sans ces colonnes dans
-- la vue, la page ne les verrait jamais.
--
-- PostgreSQL refuse de remplacer une vue dont les colonnes changent : on la
-- supprime d'abord, et les droits sont réattribués juste en dessous.
-- ------------------------------------------------------------

drop view if exists public_businesses;
create view public_businesses as
select
  id, name, slug, category, address, phone_e164, logo_url, cover_url, hours,
  business_type, theme, layout,
  case
    when coalesce(plan, 'gratis') <> 'gratis'
         and plan_until is not null
         and plan_until + interval '3 days' < now()
    then 'gratis'
    else coalesce(plan, 'gratis')
  end as plan,
  social_instagram, social_facebook,
  social_tiktok, delivery_zones, default_currency, slogan, promo_text, created_at,
  previous_phone_e164, phone_changed_at, phone_notice_until,
  showcase_opt_out,
  opens_at, closes_at, open_days
from businesses
where suspended_at is null;
grant select on public_businesses to anon, authenticated;

-- Repère de version lu par la console.
insert into platform_settings (key, value)
values ('db_version', jsonb_build_object('migration', 12))
on conflict (key) do update
  set value = jsonb_build_object('migration', greatest(12, coalesce((platform_settings.value->>'migration')::int, 0))),
      updated_at = now();

-- ✅ Migration terminée.
