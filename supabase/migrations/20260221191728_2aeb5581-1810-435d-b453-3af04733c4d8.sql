
-- Create inventory companies table
CREATE TABLE public.inv_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inv_companies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own companies" ON public.inv_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own companies" ON public.inv_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.inv_companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON public.inv_companies FOR DELETE USING (auth.uid() = user_id);

-- Add company_id to existing products table
ALTER TABLE public.inv_products ADD COLUMN company_id UUID REFERENCES public.inv_companies(id) ON DELETE CASCADE;

-- Add updated_at trigger
CREATE TRIGGER update_inv_companies_updated_at
  BEFORE UPDATE ON public.inv_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
