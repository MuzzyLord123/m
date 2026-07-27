
-- Sticky walls table
CREATE TABLE public.sticky_walls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Wall',
  is_starred BOOLEAN NOT NULL DEFAULT false,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sticky_walls ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own sticky walls"
  ON public.sticky_walls FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sticky walls"
  ON public.sticky_walls FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky walls"
  ON public.sticky_walls FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky walls"
  ON public.sticky_walls FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_sticky_walls_updated_at
  BEFORE UPDATE ON public.sticky_walls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
