-- Add latitude and longitude columns to the properties table
ALTER TABLE properties
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX idx_properties_coordinates ON properties(latitude, longitude);