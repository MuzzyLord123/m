-- Create ad_campaigns table for storing ad management data
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'linkedin', 'twitter')),
  campaign_name TEXT NOT NULL,
  creative_url TEXT,
  creative_type TEXT DEFAULT 'image' CHECK (creative_type IN ('image', 'video')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'scheduled')),
  objective TEXT CHECK (objective IN ('leads', 'traffic', 'sales', 'awareness', 'engagement')),
  start_date DATE,
  monthly_budget DECIMAL(10, 2),
  notes TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Users can view their own ad campaigns
CREATE POLICY "Users can view their own ad campaigns"
ON public.ad_campaigns
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all ad campaigns
CREATE POLICY "Admins can view all ad campaigns"
ON public.ad_campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can insert ad campaigns
CREATE POLICY "Admins can insert ad campaigns"
ON public.ad_campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can update ad campaigns
CREATE POLICY "Admins can update ad campaigns"
ON public.ad_campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can delete ad campaigns
CREATE POLICY "Admins can delete ad campaigns"
ON public.ad_campaigns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);