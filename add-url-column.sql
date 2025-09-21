-- Add URL column to properties table
ALTER TABLE properties 
ADD COLUMN url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN properties.url IS 'URL link to the original property listing';
