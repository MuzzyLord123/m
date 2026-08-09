-- Two more tables lost in the migration off Lovable, both still referenced
-- by deployed edge functions.
--
-- site_visitor_sessions: site-visitor-auth writes a session row on signup
-- and login and reads it back on verify. The writes never checked their
-- error, so signup and login appeared to succeed and handed back a token
-- that referred to nothing - every storefront customer was silently
-- signed out again on the next page load.
--
-- site_business_settings: site-booking reads a merchant's opening hours
-- from here and falls back to `|| default` on each field. With the table
-- absent, every store silently served 09:00-17:00 Mon-Fri in 60 minute
-- slots no matter what its owner had configured.

CREATE TABLE IF NOT EXISTS public.site_visitor_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- A real foreign key, not just a uuid column: site-visitor-auth's verify
  -- does .select("*, site_visitors(*)"), and PostgREST can only resolve
  -- that embed if the relationship is declared here.
  visitor_id    uuid        NOT NULL REFERENCES public.site_visitors(id) ON DELETE CASCADE,
  session_token text        NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visitor_sessions_visitor_idx
  ON public.site_visitor_sessions (visitor_id);

ALTER TABLE public.site_visitor_sessions ENABLE ROW LEVEL SECURITY;
-- Deliberately no policy. These rows are bearer tokens for shoppers on a
-- merchant's site, who are not Quooro users and hold no JWT; the only
-- legitimate reader is site-visitor-auth running as the service role,
-- which bypasses RLS. RLS on with no policy denies anon and authenticated
-- outright, which is exactly the intent.


CREATE TABLE IF NOT EXISTS public.site_business_settings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id              uuid        NOT NULL UNIQUE REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  -- Exactly the four fields site-booking reads, with the same defaults it
  -- already falls back to, so behaviour is unchanged until an owner edits
  -- them. Columns are added when a screen needs them, not speculatively.
  booking_slot_duration integer    NOT NULL DEFAULT 60,
  booking_start_time    time       NOT NULL DEFAULT '09:00:00',
  booking_end_time      time       NOT NULL DEFAULT '17:00:00',
  booking_days          text[]     NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_business_settings ENABLE ROW LEVEL SECURITY;

-- The site owner manages their own settings.
DROP POLICY IF EXISTS "Owners manage their site business settings" ON public.site_business_settings;
CREATE POLICY "Owners manage their site business settings"
  ON public.site_business_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.designer_sites s
                 WHERE s.id = site_business_settings.site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.designer_sites s
                 WHERE s.id = site_business_settings.site_id AND s.user_id = auth.uid()));
