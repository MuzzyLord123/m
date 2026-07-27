
-- Create user_branding table
CREATE TABLE public.user_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  logo_url text,
  hide_platform_badge boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own branding
CREATE POLICY "Users can view own branding" ON public.user_branding
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own branding" ON public.user_branding
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own branding" ON public.user_branding
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Team owners (managers) can update their members' branding (push logo)
CREATE POLICY "Team owners can update member branding" ON public.user_branding
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      JOIN public.client_teams ct ON ct.id = tm.team_id
      WHERE tm.user_id = user_branding.user_id
      AND ct.primary_account_id = auth.uid()
    )
  );

-- Team owners can read member branding
CREATE POLICY "Team owners can view member branding" ON public.user_branding
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      JOIN public.client_teams ct ON ct.id = tm.team_id
      WHERE tm.user_id = user_branding.user_id
      AND ct.primary_account_id = auth.uid()
    )
  );

-- Create team_branding table
CREATE TABLE public.team_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL UNIQUE,
  default_logo_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.team_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view own team branding" ON public.team_branding
  FOR SELECT TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert team branding" ON public.team_branding
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update team branding" ON public.team_branding
  FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can delete team branding" ON public.team_branding
  FOR DELETE TO authenticated
  USING (auth.uid() = manager_id);

-- Team members can read their manager's team branding (for fallback)
CREATE POLICY "Team members can view team branding" ON public.team_branding
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      JOIN public.client_teams ct ON ct.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND ct.primary_account_id = team_branding.manager_id
    )
  );

-- Create branding-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('branding-assets', 'branding-assets', true);

-- Storage policies for branding-assets
CREATE POLICY "Users can upload branding assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update branding assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete branding assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view branding assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'branding-assets');

-- Updated_at trigger
CREATE TRIGGER update_user_branding_updated_at
  BEFORE UPDATE ON public.user_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_team_branding_updated_at
  BEFORE UPDATE ON public.team_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
