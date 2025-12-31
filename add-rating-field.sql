-- Add simple 0-5 star rating field to properties table
-- Run this SQL manually in your Supabase SQL editor

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 0 AND rating <= 5);

-- Create index for faster rating queries
CREATE INDEX IF NOT EXISTS idx_properties_rating ON properties(rating DESC);
