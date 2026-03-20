-- =============================================================================
-- Service providers (phone book) + optional link on tasks.
-- Run after 01–06. If trigger syntax fails, use EXECUTE FUNCTION instead of PROCEDURE.
-- =============================================================================

CREATE TABLE public.renovation_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  additional_info TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_providers_project ON public.renovation_providers (project_id);

CREATE TRIGGER tr_renovation_providers_updated
  BEFORE UPDATE ON public.renovation_providers
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

ALTER TABLE public.renovation_tasks
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.renovation_providers (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renovation_tasks_provider_id
  ON public.renovation_tasks (provider_id);

ALTER TABLE public.renovation_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_providers_all" ON public.renovation_providers FOR ALL USING (true) WITH CHECK (true);
