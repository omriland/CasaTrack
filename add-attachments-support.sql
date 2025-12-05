-- Migration: Add attachments support for properties
-- This allows storing multiple photos/videos per property using Supabase Storage

-- Step 1: Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 2: Create updated_at trigger for attachments
CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Enable Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (allow all operations for now - single user system)
CREATE POLICY "Allow all operations on attachments" ON attachments FOR ALL USING (true);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_attachments_property_id ON attachments(property_id);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- Step 6: Create Supabase Storage bucket (run this in Supabase Dashboard > Storage)
-- Note: You'll need to create the bucket manually in Supabase Dashboard
-- Bucket name: 'property-attachments'
-- Public: true (or false if you want private with signed URLs)
-- File size limit: 50MB (or your preferred limit)
-- Allowed MIME types: image/*, video/*

