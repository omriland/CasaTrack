-- =============================================================================
-- Calendar events (general + provider meetings). Run after 01–09.
-- If trigger syntax fails, use EXECUTE FUNCTION instead of PROCEDURE.
-- =============================================================================

CREATE TABLE public.renovation_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('general', 'provider_meeting')),
  title TEXT NOT NULL,
  body TEXT,
  provider_id UUID REFERENCES public.renovation_providers (id) ON DELETE SET NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT renovation_calendar_events_provider_type CHECK (
    (event_type = 'provider_meeting' AND provider_id IS NOT NULL)
    OR (event_type = 'general' AND provider_id IS NULL)
  ),
  CONSTRAINT renovation_calendar_events_schedule_mode CHECK (
    (
      is_all_day = true
      AND start_date IS NOT NULL
      AND (end_date IS NULL OR end_date >= start_date)
      AND starts_at IS NULL
      AND ends_at IS NULL
    )
    OR (
      is_all_day = false
      AND starts_at IS NOT NULL
      AND start_date IS NULL
      AND end_date IS NULL
    )
  )
);

CREATE INDEX idx_renovation_calendar_events_project_allday
  ON public.renovation_calendar_events (project_id, start_date)
  WHERE is_all_day = true;

CREATE INDEX idx_renovation_calendar_events_project_timed
  ON public.renovation_calendar_events (project_id, starts_at)
  WHERE is_all_day = false;

CREATE TRIGGER tr_renovation_calendar_events_updated
  BEFORE UPDATE ON public.renovation_calendar_events
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

ALTER TABLE public.renovation_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_calendar_events_all"
  ON public.renovation_calendar_events
  FOR ALL
  USING (true)
  WITH CHECK (true);
