-- Allow expenses without a date (e.g. planned items with no expected date yet).
ALTER TABLE public.renovation_expenses
  ALTER COLUMN expense_date DROP NOT NULL;

COMMENT ON COLUMN public.renovation_expenses.expense_date IS
  'Payment or expected date; NULL when not set (often for planned expenses).';
