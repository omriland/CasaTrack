# Renovation app — run on Supabase manually

1. Open **Supabase Dashboard → SQL Editor**.
2. Run **`01_schema.sql`** in full (creates tables, indexes, triggers, RLS).
3. Run **`02_storage.sql`** (creates bucket + storage policies).
4. Run **`03_rooms_and_task_room.sql`** (room notes + task→room link).
5. Run **`04_files.sql`** (Files tab: table + bucket `renovation-files`).
6. Run **`05_expense_attachments.sql`** (multiple attachments per expense).
7. Run **`06_needs.sql`** (Needs list per project, optional room).
8. Run **`07_providers.sql`** (Service providers + optional provider on tasks).

If a script fails, read the error; fix any naming conflict and re-run only missing parts.

**Photo upload fails:** Re-run `02_storage.sql` (policies use `TO anon` so the app key can upload). In Supabase Dashboard → Storage, confirm the bucket `renovation-gallery` exists.

**Trigger syntax:** If `EXECUTE FUNCTION` errors, replace with `EXECUTE PROCEDURE` for the three `CREATE TRIGGER` lines in `01_schema.sql`.

## Optional: Files tab → Dropbox instead of Supabase Storage

1. Create a [Dropbox app](https://www.dropbox.com/developers/apps) with **Scoped access** and permissions `files.content.read`, `files.content.write`, `files.metadata.read`. Generate a **refresh token** (OAuth flow or Dropbox’s token generator for development).
2. Create a folder in Dropbox (e.g. `/CasaTrackReno`) and set **`DROPBOX_RENOVATION_FILES_PATH`** to that path (must start with `/`).
3. Server env: **`DROPBOX_APP_KEY`**, **`DROPBOX_APP_SECRET`**, **`DROPBOX_REFRESH_TOKEN`**, **`DROPBOX_RENOVATION_FILES_PATH`**.
4. Client/build env: **`NEXT_PUBLIC_RENOVATION_FILES_STORAGE=dropbox`**.

Files are stored under `{DROPBOX_RENOVATION_FILES_PATH}/{projectId}/files/…`; metadata stays in **`renovation_files`** (same SQL as before). Expense attachments still use the **`renovation-files`** bucket unless changed separately.
