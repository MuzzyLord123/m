
-- Create office documents table for Quooro Word
CREATE TABLE public.office_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB DEFAULT '{}',
  document_type TEXT NOT NULL DEFAULT 'word' CHECK (document_type IN ('word', 'sheet', 'presentation')),
  page_size TEXT DEFAULT 'a4',
  page_orientation TEXT DEFAULT 'portrait',
  margins JSONB DEFAULT '{"top": 72, "bottom": 72, "left": 72, "right": 72}',
  is_template BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  word_count INTEGER DEFAULT 0,
  last_edited_by UUID,
  shared_with JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own documents"
  ON public.office_documents FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Users can create own documents"
  ON public.office_documents FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own documents"
  ON public.office_documents FOR UPDATE
  USING (public.is_owner(user_id));

CREATE POLICY "Users can delete own documents"
  ON public.office_documents FOR DELETE
  USING (public.is_owner(user_id));

-- Admins can view all
CREATE POLICY "Admins can view all documents"
  ON public.office_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_office_documents_updated_at
  BEFORE UPDATE ON public.office_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_office_documents_user_id ON public.office_documents(user_id);
CREATE INDEX idx_office_documents_type ON public.office_documents(document_type);
