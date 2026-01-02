-- Add flag column to properties table
-- This allows users to flag properties for special attention or filtering

ALTER TABLE properties
ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient filtering by flagged status
CREATE INDEX idx_properties_is_flagged ON properties(is_flagged);

-- Add comment for documentation
COMMENT ON COLUMN properties.is_flagged IS 'Flag to mark properties for special attention or filtering';
