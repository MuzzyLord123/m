-- Add known_ips column to profiles table for storing recognized IP addresses
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS known_ips text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.known_ips IS 'Array of known/trusted IP addresses for this user';