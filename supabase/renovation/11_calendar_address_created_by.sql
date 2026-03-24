-- =============================================================================
-- Calendar events: free-text address + creator (team member / profile).
-- Run after 10_calendar_events.sql
-- =============================================================================

ALTER TABLE public.renovation_calendar_events
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS created_by_member_id UUID REFERENCES public.renovation_team_members (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renovation_calendar_events_created_by
  ON public.renovation_calendar_events (created_by_member_id);
