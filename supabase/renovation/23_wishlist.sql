-- =============================================================================
-- Wishlist — desired renovation items with multiple shopping links.
-- Run after 01_schema.sql (requires renovation_projects + renovation_set_updated_at).
-- =============================================================================

CREATE TABLE public.renovation_wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.renovation_projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER renovation_wishlist_items_updated_at
  BEFORE UPDATE ON public.renovation_wishlist_items
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

CREATE INDEX idx_renovation_wishlist_items_project
  ON public.renovation_wishlist_items (project_id, sort_order, created_at);

ALTER TABLE public.renovation_wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_wishlist_items_all" ON public.renovation_wishlist_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.renovation_wishlist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.renovation_wishlist_items (id) ON DELETE CASCADE,
  label TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER renovation_wishlist_links_updated_at
  BEFORE UPDATE ON public.renovation_wishlist_links
  FOR EACH ROW EXECUTE PROCEDURE public.renovation_set_updated_at();

CREATE INDEX idx_renovation_wishlist_links_item
  ON public.renovation_wishlist_links (item_id, sort_order, created_at);

ALTER TABLE public.renovation_wishlist_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reno_wishlist_links_all" ON public.renovation_wishlist_links
  FOR ALL
  USING (true)
  WITH CHECK (true);

