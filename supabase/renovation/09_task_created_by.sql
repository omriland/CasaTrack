-- Track which team member created each task (renovation profile). Run after 01_schema (team_members + tasks exist).
ALTER TABLE public.renovation_tasks
  ADD COLUMN IF NOT EXISTS created_by_member_id UUID REFERENCES public.renovation_team_members (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renovation_tasks_created_by
  ON public.renovation_tasks (created_by_member_id);
