-- =============================================================================
-- Storage bucket for renovation gallery + receipts (run after 01_schema.sql)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('renovation-gallery', 'renovation-gallery', true, 15728640)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 15728640;

DROP POLICY IF EXISTS "reno_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "reno_storage_delete" ON storage.objects;

CREATE POLICY "reno_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'renovation-gallery');

CREATE POLICY "reno_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'renovation-gallery');

CREATE POLICY "reno_storage_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'renovation-gallery');

CREATE POLICY "reno_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'renovation-gallery');
