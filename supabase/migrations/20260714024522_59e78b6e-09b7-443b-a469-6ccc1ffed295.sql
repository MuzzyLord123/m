
-- ============ 1. site_carts: remove USING(true) leak ============
DROP POLICY IF EXISTS "Carts can be read by session" ON public.site_carts;
DROP POLICY IF EXISTS "Carts can be updated by session" ON public.site_carts;
DROP POLICY IF EXISTS "Carts can be created" ON public.site_carts;

CREATE POLICY "Site owners can view their site carts"
  ON public.site_carts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_carts.site_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Site owners can update their site carts"
  ON public.site_carts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_carts.site_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Cart creation requires session id"
  ON public.site_carts FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 8 AND site_id IS NOT NULL);

-- ============ 2. acc_accountant_invites: remove public token lookup ============
DROP POLICY IF EXISTS "acc_inv token lookup" ON public.acc_accountant_invites;

CREATE POLICY "acc_inv owner select"
  ON public.acc_accountant_invites FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.acc_organizations o
      WHERE o.id = acc_accountant_invites.org_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- ============ 3. ai_model_settings: scope to owner ============
DROP POLICY IF EXISTS "Users can read AI settings" ON public.ai_model_settings;

CREATE POLICY "Users can read their own AI settings"
  ON public.ai_model_settings FOR SELECT
  USING (auth.uid() = user_id);

-- ============ 4. enquiries: remove public draft PII exposure ============
DROP POLICY IF EXISTS "Public can resume drafts with token" ON public.enquiries;
DROP POLICY IF EXISTS "Public can update drafts with token" ON public.enquiries;
-- Draft resume must go through an edge function using the service role
-- with server-side verification of resume_token.

-- ============ 5. poll_votes: hide other users' votes ============
DROP POLICY IF EXISTS "Authenticated users can view poll votes" ON public.poll_votes;

CREATE POLICY "Users view own votes or votes in their channels"
  ON public.poll_votes FOR SELECT
  USING (
    auth.uid() = user_id
    OR (channel_id IS NOT NULL AND public.is_channel_member(channel_id))
  );

-- ============ 6. Storage: drop broad SELECT policies that enable listing ============
-- Public CDN access to individual objects continues to work without RLS.
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view ad creatives" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view content request files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for designer uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read public site files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view branding assets" ON storage.objects;

-- ============ 7. Revoke EXECUTE from anon/authenticated on trigger-only SECURITY DEFINER functions ============
REVOKE EXECUTE ON FUNCTION public.acc_after_org_insert()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.acc_log_change()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_blocked_ip()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_enquiry_pii()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_lead_pii()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_profile_pii()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_security_log_ip()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_whitelisted_ip()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_storage_quota()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ai_conversation_timestamp()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_thread_count()                  FROM PUBLIC, anon, authenticated;

-- Also revoke on internal validation / cron helpers that should not be RPC-callable
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_customer_id()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_reference()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_verification_token(uuid)      FROM PUBLIC, anon, authenticated;
