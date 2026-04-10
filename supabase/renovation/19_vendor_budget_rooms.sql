-- Vendor budget tab: link normalized vendor_key (per project) to one or more rooms
-- Run after 01_schema.sql (projects + rooms).

CREATE TABLE public.renovation_vendor_budget_rooms (
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  vendor_key TEXT NOT NULL,
  room_id UUID NOT NULL REFERENCES public.renovation_rooms (id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, vendor_key, room_id)
);

CREATE INDEX idx_renovation_vendor_budget_rooms_project ON public.renovation_vendor_budget_rooms (project_id);
CREATE INDEX idx_renovation_vendor_budget_rooms_room ON public.renovation_vendor_budget_rooms (room_id);

COMMENT ON TABLE public.renovation_vendor_budget_rooms IS
  'Rooms assigned to a vendor row on /renovation/budget; vendor_key matches normalizeVendorKey().';

CREATE OR REPLACE FUNCTION public.renovation_vendor_budget_rooms_same_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.renovation_rooms r
    WHERE r.id = NEW.room_id
      AND r.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Room must belong to the same project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_renovation_vendor_budget_rooms_same_project
  BEFORE INSERT OR UPDATE OF project_id, room_id
  ON public.renovation_vendor_budget_rooms
  FOR EACH ROW
  EXECUTE PROCEDURE public.renovation_vendor_budget_rooms_same_project();

ALTER TABLE public.renovation_vendor_budget_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_vendor_budget_rooms_all"
  ON public.renovation_vendor_budget_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);
