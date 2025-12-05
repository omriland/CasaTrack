# RLS Setup Summary for Attachments

## Quick Setup Checklist

1. ✅ Run `add-attachments-support.sql` (creates attachments table)
2. ✅ Create `property-attachments` bucket in Supabase Dashboard
3. ✅ Run `setup-storage-rls.sql` (creates RLS policies)
4. ✅ Verify policies are active in Storage > Policies

## How RLS Works Here

### Storage Bucket Configuration
- **Bucket Name**: `property-attachments`
- **Public/Private**: Either works, but **public is recommended** for single-user system
- **RLS Policies**: Control upload/delete operations regardless of bucket setting

### RLS Policies Created

The `setup-storage-rls.sql` creates 4 policies:

1. **SELECT Policy**: Allows reading/downloading files
2. **INSERT Policy**: Allows uploading new files
3. **UPDATE Policy**: Allows modifying existing files
4. **DELETE Policy**: Allows removing files

All policies check that operations are on the `property-attachments` bucket.

### Why RLS Matters

Even though this is a single-user system:
- ✅ Prevents unauthorized access if someone gets your API keys
- ✅ Provides audit trail of who can do what
- ✅ Makes it easier to add restrictions later if needed
- ✅ Best practice for Supabase Storage

### Testing RLS

After setup, test that uploads work:
1. Try uploading a file through the PropertyForm
2. If you get a "policy" or "permission" error, check:
   - All 4 policies exist in Storage > Policies
   - Bucket name matches exactly: `property-attachments`
   - Policies are enabled (not disabled)

### Troubleshooting

**Error: "new row violates row-level security policy"**
- Solution: Run `setup-storage-rls.sql` again
- Check that policies exist in Storage > Policies

**Error: "Bucket not found"**
- Solution: Create the bucket first in Storage dashboard
- Make sure name is exactly: `property-attachments`

**Uploads work but deletes fail**
- Solution: Check that DELETE policy exists and is enabled
- Verify policy allows operations on `property-attachments` bucket

