-- ============================================================
-- Migration : thème, disposition, nb d'employés
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

alter table businesses add column if not exists employees_count integer;
alter table businesses add column if not exists theme text default 'whatsapp';
alter table businesses add column if not exists layout text default 'auto';
