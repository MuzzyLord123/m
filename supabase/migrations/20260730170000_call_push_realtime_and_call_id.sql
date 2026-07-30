-- Phone-first calling fixes (2026-07-30): the push carries the call log
-- id so the phone can stream its transcript against the same call, and
-- pushes flow over realtime so the handset reacts instantly instead of
-- waiting on a poll.
ALTER TABLE public.crm_call_pushes ADD COLUMN IF NOT EXISTS call_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'crm_call_pushes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_call_pushes;
  END IF;
END $$;

ALTER TABLE public.crm_call_pushes REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';
