-- Planned expenses: is_planned = true means not paid yet (expected / committed).
ALTER TABLE public.renovation_expenses
  ADD COLUMN IF NOT EXISTS is_planned boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.renovation_expenses.is_planned IS
  'True = planned/upcoming cost; false = already spent (default for legacy rows).';
