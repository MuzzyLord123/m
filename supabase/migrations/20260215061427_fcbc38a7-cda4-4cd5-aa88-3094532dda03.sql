
-- Product categories for organizing products
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'GBP',
  sku TEXT,
  barcode TEXT,
  track_inventory BOOLEAN DEFAULT false,
  inventory_count INT DEFAULT 0,
  weight NUMERIC(8,2),
  weight_unit TEXT DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10,2),
  compare_at_price NUMERIC(10,2),
  inventory_count INT DEFAULT 0,
  options JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shopping cart for end visitors
CREATE TABLE public.site_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  visitor_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','abandoned','converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders from published sites
CREATE TABLE public.site_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  shipping_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_intent_id TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visitor accounts for published sites
CREATE TABLE public.site_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  password_hash TEXT,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, email)
);

-- Bookings/appointments for service businesses
CREATE TABLE public.site_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES public.site_visitors(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  duration_minutes INT DEFAULT 60,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_bookings ENABLE ROW LEVEL SECURITY;

-- RLS: Owners manage their own data
CREATE POLICY "Users manage own categories" ON public.product_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users manage own orders" ON public.site_orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own visitors" ON public.site_visitors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.designer_sites s WHERE s.id = site_id AND s.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.designer_sites s WHERE s.id = site_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users manage own bookings" ON public.site_bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read for active products (for published sites)
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'active')
);

-- Cart: anyone can create/manage via session
CREATE POLICY "Anyone can manage carts" ON public.site_carts FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_orders_updated_at BEFORE UPDATE ON public.site_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_carts_updated_at BEFORE UPDATE ON public.site_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_visitors_updated_at BEFORE UPDATE ON public.site_visitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_bookings_updated_at BEFORE UPDATE ON public.site_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_products_user_site ON public.products(user_id, site_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_site_orders_user ON public.site_orders(user_id, site_id);
CREATE INDEX idx_site_visitors_site_email ON public.site_visitors(site_id, email);
CREATE INDEX idx_site_bookings_date ON public.site_bookings(site_id, booking_date);
CREATE INDEX idx_site_carts_session ON public.site_carts(session_id);

-- Order number generator
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT;
  seq INT;
  order_num TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO seq FROM public.site_orders WHERE order_number LIKE 'ORD-' || year_part || '-%';
  order_num := 'ORD-' || year_part || '-' || LPAD(seq::text, 5, '0');
  RETURN order_num;
END;
$$;
