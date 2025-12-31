-- Property Scoring System Migration
-- Run this SQL manually in your Supabase SQL editor

-- Create property_scores table to cache calculated scores
CREATE TABLE IF NOT EXISTS property_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100), -- 0-100 score
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(property_id)
);

-- Create scoring_config table to store user's scoring preferences
CREATE TABLE IF NOT EXISTS scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion TEXT NOT NULL UNIQUE, -- 'price', 'price_per_meter', 'size', 'rooms', 'balcony', 'property_type', 'status'
  weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1), -- 0.00 to 1.00
  enabled BOOLEAN DEFAULT true NOT NULL,
  preference TEXT, -- 'lower', 'higher', 'prefer_new', 'prefer_existing', 'sweet_spot'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create trigger function to update updated_at for scoring_config
CREATE OR REPLACE FUNCTION update_scoring_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scoring_config_updated_at
  BEFORE UPDATE ON scoring_config
  FOR EACH ROW
  EXECUTE FUNCTION update_scoring_config_updated_at();

-- Insert default scoring configuration
-- Default: Equal weights for all criteria (each gets ~14.3% weight)
INSERT INTO scoring_config (criterion, weight, enabled, preference) VALUES
  ('price', 0.143, true, 'lower'), -- Lower price is better
  ('price_per_meter', 0.143, true, 'lower'), -- Lower price per m² is better
  ('size', 0.143, true, 'higher'), -- Larger size is better
  ('rooms', 0.143, true, 'higher'), -- More rooms is better (can be changed to sweet_spot)
  ('balcony', 0.143, true, 'higher'), -- Larger balcony is better
  ('property_type', 0.143, true, 'prefer_new'), -- Prefer new apartments
  ('status', 0.143, true, NULL) -- Status scoring (Interested/Visited score higher)
ON CONFLICT (criterion) DO NOTHING;

-- Create index for faster score lookups
CREATE INDEX IF NOT EXISTS idx_property_scores_property_id ON property_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_property_scores_score ON property_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scoring_config_enabled ON scoring_config(enabled) WHERE enabled = true;

-- Enable RLS on new tables
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations - single user system)
CREATE POLICY "Allow all operations on property_scores" ON property_scores FOR ALL USING (true);
CREATE POLICY "Allow all operations on scoring_config" ON scoring_config FOR ALL USING (true);

-- Optional: Create a function to recalculate all scores
-- This can be called manually or via triggers when properties/config change
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS void AS $$
BEGIN
  -- This function will be called from the application
  -- The actual calculation logic will be in the application code
  -- This is just a placeholder for potential future database-side calculation
  RAISE NOTICE 'Score recalculation triggered. Run from application.';
END;
$$ language 'plpgsql';
