-- Budget lines ↔ rooms (many-to-many)
-- Run in Supabase SQL Editor after 01_schema.sql (needs renovation_budget_lines + renovation_rooms).

CREATE TABLE public.renovation_budget_line_rooms (
  budget_line_id UUID NOT NULL REFERENCES public.renovation_budget_lines (id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.renovation_rooms (id) ON DELETE CASCADE,
  PRIMARY KEY (budget_line_id, room_id)
);

CREATE INDEX idx_renovation_budget_line_rooms_room
  ON public.renovation_budget_line_rooms (room_id);

COMMENT ON TABLE public.renovation_budget_line_rooms IS
  'Links budget category rows to one or more rooms; empty set means not room-specific.';

-- Enforce same project as parent budget line and room
CREATE OR REPLACE FUNCTION public.renovation_budget_line_rooms_same_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.renovation_budget_lines bl
    INNER JOIN public.renovation_rooms r ON r.id = NEW.room_id
    WHERE bl.id = NEW.budget_line_id
      AND bl.project_id = r.project_id
  ) THEN
    RAISE EXCEPTION 'Budget line and room must belong to the same project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_renovation_budget_line_rooms_same_project
  BEFORE INSERT OR UPDATE OF budget_line_id, room_id
  ON public.renovation_budget_line_rooms
  FOR EACH ROW
  EXECUTE PROCEDURE public.renovation_budget_line_rooms_same_project();

ALTER TABLE public.renovation_budget_line_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_budget_line_rooms_all"
  ON public.renovation_budget_line_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);
