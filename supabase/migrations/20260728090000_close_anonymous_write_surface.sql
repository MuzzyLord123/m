-- Three tables accepted anonymous INSERTs with WITH CHECK (true).
--
-- ecommerce_orders and bookings both carry `status` and `payment_status`, so an
-- unauthenticated request could POST straight to /rest/v1/ecommerce_orders with
-- payment_status='paid', total=0 and mint a fully-paid order without paying.
-- Same shape for bookings.
--
-- Neither is inserted client-side: store-checkout and site-booking create them
-- with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. These policies were pure
-- attack surface, so they are removed rather than narrowed.
DROP POLICY IF EXISTS "Anyone can create orders"   ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- marketing_page_views IS written from the browser (useMarketingPageTracker),
-- so anonymous INSERT stays - but bounded, so it cannot be used to stuff the
-- table with megabyte-sized rows.
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.marketing_page_views;
CREATE POLICY "Anyone can insert bounded page views"
ON public.marketing_page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  path IS NOT NULL
  AND length(path) BETWEEN 1 AND 2048
  AND (referrer   IS NULL OR length(referrer)   <= 2048)
  AND (user_agent IS NULL OR length(user_agent) <= 1024)
);
