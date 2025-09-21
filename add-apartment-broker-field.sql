-- Add apartment_broker field to properties table
-- This field tracks whether the property listing has an apartment broker

ALTER TABLE properties 
ADD COLUMN apartment_broker BOOLEAN DEFAULT false;

-- Add a comment to document the field
COMMENT ON COLUMN properties.apartment_broker IS 'Indicates whether the property listing has an apartment broker';

-- Update any existing properties to have a default value (false = no broker)
UPDATE properties SET apartment_broker = false WHERE apartment_broker IS NULL;
