-- =============================================================================
-- Room icon keys — add armchair, chef_hat, utensils, baby (if 12 ran earlier).
-- Safe to run even if 12 already included these keys.
-- =============================================================================

UPDATE public.renovation_rooms
SET room_icon_key = 'house'
WHERE room_icon_key IS NOT NULL
  AND room_icon_key NOT IN (
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
