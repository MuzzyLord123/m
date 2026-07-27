
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can read active announcements"
ON public.announcements
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
