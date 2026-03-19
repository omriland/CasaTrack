-- =============================================================================
-- Renovation: generic files tab (drop/upload, rename display_name, optional room)
-- Run after 01_schema.sql (needs renovation_set_updated_at + projects + rooms).
-- =============================================================================

CREATE TABLE public.renovation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.renovation_rooms (id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  display_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_files_project ON public.renovation_files (project_id);
CREATE INDEX idx_renovation_files_room ON public.renovation_files (room_id);

CREATE TRIGGER tr_renovation_files_updated
  BEFORE UPDATE ON public.renovation_files
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

ALTER TABLE public.renovation_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_files_all" ON public.renovation_files FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Storage bucket (separate from gallery images; adjust file_size_limit as needed)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('renovation-files', 'renovation-files', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "reno_files_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "reno_files_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "reno_files_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "reno_files_storage_delete" ON storage.objects;

CREATE POLICY "reno_files_storage_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'renovation-files');

CREATE POLICY "reno_files_storage_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'renovation-files');

CREATE POLICY "reno_files_storage_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'renovation-files');

CREATE POLICY "reno_files_storage_delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'renovation-files');
