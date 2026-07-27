
-- ============================================================
-- QUOORO UNIVERSAL BOOKING SYSTEM
-- ============================================================

-- 1. Booking Services (what can be booked)
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  buffer_minutes INT NOT NULL DEFAULT 0,
  price NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  max_bookings_per_slot INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3b82f6',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Booking Staff
CREATE TABLE public.booking_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Staff-Service assignments (which staff can do which services)
CREATE TABLE public.booking_staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.booking_staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, service_id)
);

-- 4. Availability schedules (per-staff or global)
CREATE TABLE public.booking_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  staff_id UUID REFERENCES public.booking_staff(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday...6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Blocked dates (holidays, days off)
CREATE TABLE public.booking_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  staff_id UUID REFERENCES public.booking_staff(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enhanced bookings table (universal - works for all channels)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.booking_services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.booking_staff(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'direct',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  payment_status TEXT DEFAULT 'unpaid',
  payment_intent_id TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  rescheduled_from UUID REFERENCES public.bookings(id),
  external_calendar_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Booking settings (per-user global config)
CREATE TABLE public.booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT,
  business_slug TEXT UNIQUE,
  timezone TEXT DEFAULT 'Europe/London',
  booking_page_enabled BOOLEAN DEFAULT true,
  embed_enabled BOOLEAN DEFAULT true,
  require_payment BOOLEAN DEFAULT false,
  auto_confirm BOOLEAN DEFAULT true,
  allow_cancellation BOOLEAN DEFAULT true,
  cancellation_hours INT DEFAULT 24,
  allow_reschedule BOOLEAN DEFAULT true,
  reschedule_hours INT DEFAULT 24,
  booking_notice_hours INT DEFAULT 1,
  max_advance_days INT DEFAULT 90,
  confirmation_message TEXT DEFAULT 'Your booking has been confirmed!',
  branding_color TEXT DEFAULT '#3b82f6',
  branding_logo TEXT,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own services" ON public.booking_services FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own staff" ON public.booking_staff FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff service links follow staff ownership" ON public.booking_staff_services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.booking_staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.booking_staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users manage own availability" ON public.booking_availability FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own blocked dates" ON public.booking_blocked_dates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own booking settings" ON public.booking_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read policies for booking widgets/embeds (service discovery)
CREATE POLICY "Public can view active services" ON public.booking_services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active staff" ON public.booking_staff FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view staff services" ON public.booking_staff_services FOR SELECT USING (true);
CREATE POLICY "Public can view availability" ON public.booking_availability FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view blocked dates" ON public.booking_blocked_dates FOR SELECT USING (true);
CREATE POLICY "Public can view booking settings" ON public.booking_settings FOR SELECT USING (booking_page_enabled = true);

-- Allow anonymous inserts for bookings (from embeds/hosted pages)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_bookings_user_date ON public.bookings(user_id, booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(user_id, status);
CREATE INDEX idx_bookings_source ON public.bookings(user_id, source);
CREATE INDEX idx_booking_services_user ON public.booking_services(user_id);
CREATE INDEX idx_booking_staff_user ON public.booking_staff(user_id);
CREATE INDEX idx_booking_availability_user ON public.booking_availability(user_id, staff_id, day_of_week);
CREATE INDEX idx_booking_settings_slug ON public.booking_settings(business_slug);

-- Triggers
CREATE TRIGGER update_booking_services_updated_at BEFORE UPDATE ON public.booking_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_booking_staff_updated_at BEFORE UPDATE ON public.booking_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
