-- Mark needs as done (shopping list check-off). Run after 06_needs.sql.
ALTER TABLE public.renovation_needs
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;
