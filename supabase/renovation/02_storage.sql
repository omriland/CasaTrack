-- =============================================================================
-- Storage bucket for renovation gallery + receipts (run after 01_schema.sql)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('renovation-gallery', 'renovation-gallery', true, 15728640)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 15728640;

-- Policies must allow the anon role (browser uses anon key). Drop existing so we can re-create.
DROP POLICY IF EXISTS "reno_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_delete" ON storage.objects;

-- Public read (anyone can view; bucket is public)
CREATE POLICY "reno_storage_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'renovation-gallery');

-- Anon upload/update/delete (app uses anon key, no Supabase Auth)
CREATE POLICY "reno_storage_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'renovation-gallery');

CREATE POLICY "reno_storage_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'renovation-gallery');

CREATE POLICY "reno_storage_delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'renovation-gallery');
