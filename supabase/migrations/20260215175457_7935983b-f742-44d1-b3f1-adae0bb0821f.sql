
-- Fix overly permissive policies: drop and recreate with proper scoping
DROP POLICY "Anyone can view proposals by acceptance token" ON public.proposals;
DROP POLICY "Anyone can update proposal acceptance" ON public.proposals;

-- Public can only SELECT proposals (for viewing via shared link)
-- The "Users can manage their own proposals" policy already covers authenticated CRUD

-- For acceptance: use an edge function with service role instead of permissive RLS
