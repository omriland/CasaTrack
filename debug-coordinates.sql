-- Debug query to check if coordinates are being saved
SELECT 
  id,
  address,
  latitude,
  longitude,
  url,
  created_at
FROM properties 
ORDER BY created_at DESC 
LIMIT 10;
