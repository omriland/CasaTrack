-- Pin one Budget-tab vendor row to the renovation overview strip (same vendor_key as listVendorPayments / buildVendorBudgetRows).
-- Run in Supabase SQL Editor after 01_schema.sql.

ALTER TABLE public.renovation_projects
  ADD COLUMN IF NOT EXISTS overview_vendor_key text NULL;

COMMENT ON COLUMN public.renovation_projects.overview_vendor_key IS
  'Matches renovation_expenses vendor grouping key (normalizeVendorKey). Set from /renovation/budget row context menu.';
