-- Every surface that shows a splash gets its own set and its own live
-- design: the public website, the customer Lounge, and the Team portal.
-- Mirror of the applied migration splash_surfaces_lounge_and_team.

ALTER TABLE public.splash_screens
  ADD COLUMN IF NOT EXISTS surface text NOT NULL DEFAULT 'website';

DROP INDEX IF EXISTS public.idx_splash_one_live;
CREATE UNIQUE INDEX IF NOT EXISTS idx_splash_one_live_per_surface
  ON public.splash_screens (surface) WHERE is_active;

CREATE OR REPLACE FUNCTION public.set_active_splash(_id uuid)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_surface text;
BEGIN
  IF NOT public.is_platform_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  SELECT surface INTO v_surface FROM public.splash_screens WHERE id = _id;
  IF v_surface IS NULL THEN RAISE EXCEPTION 'No such splash'; END IF;

  UPDATE public.splash_screens
     SET is_active = false, updated_at = now()
   WHERE is_active AND surface = v_surface;
  UPDATE public.splash_screens
     SET is_active = true, updated_at = now()
   WHERE id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_active_splash(uuid) TO authenticated;

INSERT INTO public.splash_screens (name, origin, surface, config, is_active)
SELECT * FROM (VALUES
  ('Daybreak', 'built_in', 'lounge',
   '{"motif":"aurora","bg":"#0A0A0D","ink":"#F4F4F5","accent":"#C2410C","wordmark":"Quooro","line":"Your lounge","sub":"Lounge","durationMs":2200,"grain":true}'::jsonb, true),
  ('Welcome', 'built_in', 'lounge',
   '{"motif":"typeset","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#E8613C","wordmark":"Quooro","line":"Everything of yours, in one place","sub":"Lounge","durationMs":2000,"grain":true}'::jsonb, false),
  ('Hearth', 'built_in', 'lounge',
   '{"motif":"ember","bg":"#0A0A0D","ink":"#F4F4F5","accent":"#E8613C","wordmark":"Quooro","line":"Good to see you","sub":"Lounge","durationMs":1900,"grain":true}'::jsonb, false),
  ('Orbit (previous)', 'legacy', 'lounge',
   '{"motif":"sweep","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#9A9A9A","wordmark":"Quooro","line":"Loading your lounge","sub":"Lounge","durationMs":2400,"grain":false}'::jsonb, false),
  ('Telemetry', 'built_in', 'team',
   '{"motif":"console","bg":"#08080B","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Team portal","sub":"Team","durationMs":2100,"grain":false}'::jsonb, true),
  ('Standing to', 'built_in', 'team',
   '{"motif":"lattice","bg":"#08080B","ink":"#E8E8EC","accent":"#C2410C","wordmark":"Quooro","line":"The desk is ready","sub":"Team","durationMs":2200,"grain":false}'::jsonb, false),
  ('Sweep (team)', 'built_in', 'team',
   '{"motif":"sweep","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Team portal","sub":"Team","durationMs":2000,"grain":true}'::jsonb, false)
) AS v(name, origin, surface, config, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.splash_screens WHERE surface IN ('lounge', 'team'));

NOTIFY pgrst, 'reload schema';
