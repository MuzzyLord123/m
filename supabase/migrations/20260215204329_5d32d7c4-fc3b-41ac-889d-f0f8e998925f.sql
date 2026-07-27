
-- Fix search_path on functions from this migration
ALTER FUNCTION public.generate_join_code() SET search_path = public;
ALTER FUNCTION public.set_channel_join_code() SET search_path = public;
