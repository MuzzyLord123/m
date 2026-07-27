-- Add website status and preview URL columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_status text DEFAULT 'design',
ADD COLUMN IF NOT EXISTS preview_url text,
ADD COLUMN IF NOT EXISTS site_published_at timestamp with time zone;

-- Add a check constraint for valid website statuses
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_website_status CHECK (website_status IN ('design', 'development', 'review', 'live', 'not_published'));