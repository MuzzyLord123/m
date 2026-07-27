-- Create content_requests table
CREATE TABLE public.content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('blog', 'social_post', 'ad_copy', 'website_section')),
  title TEXT NOT NULL,
  description TEXT,
  reference_urls TEXT[],
  reference_files TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered')),
  assigned_to TEXT,
  admin_notes TEXT,
  delivered_content TEXT,
  delivered_files TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own content requests"
ON public.content_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own content requests"
ON public.content_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all content requests
CREATE POLICY "Admins can view all content requests"
ON public.content_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update content requests
CREATE POLICY "Admins can update content requests"
ON public.content_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete content requests
CREATE POLICY "Admins can delete content requests"
ON public.content_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_content_requests_updated_at
  BEFORE UPDATE ON public.content_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create storage bucket for content request files
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-requests', 'content-requests', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-requests bucket
CREATE POLICY "Users can upload content request files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-requests' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can upload content request files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-requests' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Anyone can view content request files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-requests');

CREATE POLICY "Admins can delete content request files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-requests' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);