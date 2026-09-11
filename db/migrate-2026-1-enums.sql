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
