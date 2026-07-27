
-- Create support tickets table for tracking AI-generated support requests
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reference_id TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'open',
  ai_conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update tickets
CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique reference IDs
CREATE OR REPLACE FUNCTION public.generate_ticket_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_ref TEXT;
  ref_exists BOOLEAN;
BEGIN
  LOOP
    new_ref := 'REQ-' || LPAD(floor(random() * 100000)::text, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE reference_id = new_ref) INTO ref_exists;
    EXIT WHEN NOT ref_exists;
  END LOOP;
  RETURN new_ref;
END;
$$;
