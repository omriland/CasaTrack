-- Migration: Make square_meters and asked_price optional (nullable)
-- This allows adding properties without price and size information

-- Step 1: Drop the NOT NULL constraints
ALTER TABLE properties 
  ALTER COLUMN square_meters DROP NOT NULL,
  ALTER COLUMN asked_price DROP NOT NULL;

-- Step 2: Update the computed price_per_meter column to handle null values
-- The existing NULLIF already handles division by zero, but we need to ensure
-- it returns NULL when either asked_price or square_meters is NULL
ALTER TABLE properties 
  DROP COLUMN price_per_meter;

ALTER TABLE properties 
  ADD COLUMN price_per_meter DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN asked_price IS NULL OR square_meters IS NULL THEN NULL
      WHEN (square_meters::decimal + COALESCE(balcony_square_meters, 0)::decimal / 2.0) = 0 THEN NULL
      ELSE asked_price::decimal / (square_meters::decimal + COALESCE(balcony_square_meters, 0)::decimal / 2.0)
    END
  ) STORED;





