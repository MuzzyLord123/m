-- Create table for customer uploads (images and notes)
CREATE TABLE public.customer_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for customer uploads
CREATE POLICY "Users can view their own uploads" 
ON public.customer_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" 
ON public.customer_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" 
ON public.customer_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for customer images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-uploads', 'customer-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for customer uploads
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);