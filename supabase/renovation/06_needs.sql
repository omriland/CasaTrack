-- =============================================================================
-- Needs — simple list per project, optional room
-- Run after 01_schema.sql (requires renovation_projects + renovation_rooms).
-- =============================================================================

CREATE TABLE public.renovation_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.renovation_rooms (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_needs_project ON public.renovation_needs (project_id);
CREATE INDEX idx_renovation_needs_room ON public.renovation_needs (room_id);

ALTER TABLE public.renovation_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_needs_all" ON public.renovation_needs
  FOR ALL
  USING (true)
  WITH CHECK (true);
