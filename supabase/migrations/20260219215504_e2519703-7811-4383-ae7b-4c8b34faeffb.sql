
-- Inventory Management Schema

-- Categories table
CREATE TABLE public.inv_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON public.inv_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Locations table
CREATE TABLE public.inv_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  manager_name TEXT,
  manager_contact TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locations" ON public.inv_locations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products table
CREATE TABLE public.inv_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  description TEXT,
  category_id UUID REFERENCES public.inv_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'pieces',
  reorder_level INTEGER NOT NULL DEFAULT 0,
  reorder_qty INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  supplier_name TEXT,
  supplier_contact TEXT,
  lead_time_days INTEGER,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sku)
);

ALTER TABLE public.inv_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own products" ON public.inv_products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock levels table
CREATE TABLE public.inv_stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.inv_locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, location_id)
);

ALTER TABLE public.inv_stock_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage stock for own products" ON public.inv_stock_levels FOR ALL
  USING (EXISTS (SELECT 1 FROM public.inv_products p WHERE p.id = product_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inv_products p WHERE p.id = product_id AND p.user_id = auth.uid()));

-- Stock movements table
CREATE TABLE public.inv_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.inv_locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES public.inv_locations(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','transfer','adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own movements" ON public.inv_stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock count sessions table
CREATE TABLE public.inv_stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID REFERENCES public.inv_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','finalized')),
  name TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_stock_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stock counts" ON public.inv_stock_counts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock count items
CREATE TABLE public.inv_stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES public.inv_stock_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  expected_qty INTEGER NOT NULL DEFAULT 0,
  counted_qty INTEGER,
  discrepancy INTEGER GENERATED ALWAYS AS (COALESCE(counted_qty, 0) - expected_qty) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_stock_count_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage count items for own counts" ON public.inv_stock_count_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.inv_stock_counts c WHERE c.id = count_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inv_stock_counts c WHERE c.id = count_id AND c.user_id = auth.uid()));

-- Settings table for inventory preferences
CREATE TABLE public.inv_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  multi_location_enabled BOOLEAN NOT NULL DEFAULT false,
  low_stock_notifications BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inv_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.inv_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER inv_locations_updated_at BEFORE UPDATE ON public.inv_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inv_products_updated_at BEFORE UPDATE ON public.inv_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inv_stock_levels_updated_at BEFORE UPDATE ON public.inv_stock_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inv_stock_counts_updated_at BEFORE UPDATE ON public.inv_stock_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inv_settings_updated_at BEFORE UPDATE ON public.inv_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
