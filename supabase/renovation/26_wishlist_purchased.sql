-- Wishlist: mark items as purchased.
-- Run in Supabase SQL Editor after 23_wishlist.sql.

ALTER TABLE public.renovation_wishlist_items
  ADD COLUMN IF NOT EXISTS purchased boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.renovation_wishlist_items.purchased IS
  'When true, the item has been bought; shown in green in the wishlist UI.';
