-- =============================================================================
-- Calendar: add event_type 'supervision' (no provider). Run in Supabase SQL.
-- After: 10_calendar_events.sql (and any later calendar patches).
-- =============================================================================

ALTER TABLE public.renovation_calendar_events
  DROP CONSTRAINT IF EXISTS renovation_calendar_events_event_type_check;

ALTER TABLE public.renovation_calendar_events
  ADD CONSTRAINT renovation_calendar_events_event_type_check
  CHECK (event_type IN ('general', 'provider_meeting', 'supervision'));

ALTER TABLE public.renovation_calendar_events
  DROP CONSTRAINT IF EXISTS renovation_calendar_events_provider_type;

ALTER TABLE public.renovation_calendar_events
  ADD CONSTRAINT renovation_calendar_events_provider_type
  CHECK (
    (event_type = 'provider_meeting' AND provider_id IS NOT NULL)
    OR (event_type = 'general' AND provider_id IS NULL)
    OR (event_type = 'supervision' AND provider_id IS NULL)
  );
