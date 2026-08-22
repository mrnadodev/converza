-- ============================================================
-- CONVERZA — Données de démo (Ti Kòk Boutik)
-- À exécuter APRÈS schema.sql, avec le rôle service (bypass RLS)
-- ou dans l'éditeur SQL Supabase.
-- ============================================================

-- Business ------------------------------------------------------
insert into businesses (id, name, slug, category, address, phone_e164, hours,
                        social_instagram, social_facebook, social_tiktok, default_currency)
values ('11111111-1111-1111-1111-111111111111', 'Ti Kòk Boutik', 'ti-kok-boutik',
        'Boutik alimantè', 'Delmas 31, Pòtoprens', '+50937124488', '7am–7pm',
        'https://instagram.com/tikokboutik', 'https://facebook.com/tikokboutik',
        'https://tiktok.com/@tikokboutik', 'HTG')
on conflict (id) do nothing;

-- Membre (owner) ------------------------------------------------
-- Remplace <AUTH_USER_UUID> par l'id d'un utilisateur créé via Supabase Auth,
-- puis décommente :
-- insert into members (business_id, user_id, full_name, role)
-- values ('11111111-1111-1111-1111-111111111111', '<AUTH_USER_UUID>', 'Nadège Pierre', 'owner');

-- Clients (kliyan) ----------------------------------------------
insert into customers (id, business_id, full_name, phone_e164, address, tags) values
 ('c1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Wideline Désir',     '+50937124488', 'Delmas 31', '{kliyan_fidel}'),
 ('c1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Jameson Pierre',     '+50938220145', null,        '{}'),
 ('c1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Marie-Carmelle J.',  '+50934567712', null,        '{}'),
 ('c1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Nadège Fils-Aimé',   '+50936781290', null,        '{nouvo_kliyan}'),
 ('c1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Ricardo Chéry',      '+50937905533', null,        '{kliyan_fidel}')
on conflict (id) do nothing;

-- Produits (pwodwi) — prix en centimes ---------------------------
insert into products (id, business_id, name, category, price_cents, unit, stock_qty, stock_state) values
 ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ze fre',      'Manje', 18000,  'douzèn', 42, 'en_stok'),
 ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Diri Tchako', 'Manje', 120000, 'sak',     8, 'en_stok'),
 ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Pen konplè',  'Manje', 15500,  'inite',   3, 'ba_stok'),
 ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Lwil',        'Manje', 32000,  'boutèy', 20, 'en_stok')
on conflict (id) do nothing;

-- Réponses rapides (repons rapid) -------------------------------
insert into quick_replies (business_id, label, body, sort_order) values
 ('11111111-1111-1111-1111-111111111111', 'Konbyen li ye?',   'Bonjou! Mèsi paske w kontakte Ti Kòk Boutik. Ki pwodwi w ap chèche?', 1),
 ('11111111-1111-1111-1111-111111111111', 'Voye MonCash',     'Pou konfime kòmand lan, voye peman an sou MonCash: +509 3712 4488. Voye kaptè a apre.', 2),
 ('11111111-1111-1111-1111-111111111111', 'Mèsi, n ap tann ou','Mèsi anpil! Kòmand ou an ap pare. N ap fè w konnen lè li livre.', 3),
 ('11111111-1111-1111-1111-111111111111', 'Ki adrès livrezon?','Ki adrès pou nou livre kòmand lan? Bay yon pwen repè tou souple.', 4)
on conflict do nothing;

-- Commande d'exemple (payée, en attente de livraison) -----------
insert into orders (id, business_id, ref, customer_id, status, delivery_fee_cents,
                    delivery_addr, pay_method, pay_ref, created_at, paid_at)
values ('01420000-0000-0000-0000-000000000142', '11111111-1111-1111-1111-111111111111', '0142',
        'c1000000-0000-0000-0000-000000000001', 'peye', 5000, 'Delmas 31', 'moncash', '8842',
        now() - interval '2 hours', now() - interval '1 hour')
on conflict (id) do nothing;

insert into order_items (order_id, product_id, name, unit_price_cents, qty) values
 ('01420000-0000-0000-0000-000000000142', 'a1000000-0000-0000-0000-000000000001', 'Ze fre',     18000, 3),
 ('01420000-0000-0000-0000-000000000142', 'a1000000-0000-0000-0000-000000000003', 'Pen konplè', 15500, 2)
on conflict do nothing;
