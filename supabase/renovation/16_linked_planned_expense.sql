-- Link spent expense rows to a planned row (keeps planned row; spend is a separate row).
ALTER TABLE public.renovation_expenses
  ADD COLUMN IF NOT EXISTS linked_planned_expense_id uuid REFERENCES public.renovation_expenses(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.renovation_expenses.linked_planned_expense_id IS
  'For spent rows (is_planned = false): optional FK to the planned expense this payment applies toward.';

ALTER TABLE public.renovation_expenses
  DROP CONSTRAINT IF EXISTS renovation_expenses_linked_only_when_spent;

ALTER TABLE public.renovation_expenses
  ADD CONSTRAINT renovation_expenses_linked_only_when_spent
  CHECK (linked_planned_expense_id IS NULL OR is_planned = false);
