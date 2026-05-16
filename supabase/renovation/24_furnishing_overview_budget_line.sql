-- Furnishing / overview strip: designate exactly one budget line per project (optional).
-- Run in Supabase SQL Editor after 01_schema.sql (needs renovation_budget_lines).

ALTER TABLE public.renovation_budget_lines
  ADD COLUMN IF NOT EXISTS furnishing_overview boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.renovation_budget_lines.furnishing_overview IS
  'When true, this line drives the overview strip under Remaining Balance; expense categories must match this row category_name (trimmed / normalized in app). At most one true per project.';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_renovation_budget_lines_one_furnishing_overview
  ON public.renovation_budget_lines (project_id)
  WHERE furnishing_overview = true;
