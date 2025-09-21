-- Migration to add latitude and longitude columns to properties table
-- Run this in your Supabase SQL editor

ALTER TABLE properties 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add indexes for better performance on coordinate queries
CREATE INDEX idx_properties_coordinates ON properties(latitude, longitude);

-- Update the existing schema documentation
COMMENT ON COLUMN properties.latitude IS 'Property latitude coordinate for map display';
COMMENT ON COLUMN properties.longitude IS 'Property longitude coordinate for map display';
