# Supabase Storage Bucket Setup

## Manual Steps Required

After running the SQL migration (`add-attachments-support.sql`), you need to set up the storage bucket in Supabase Dashboard:

### Step 1: Create the Bucket

1. Go to **Supabase Dashboard** > **Storage**
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `property-attachments`
   - **Public**: `false` (we'll use RLS policies for access control)
   - **File size limit**: `52428800` (50MB) - adjust as needed
   - **Allowed MIME types**: 
     - `image/*`
     - `video/*`

### Step 2: Set Up RLS Policies

**IMPORTANT**: After creating the bucket, you MUST run the RLS policies SQL:

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Run the SQL from `setup-storage-rls.sql`
3. This creates the necessary policies for:
   - **SELECT**: Read/download files
   - **INSERT**: Upload files  
   - **UPDATE**: Modify files
   - **DELETE**: Remove files

**Why RLS?**
- Even though this is a single-user system, RLS policies provide an extra layer of security
- They ensure only authorized operations can access the storage bucket
- Prevents accidental or malicious access to files
- Required for uploads/deletes to work properly

**Note**: The policies allow all operations on the `property-attachments` bucket. Since this is a single-user system, this is appropriate. If you need more restrictive policies (e.g., only allow files for specific properties), you can modify the policies in the SQL file.

### Step 3: Verify Policies

After running the SQL, verify the policies are active:
1. Go to **Storage** > **Policies** > **property-attachments**
2. You should see 4 policies (SELECT, INSERT, UPDATE, DELETE)
3. All policies should allow operations on the `property-attachments` bucket

**Troubleshooting**:
- If uploads fail with "policy" or "permission" errors, check that all 4 policies are created
- Make sure the bucket name matches exactly: `property-attachments`
- Policies are applied immediately after running the SQL

## Storage Structure

Files will be stored with the following path structure:
```
property-attachments/
  {property_id}/
    {timestamp}_{random}.{ext}
```

This keeps files organized by property and prevents naming conflicts.

## Security Notes

- The bucket is set to **private** for better security
- RLS policies control access at the storage level
- Files are accessible via Supabase Storage API using the anon key
- For additional security, you could restrict policies to specific property IDs or add authentication checks

