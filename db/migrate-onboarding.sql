-- ============================================================
-- Migration : inscription marchand self-service
-- Permet à un utilisateur authentifié de créer SON business + se lier
-- comme owner. À exécuter dans Supabase SQL Editor.
-- ============================================================

-- Un utilisateur connecté peut créer un business.
create policy biz_create on businesses
  for insert to authenticated
  with check (true);

-- Il peut se lier lui-même comme membre (owner) de ce business.
create policy member_self_insert on members
  for insert to authenticated
  with check (user_id = auth.uid());

-- NOTE: pour que l'inscription connecte tout de suite (sans email),
-- désactive "Confirm email" dans Supabase → Authentication → Providers → Email.
