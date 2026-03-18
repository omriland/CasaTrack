-- =============================================================================
-- CasaTrack Renovation — run in Supabase SQL Editor (entire file)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.renovation_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Projects (only one should be "active" — enforced in app)
-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT,
  address_text TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  start_date DATE,
  target_end_date DATE,
  total_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  contingency_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ILS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_renovation_projects_status ON public.renovation_projects (status);

CREATE TRIGGER tr_renovation_projects_updated
  BEFORE UPDATE ON public.renovation_projects
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_renovation_team_project ON public.renovation_team_members (project_id);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  amount_allocated NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_renovation_budget_project ON public.renovation_budget_lines (project_id);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  vendor TEXT,
  category TEXT,
  notes TEXT,
  payment_method TEXT,
  receipt_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_expenses_project_date ON public.renovation_expenses (project_id, expense_date DESC);

CREATE TRIGGER tr_renovation_expenses_updated
  BEFORE UPDATE ON public.renovation_expenses
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#007AFF',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (project_id, name)
);

CREATE INDEX idx_renovation_labels_project ON public.renovation_labels (project_id);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'blocked', 'done')),
  assignee_id UUID REFERENCES public.renovation_team_members (id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_tasks_project ON public.renovation_tasks (project_id);
CREATE INDEX idx_renovation_tasks_due ON public.renovation_tasks (project_id, due_date);

CREATE TRIGGER tr_renovation_tasks_updated
  BEFORE UPDATE ON public.renovation_tasks
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_task_labels (
  task_id UUID NOT NULL REFERENCES public.renovation_tasks (id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.renovation_labels (id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_renovation_rooms_project ON public.renovation_rooms (project_id);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_gallery_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (project_id, name)
);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  taken_at DATE,
  room_id UUID REFERENCES public.renovation_rooms (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renovation_gallery_project ON public.renovation_gallery_items (project_id);

-- -----------------------------------------------------------------------------
CREATE TABLE public.renovation_gallery_item_tags (
  gallery_item_id UUID NOT NULL REFERENCES public.renovation_gallery_items (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.renovation_gallery_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (gallery_item_id, tag_id)
);

-- =============================================================================
-- RLS (matches single-user anon client pattern)
-- =============================================================================
ALTER TABLE public.renovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_gallery_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_gallery_item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_projects_all" ON public.renovation_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_team_all" ON public.renovation_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_budget_lines_all" ON public.renovation_budget_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_expenses_all" ON public.renovation_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_labels_all" ON public.renovation_labels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_tasks_all" ON public.renovation_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_task_labels_all" ON public.renovation_task_labels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_rooms_all" ON public.renovation_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_gallery_tags_all" ON public.renovation_gallery_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_gallery_items_all" ON public.renovation_gallery_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reno_gallery_item_tags_all" ON public.renovation_gallery_item_tags FOR ALL USING (true) WITH CHECK (true);
