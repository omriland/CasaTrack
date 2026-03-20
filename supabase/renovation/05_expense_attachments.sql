-- =============================================================================
-- Multiple files per expense (receipts, PDFs, etc.)
-- Run after 01_schema.sql. Uses storage bucket renovation-files (from 04_files.sql).
-- =============================================================================

CREATE TABLE public.renovation_expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.renovation_expenses (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reno_exp_att_expense ON public.renovation_expense_attachments (expense_id);

ALTER TABLE public.renovation_expense_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_expense_attachments_all"
  ON public.renovation_expense_attachments
  FOR ALL
  USING (true)
  WITH CHECK (true);
