-- Published sites can finally receive enquiries.
--
-- The Workshop has always let people build forms, choose a delivery method
-- and write a success message, but there was nowhere for a submission to
-- land: no table, no endpoint, no handler in the compiled page. Every form
-- on every published site was decorative. This is the missing half.
--
-- Writes arrive only from the site-form-submit edge function under the
-- service role, so the table takes no public INSERT grant. Reads belong to
-- whoever owns the site the form sits on.

CREATE TABLE IF NOT EXISTS public.site_form_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  -- The form's id inside the page JSON, plus the name at time of submission
  -- so an inbox entry still reads sensibly after the form is renamed.
  form_id       text NOT NULL DEFAULT '',
  form_name     text NOT NULL DEFAULT 'Form',
  page_slug     text NOT NULL DEFAULT '',
  -- Field label -> value, exactly as the visitor filled it in.
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Pulled out of the payload for the inbox list, when they can be found.
  contact_name  text,
  contact_email text,
  is_read       boolean NOT NULL DEFAULT false,
  is_spam       boolean NOT NULL DEFAULT false,
  -- Truncated/derived, never a raw address: enough to spot a flood, not
  -- enough to be personal data we did not need to keep.
  ip_hash       text,
  user_agent    text,
  referer       text,
  submitted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_form_submissions_site_idx
  ON public.site_form_submissions (site_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS site_form_submissions_unread_idx
  ON public.site_form_submissions (site_id) WHERE NOT is_read AND NOT is_spam;
-- Supports the per-site-per-window flood check in the submit function.
CREATE INDEX IF NOT EXISTS site_form_submissions_flood_idx
  ON public.site_form_submissions (site_id, ip_hash, submitted_at DESC);

ALTER TABLE public.site_form_submissions ENABLE ROW LEVEL SECURITY;

-- Only the site's owner may read what its forms collected.
DROP POLICY IF EXISTS "owner reads own site submissions" ON public.site_form_submissions;
CREATE POLICY "owner reads own site submissions"
  ON public.site_form_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_form_submissions.site_id AND s.user_id = auth.uid()
  ));

-- Marking read / spam is the only edit an owner needs.
DROP POLICY IF EXISTS "owner updates own site submissions" ON public.site_form_submissions;
CREATE POLICY "owner updates own site submissions"
  ON public.site_form_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_form_submissions.site_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_form_submissions.site_id AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owner deletes own site submissions" ON public.site_form_submissions;
CREATE POLICY "owner deletes own site submissions"
  ON public.site_form_submissions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.designer_sites s
    WHERE s.id = site_form_submissions.site_id AND s.user_id = auth.uid()
  ));

-- No INSERT policy on purpose: submissions arrive through the edge function
-- under the service role, which bypasses RLS. Without a policy, an anonymous
-- caller cannot write straight to the table with the public key.

-- Unread count for the Workshop, without shipping every row to the client.
CREATE OR REPLACE FUNCTION public.site_unread_submission_count(_site_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::int
    FROM public.site_form_submissions f
    JOIN public.designer_sites s ON s.id = f.site_id
   WHERE f.site_id = _site_id
     AND s.user_id = auth.uid()
     AND NOT f.is_read
     AND NOT f.is_spam;
$$;
GRANT EXECUTE ON FUNCTION public.site_unread_submission_count(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
