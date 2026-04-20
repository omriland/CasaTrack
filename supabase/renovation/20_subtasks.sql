-- =============================================================================
-- Subtasks (lightweight checklist items inside a task)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.renovation_subtasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.renovation_tasks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  is_done     BOOLEAN NOT NULL DEFAULT false,
  assignee_id UUID REFERENCES public.renovation_team_members(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renovation_subtasks_task
  ON public.renovation_subtasks (task_id, sort_order);

CREATE TRIGGER tr_renovation_subtasks_updated
  BEFORE UPDATE ON public.renovation_subtasks
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

ALTER TABLE public.renovation_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_subtasks_all"
  ON public.renovation_subtasks FOR ALL USING (true) WITH CHECK (true);
