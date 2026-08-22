-- ============================================================
-- Lier un utilisateur Supabase Auth au business Ti Kòk Boutik
-- comme PROPRIÉTAIRE (owner), pour débloquer Tablo + Kanban.
--
-- Avant : Supabase → Authentication → Users → Add user
--         (coche "Auto Confirm User", mets un email + mot de passe).
--
-- Puis remplace l'email ci-dessous par CELUI que tu viens de créer,
-- et exécute cette requête dans le SQL Editor.
-- ============================================================

insert into members (business_id, user_id, full_name, role)
select '11111111-1111-1111-1111-111111111111', id, 'Nadège Pierre', 'owner'
from auth.users
where email = 'REMPLACE@TON-EMAIL.com'
on conflict (user_id) do nothing;
