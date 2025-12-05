-- Migration: Add title field to properties table
-- This separates the property title from the address

-- Step 1: Add the title column (nullable initially to allow migration of existing data)
ALTER TABLE properties 
  ADD COLUMN title TEXT;

-- Step 2: Populate title with address for existing properties
UPDATE properties 
  SET title = address 
  WHERE title IS NULL;

-- Step 3: Make title NOT NULL after populating existing data
ALTER TABLE properties 
  ALTER COLUMN title SET NOT NULL;

-- Note: After running this migration, you may want to add an index on title if you plan to search by it
-- CREATE INDEX idx_properties_title ON properties(title);

