-- Add client-specific fields to profiles table for admin management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS plan TEXT,
ADD COLUMN IF NOT EXISTS page_count TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a function to generate unique customer IDs
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: ECH-XXXXX (5 alphanumeric chars)
    new_id := 'ECH-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 5));
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_id = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Add RLS policy for admins to view all customer uploads
CREATE POLICY "Admins can view all customer uploads"
ON public.customer_uploads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete customer uploads
CREATE POLICY "Admins can delete customer uploads"
ON public.customer_uploads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to insert profiles (when creating client accounts)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to manage user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));