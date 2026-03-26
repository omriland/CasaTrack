-- =============================================================================
-- Room icon keys v2 — Lucide-based set (shield_half, house, bath, …).
-- Run in Supabase SQL Editor after 11_room_icons.sql.
-- =============================================================================

ALTER TABLE public.renovation_rooms
  ALTER COLUMN room_icon_key SET DEFAULT 'house';

UPDATE public.renovation_rooms
SET room_icon_key = 'house'
WHERE room_icon_key IS NULL
   OR room_icon_key NOT IN (
     'shield_half',
     'house',
     'bath',
     'shower_head',
     'sun',
     'bed_double',
     'lamp_desk',
     'monitor_smartphone',
     'bed',
     'blinds',
     'armchair',
     'chef_hat',
     'utensils',
     'baby'
   );

COMMENT ON COLUMN public.renovation_rooms.room_icon_key IS
  'App icon id: shield_half, house, bath, shower_head, sun, bed_double, lamp_desk, monitor_smartphone, bed, blinds, armchair, chef_hat, utensils, baby.';
