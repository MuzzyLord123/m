
-- 1) Add account_type to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'paid_client';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('paid_client','live_preview','viewer_only','business_management','admin'));

-- Backfill admins
UPDATE public.profiles p
SET account_type = 'admin'
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
  AND account_type = 'paid_client';

-- 2) Presets table
CREATE TABLE IF NOT EXISTS public.account_type_presets (
  account_type text PRIMARY KEY
    CHECK (account_type IN ('paid_client','live_preview','viewer_only','business_management','admin')),
  visible_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  suppress_prompts boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.account_type_presets TO authenticated;
GRANT ALL    ON public.account_type_presets TO service_role;

ALTER TABLE public.account_type_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read presets" ON public.account_type_presets;
CREATE POLICY "Authenticated can read presets"
  ON public.account_type_presets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage presets" ON public.account_type_presets;
CREATE POLICY "Admins manage presets"
  ON public.account_type_presets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed defaults (idempotent)
INSERT INTO public.account_type_presets (account_type, visible_features, hidden_features, suppress_prompts) VALUES
  ('paid_client', '[]'::jsonb, '[]'::jsonb, false),
  ('live_preview', '[]'::jsonb, '[]'::jsonb, false),
  ('viewer_only',
    '["dashboard","files","notifications"]'::jsonb,
    '["billing","invoices","website-designer","cad-studio","hosted-sites","subscription-sites","ecommerce"]'::jsonb,
    true),
  ('business_management',
    '["dashboard","crm","office","planner","calendar","files","vault","email","team-comms","bookings","inventory","accounting","hr","ads","social","marketing-calendar","content","notifications","tickets","reports"]'::jsonb,
    '["website-designer","cad-studio","hosted-sites","subscription-sites","ecommerce","preview"]'::jsonb,
    true),
  ('admin', '[]'::jsonb, '[]'::jsonb, false)
ON CONFLICT (account_type) DO NOTHING;
