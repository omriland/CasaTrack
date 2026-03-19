-- =============================================================================
-- Rooms: add notes (paragraph). Tasks: link to room.
-- Run in Supabase SQL Editor after 01_schema.sql and 02_storage.sql.
-- =============================================================================

-- Room paragraph/notes
ALTER TABLE public.renovation_rooms
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Task → Room (optional)
ALTER TABLE public.renovation_tasks
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.renovation_rooms (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renovation_tasks_room_id
  ON public.renovation_tasks (room_id);
