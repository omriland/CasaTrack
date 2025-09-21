-- Create the properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  rooms DECIMAL(3,1) NOT NULL, -- Allows values like 3.5
  square_meters INTEGER NOT NULL,
  asked_price INTEGER NOT NULL, -- Price in ILS
  price_per_meter DECIMAL(10,2) GENERATED ALWAYS AS (asked_price::decimal / square_meters) STORED,
  contact_name TEXT,
  contact_phone TEXT,
  source TEXT NOT NULL CHECK (source IN ('Yad2', 'Friends & Family', 'Facebook', 'Madlan', 'Other')),
  property_type TEXT NOT NULL CHECK (property_type IN ('New', 'Existing apartment')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Seen' CHECK (status IN ('Seen', 'Interested', 'Contacted Realtor', 'Visited', 'On Hold', 'Irrelevant', 'Purchased')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create the notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for properties table
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - we'll implement auth later)
CREATE POLICY "Allow all operations on properties" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_notes_property_id ON notes(property_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);