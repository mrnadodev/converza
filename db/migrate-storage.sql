-- ============================================================
-- Migration : Supabase Storage pour les images (logo, bannière, photos)
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- Bucket public "media"
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Lecture publique (les images de vitrine doivent être visibles par tous)
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Écriture/màj/suppression réservées aux membres connectés
create policy "media_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "media_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "media_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
