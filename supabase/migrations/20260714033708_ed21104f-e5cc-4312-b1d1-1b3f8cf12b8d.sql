-- Storage policies for product-images (bucket created separately)
CREATE POLICY "product-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "product-images owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "product-images owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- E-commerce settings (one per user)
CREATE TABLE public.ecommerce_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  store_name TEXT NOT NULL DEFAULT 'My Store',
  contact_email TEXT,
  support_url TEXT,
  currency TEXT NOT NULL DEFAULT 'GBP',
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  brand_color TEXT NOT NULL DEFAULT '#111111',
  checkout_accent TEXT NOT NULL DEFAULT '#111111',
  logo_url TEXT,
  shipping_enabled BOOLEAN NOT NULL DEFAULT true,
  shipping_flat_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_free_over NUMERIC(10,2),
  tax_enabled BOOLEAN NOT NULL DEFAULT false,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_inclusive BOOLEAN NOT NULL DEFAULT false,
  payments_provider TEXT NOT NULL DEFAULT 'none' CHECK (payments_provider IN ('none','stripe','paddle','manual')),
  payments_configured BOOLEAN NOT NULL DEFAULT false,
  payments_test_mode BOOLEAN NOT NULL DEFAULT true,
  checkout_success_url TEXT,
  checkout_cancel_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_settings TO authenticated;
GRANT ALL ON public.ecommerce_settings TO service_role;

ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ecommerce settings"
  ON public.ecommerce_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ecommerce_settings_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER ecommerce_settings_touch
  BEFORE UPDATE ON public.ecommerce_settings
  FOR EACH ROW EXECUTE FUNCTION public.ecommerce_settings_touch();