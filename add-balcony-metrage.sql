-- Add balcony_square_meters and recompute price_per_meter to count half balcony

-- 01) Add balcony column (nullable)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS balcony_square_meters INTEGER;

-- 02) Recreate computed price_per_meter to include half of balcony
ALTER TABLE properties
  DROP COLUMN IF EXISTS price_per_meter;

ALTER TABLE properties
  ADD COLUMN price_per_meter DECIMAL(10,2) GENERATED ALWAYS AS (
    asked_price::decimal / NULLIF((square_meters::decimal + COALESCE(balcony_square_meters, 0)::decimal / 2.0), 0)
  ) STORED;


