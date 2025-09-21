-- Add test coordinates to existing properties for map testing
-- Tel Aviv coordinates: 32.0853, 34.7818
-- Jerusalem coordinates: 31.7683, 35.2137
-- Haifa coordinates: 32.8191, 34.9983

UPDATE properties
SET latitude = 32.0853, longitude = 34.7818
WHERE latitude IS NULL AND longitude IS NULL
LIMIT 1;

UPDATE properties
SET latitude = 31.7683, longitude = 35.2137
WHERE latitude IS NULL AND longitude IS NULL
LIMIT 1;

UPDATE properties
SET latitude = 32.8191, longitude = 34.9983
WHERE latitude IS NULL AND longitude IS NULL
LIMIT 1;