# Renovation app — run on Supabase manually

1. Open **Supabase Dashboard → SQL Editor**.
2. Run **`01_schema.sql`** in full (creates tables, indexes, triggers, RLS).
3. Run **`02_storage.sql`** (creates bucket + storage policies).

If a script fails, read the error; fix any naming conflict and re-run only missing parts.

**Trigger syntax:** If `EXECUTE FUNCTION` errors, replace with `EXECUTE PROCEDURE` for the three `CREATE TRIGGER` lines in `01_schema.sql`.
