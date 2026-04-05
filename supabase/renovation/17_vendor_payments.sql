-- Cash paid toward a vendor’s “actual” (partial payments vs recorded spend / display cap).
CREATE TABLE public.renovation_vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  vendor_key TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reno_vendor_payments_project_vendor ON public.renovation_vendor_payments (project_id, vendor_key);
CREATE INDEX idx_reno_vendor_payments_project ON public.renovation_vendor_payments (project_id);

COMMENT ON TABLE public.renovation_vendor_payments IS
  'Partial cash payments toward vendor actual; progress = sum(amount) / actual column cap.';

ALTER TABLE public.renovation_vendor_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reno_vendor_payments_all" ON public.renovation_vendor_payments FOR ALL USING (true) WITH CHECK (true);
