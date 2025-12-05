-- Storage RLS Policies for property-attachments bucket
-- Run this AFTER creating the bucket in Supabase Dashboard
--
-- IMPORTANT: These policies work whether the bucket is public or private.
-- The bucket can be set to either:
--   - Public: Files accessible via public URLs (simpler, but less secure)
--   - Private: Files require signed URLs (more secure, but URLs expire)
--
-- For a single-user system, public bucket with RLS policies is recommended.
-- RLS policies control who can perform operations (upload/delete), even if bucket is public.

-- Policy 1: Allow SELECT (read/download) for all files
CREATE POLICY "Allow public read access to attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-attachments');

-- Policy 2: Allow INSERT (upload) for all files
CREATE POLICY "Allow public insert access to attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-attachments');

-- Policy 3: Allow UPDATE (modify) for all files
CREATE POLICY "Allow public update access to attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-attachments')
WITH CHECK (bucket_id = 'property-attachments');

-- Policy 4: Allow DELETE (remove) for all files
CREATE POLICY "Allow public delete access to attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-attachments');

-- Alternative: If you want more restrictive policies (e.g., only allow files in specific folders),
-- you can use path-based restrictions like:
-- USING (bucket_id = 'property-attachments' AND (storage.foldername(name))[1] = 'some-property-id');

