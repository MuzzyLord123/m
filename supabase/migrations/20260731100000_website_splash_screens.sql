-- The website splash: a set of designs, one of which is live. Anyone
-- can read the live one because it is shown to every visitor; only
-- owners can see the whole set, add to it, or change which is live.
-- Mirror of the applied migration website_splash_screens.

CREATE TABLE IF NOT EXISTS public.splash_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text NOT NULL DEFAULT 'built_in',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_splash_one_live
  ON public.splash_screens (is_active) WHERE is_active;

ALTER TABLE public.splash_screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS splash_read_live ON public.splash_screens;
CREATE POLICY splash_read_live ON public.splash_screens FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_platform_owner(auth.uid()));

DROP POLICY IF EXISTS splash_owner_write ON public.splash_screens;
CREATE POLICY splash_owner_write ON public.splash_screens FOR ALL TO authenticated
  USING (public.is_platform_owner(auth.uid()))
  WITH CHECK (public.is_platform_owner(auth.uid()));

GRANT SELECT ON public.splash_screens TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.splash_screens TO authenticated;

CREATE OR REPLACE FUNCTION public.set_active_splash(_id uuid)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_platform_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  UPDATE public.splash_screens SET is_active = false, updated_at = now() WHERE is_active;
  UPDATE public.splash_screens SET is_active = true, updated_at = now() WHERE id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_active_splash(uuid) TO authenticated;

INSERT INTO public.splash_screens (name, origin, config, is_active)
SELECT * FROM (VALUES
  ('Sweep', 'built_in', '{"motif":"sweep","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Built in Wales","durationMs":2200,"grain":true}'::jsonb, true),
  ('Typeset', 'built_in', '{"motif":"typeset","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Digital operations for ambitious brands","durationMs":2100,"grain":true}'::jsonb, false),
  ('Lattice', 'built_in', '{"motif":"lattice","bg":"#08080B","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Built in Wales","durationMs":2400,"grain":false}'::jsonb, false),
  ('Ember', 'built_in', '{"motif":"ember","bg":"#0A0A0D","ink":"#F4F4F5","accent":"#E8613C","wordmark":"Quooro","line":"Since the first line","durationMs":2000,"grain":true}'::jsonb, false),
  ('Aperture', 'built_in', '{"motif":"aperture","bg":"#0A0A0D","ink":"#EDEDEF","accent":"#C2410C","wordmark":"Quooro","line":"Built in Wales","durationMs":2300,"grain":false}'::jsonb, false)
) AS v(name, origin, config, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.splash_screens);

NOTIFY pgrst, 'reload schema';
