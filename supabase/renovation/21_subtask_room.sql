-- Add optional room to subtasks
ALTER TABLE public.renovation_subtasks
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.renovation_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renovation_subtasks_room
  ON public.renovation_subtasks (room_id);
