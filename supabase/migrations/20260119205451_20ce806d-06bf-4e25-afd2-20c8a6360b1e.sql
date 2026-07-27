-- Create client_billing table for plan, services, and billing info
CREATE TABLE public.client_billing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_name text NOT NULL DEFAULT 'Starter',
  plan_price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  services jsonb DEFAULT '[]'::jsonb,
  add_ons jsonb DEFAULT '[]'::jsonb,
  one_off_charges jsonb DEFAULT '[]'::jsonb,
  next_billing_date date,
  payment_status text DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_billing ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing
CREATE POLICY "Users can view own billing"
ON public.client_billing
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all billing
CREATE POLICY "Admins can view all billing"
ON public.client_billing
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert billing
CREATE POLICY "Admins can insert billing"
ON public.client_billing
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update billing
CREATE POLICY "Admins can update billing"
ON public.client_billing
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete billing
CREATE POLICY "Admins can delete billing"
ON public.client_billing
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_client_billing_updated_at
BEFORE UPDATE ON public.client_billing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();