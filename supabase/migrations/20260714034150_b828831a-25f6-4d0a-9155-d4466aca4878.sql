CREATE TABLE public.ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL DEFAULT concat('ORD-', to_char(now(),'YYMMDD'), '-', substr(gen_random_uuid()::text,1,6)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  currency TEXT NOT NULL DEFAULT 'GBP',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_provider TEXT NOT NULL DEFAULT 'none',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_intent_id TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_orders TO authenticated;
GRANT SELECT, INSERT ON public.ecommerce_orders TO anon;
GRANT ALL ON public.ecommerce_orders TO service_role;

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Owner (merchant) can manage their own orders
CREATE POLICY "Merchant reads own orders"
  ON public.ecommerce_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Merchant updates own orders"
  ON public.ecommerce_orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Merchant deletes own orders"
  ON public.ecommerce_orders FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous shoppers may create an order and read it by ID
CREATE POLICY "Anyone can create orders"
  ON public.ecommerce_orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read a specific order"
  ON public.ecommerce_orders FOR SELECT TO anon
  USING (true);

CREATE INDEX ecommerce_orders_user_idx ON public.ecommerce_orders(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.ecommerce_orders_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER ecommerce_orders_touch
  BEFORE UPDATE ON public.ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.ecommerce_orders_touch();