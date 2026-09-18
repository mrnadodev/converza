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
create or replace view public_businesses as
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
