-- Create social_media_accounts table for connected accounts
CREATE TABLE public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube')),
  account_handle TEXT NOT NULL,
  account_name TEXT,
  profile_url TEXT,
  managed_by TEXT DEFAULT 'Echelon Team',
  posting_frequency TEXT DEFAULT 'Weekly',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disconnected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_posts table for content calendar
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'carousel', 'story', 'reel')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_media_accounts
CREATE POLICY "Users can view their own social media accounts"
  ON public.social_media_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all social media accounts"
  ON public.social_media_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert social media accounts"
  ON public.social_media_accounts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update social media accounts"
  ON public.social_media_accounts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete social media accounts"
  ON public.social_media_accounts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS policies for social_media_posts
CREATE POLICY "Users can view their own social media posts"
  ON public.social_media_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all social media posts"
  ON public.social_media_posts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert social media posts"
  ON public.social_media_posts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update social media posts"
  ON public.social_media_posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete social media posts"
  ON public.social_media_posts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add updated_at triggers
CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();