-- ========================================================
-- Gizem & Berkay — Supabase Kurulum SQL
-- Supabase SQL Editor'de sırasıyla çalıştır
-- ========================================================

-- 1. Uploads tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.uploads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  note       TEXT,
  file_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Row Level Security'yi etkinleştir
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- 3. Herkese insert izni ver (misafirler yükleme yapabilsin)
CREATE POLICY "allow_insert" ON public.uploads
  FOR INSERT TO anon WITH CHECK (true);

-- 4. Herkese select izni ver (admin signed URL için okuyabilsin)
CREATE POLICY "allow_select" ON public.uploads
  FOR SELECT TO anon USING (true);


-- ========================================================
-- STORAGE KURULUMU
-- (SQL değil, Supabase Dashboard'dan yapılır)
-- ========================================================
-- 1. Storage > New Bucket
--    Name: memories
--    Public: HAYIR (private bırak)
--
-- 2. Storage > Policies > memories bucket'ında:
--
--    INSERT policy — misafirler yükleyebilsin:
--    Policy name: allow_upload
--    Allowed operation: INSERT
--    Target roles: anon
--    USING expression: true
--
--    SELECT policy — signed URL için okuyabilsin:
--    Policy name: allow_select
--    Allowed operation: SELECT
--    Target roles: anon
--    USING expression: true
-- ========================================================
