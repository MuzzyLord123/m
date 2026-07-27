
-- Table for persisting user sidebar folder layouts
CREATE TABLE public.user_sidebar_layout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  layout_data JSONB NOT NULL DEFAULT '{"folders":[],"itemOrder":[]}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sidebar_layout ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own layout
CREATE POLICY "Users can view own sidebar layout"
  ON public.user_sidebar_layout FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sidebar layout"
  ON public.user_sidebar_layout FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sidebar layout"
  ON public.user_sidebar_layout FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_user_sidebar_layout_updated_at
  BEFORE UPDATE ON public.user_sidebar_layout
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
