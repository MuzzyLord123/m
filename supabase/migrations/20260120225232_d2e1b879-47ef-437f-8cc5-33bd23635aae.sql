-- =============================================
-- STEP 1: Create the update_updated_at_column function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- STEP 2: Add new role values to app_role enum
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'financial' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'financial';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'team_member' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'team_member';
  END IF;
END $$;

-- =============================================
-- STEP 3: Create client_teams table
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_account_id uuid NOT NULL,
  team_code text UNIQUE NOT NULL,
  team_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;

-- Generate unique team code function
CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- =============================================
-- STEP 4: Create team_memberships table
-- =============================================
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  member_role text NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner', 'financial', 'project')),
  display_name text,
  invited_by uuid,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: Create client_pricing table
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,
  service_name text NOT NULL,
  description text,
  negotiated_price numeric NOT NULL,
  is_recurring boolean DEFAULT false,
  billing_frequency text CHECK (billing_frequency IN ('one-time', 'monthly', 'quarterly', 'yearly')),
  is_visible boolean DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.client_pricing ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: Create client_contracts table
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  document_url text,
  document_type text DEFAULT 'contract' CHECK (document_type IN ('contract', 'proposal', 'agreement', 'sow')),
  signed_at timestamptz,
  expires_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 7: Create client_invoices table
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'GBP',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  payment_method text,
  items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_part text;
  sequence_num integer;
  invoice_num text;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO sequence_num
  FROM public.client_invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  invoice_num := 'INV-' || year_part || '-' || LPAD(sequence_num::text, 5, '0');
  RETURN invoice_num;
END;
$$;

-- =============================================
-- STEP 8: Create billing_audit_log table
-- =============================================
CREATE TABLE IF NOT EXISTS public.billing_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.client_teams(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 9: Create triggers
-- =============================================
CREATE TRIGGER update_client_teams_updated_at
  BEFORE UPDATE ON public.client_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_pricing_updated_at
  BEFORE UPDATE ON public.client_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON public.client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_invoices_updated_at
  BEFORE UPDATE ON public.client_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();