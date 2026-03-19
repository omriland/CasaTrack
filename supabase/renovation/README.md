# Renovation app — run on Supabase manually

1. Open **Supabase Dashboard → SQL Editor**.
2. Run **`01_schema.sql`** in full (creates tables, indexes, triggers, RLS).
3. Run **`02_storage.sql`** (creates bucket + storage policies).
4. Run **`03_rooms_and_task_room.sql`** (room notes + task→room link).
5. Run **`04_files.sql`** (Files tab: table + bucket `renovation-files`).

If a script fails, read the error; fix any naming conflict and re-run only missing parts.

**Photo upload fails:** Re-run `02_storage.sql` (policies use `TO anon` so the app key can upload). In Supabase Dashboard → Storage, confirm the bucket `renovation-gallery` exists.

**Trigger syntax:** If `EXECUTE FUNCTION` errors, replace with `EXECUTE PROCEDURE` for the three `CREATE TRIGGER` lines in `01_schema.sql`.
