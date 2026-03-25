-- =============================================================================
-- Room icons — curated keys chosen in the app (whole-home / kitchen / bath…).
-- Run in Supabase SQL Editor after prior renovation migrations.
-- =============================================================================

ALTER TABLE public.renovation_rooms
  ADD COLUMN IF NOT EXISTS room_icon_key TEXT NOT NULL DEFAULT 'home_all';

COMMENT ON COLUMN public.renovation_rooms.room_icon_key IS
  'App-defined icon id, e.g. home_all, living, kitchen, master, shower, bath, kids, desk, balcony.';
