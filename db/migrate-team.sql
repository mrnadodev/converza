-- ============================================================
-- Migration : Team Management (agents)
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- Rôle du membre connecté.
create or replace function my_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from members where user_id = auth.uid() limit 1;
$$;

-- L'owner peut retirer un agent de son business (pas un autre owner).
create policy member_owner_delete on members
  for delete
  using (business_id = my_business_id() and my_role() = 'owner' and role <> 'owner');
