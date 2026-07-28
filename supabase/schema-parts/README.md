# Schema parts — paste these into the Supabase SQL Editor

The full `../consolidated-schema.sql` is ~626 KB, which the SQL Editor can choke
on. These are the same statements split at safe boundaries into 5 pastes.

**Run them in order, 1 → 5, into project `tkvphfxqyoavnuibvmfp`:**
https://supabase.com/dashboard/project/tkvphfxqyoavnuibvmfp/sql/new

Each part repeats the `SET check_function_bodies = false` preamble, which is what
lets functions be created before the tables they reference. Don't drop it.

Verified: replayed against a clean PostgreSQL 16 in order, producing 188 tables,
544 RLS policies, 352 functions, 145 triggers and 22 enum types, with all four
security assertions returning zero.

If a part errors with "already exists", the schema isn't empty — reset it at
**Settings → General → Reset database** and start again from part 1.
