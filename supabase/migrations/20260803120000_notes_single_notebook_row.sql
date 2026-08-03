-- One notebook row per person, enforced by the database.
--
-- The notes autosave did SELECT-then-INSERT: look for an existing notebook
-- row, and create one if there is none. Two saves firing close together -
-- a second tab, or an edit landing just after load - both looked, both
-- found nothing, and both inserted. That left duplicate notebook rows.
--
-- The damage compounds on read: the loader used .maybeSingle(), which
-- errors outright when it matches more than one row, so the notebook
-- silently fell back to the empty default and the duplicates surfaced as
-- phantom pages.
--
-- A read-then-write check cannot fix a race. A unique index can, because it
-- turns the second insert into a conflict the client can upsert through.

-- Collapse what is already there, keeping the most recently updated row for
-- each person and app source. Nothing is lost: the newest row is the one
-- carrying the current notebook.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, app_source, source_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC
         ) AS rn
    FROM public.platform_files
   WHERE source_id IS NOT NULL
)
DELETE FROM public.platform_files f
 USING ranked r
 WHERE f.id = r.id
   AND r.rn > 1;

-- And make it impossible to recreate.
CREATE UNIQUE INDEX IF NOT EXISTS platform_files_one_per_source
  ON public.platform_files (user_id, app_source, source_id)
  WHERE source_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
