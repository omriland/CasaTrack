-- =============================================================================
-- Renovation Roadmap milestones (date-range "main items") + task links.
-- Run in Supabase SQL Editor after 01-26.
-- If trigger syntax fails, use EXECUTE FUNCTION instead of PROCEDURE.
-- =============================================================================

CREATE TABLE public.renovation_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4f46e5',
  notes TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_by_member_id UUID REFERENCES public.renovation_team_members (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT renovation_milestones_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_renovation_milestones_project_start
  ON public.renovation_milestones (project_id, start_date);

CREATE TRIGGER tr_renovation_milestones_updated
  BEFORE UPDATE ON public.renovation_milestones
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

-- Many-to-many: a task can belong to multiple milestones and vice versa.
CREATE TABLE public.renovation_milestone_tasks (
  milestone_id UUID NOT NULL REFERENCES public.renovation_milestones (id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.renovation_tasks (id) ON DELETE CASCADE,
  PRIMARY KEY (milestone_id, task_id)
);

CREATE INDEX idx_renovation_milestone_tasks_task
  ON public.renovation_milestone_tasks (task_id);

-- =============================================================================
-- RLS (matches single-user anon client pattern)
-- =============================================================================
ALTER TABLE public.renovation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_milestone_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_milestones_all"
  ON public.renovation_milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_milestone_tasks_all"
  ON public.renovation_milestone_tasks FOR ALL USING (true) WITH CHECK (true);
