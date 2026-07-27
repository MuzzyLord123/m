
-- HR Employees
CREATE TABLE public.hr_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'engineering',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'probation',
  avatar TEXT DEFAULT '',
  salary NUMERIC DEFAULT 0,
  manager TEXT DEFAULT 'TBD',
  skills TEXT[] DEFAULT '{}',
  performance NUMERIC DEFAULT 0,
  leave_vacation INT DEFAULT 25,
  leave_sick INT DEFAULT 10,
  leave_personal INT DEFAULT 3,
  emergency_contact TEXT DEFAULT 'Not set',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own HR employees" ON public.hr_employees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Time Off Requests
CREATE TABLE public.hr_time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  days INT NOT NULL DEFAULT 1,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hr_time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own time off" ON public.hr_time_off_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Performance Reviews
CREATE TABLE public.hr_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  period TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  goals JSONB DEFAULT '[]',
  feedback TEXT DEFAULT '',
  reviewer TEXT NOT NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON public.hr_performance_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HR Candidates
CREATE TABLE public.hr_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'engineering',
  stage TEXT NOT NULL DEFAULT 'applied',
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  email TEXT DEFAULT '',
  rating NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own candidates" ON public.hr_candidates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wiki Pages
CREATE TABLE public.wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Processes',
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT false,
  last_edited_by TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wiki pages" ON public.wiki_pages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Polls
CREATE TABLE public.office_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.office_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own polls" ON public.office_polls FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Poll Options
CREATE TABLE public.office_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.office_polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.office_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options follow poll access" ON public.office_poll_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.office_polls WHERE id = poll_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.office_polls WHERE id = poll_id AND user_id = auth.uid()));

-- Poll Votes
CREATE TABLE public.office_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.office_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.office_poll_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, voter_id)
);
ALTER TABLE public.office_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own votes" ON public.office_poll_votes FOR ALL USING (auth.uid() = voter_id) WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Poll owners see votes" ON public.office_poll_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.office_polls WHERE id = poll_id AND user_id = auth.uid()));

-- Time Entries
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL DEFAULT '',
  project TEXT NOT NULL DEFAULT '',
  project_color TEXT DEFAULT '#3b82f6',
  client TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INT NOT NULL DEFAULT 0,
  billable BOOLEAN DEFAULT true,
  rate NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own time entries" ON public.time_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  category TEXT NOT NULL DEFAULT 'Other',
  category_color TEXT DEFAULT '#64748b',
  vendor TEXT DEFAULT '',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  has_receipt BOOLEAN DEFAULT false,
  receipt_url TEXT DEFAULT '',
  project TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pomodoro Sessions
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'focus',
  duration_minutes INT NOT NULL DEFAULT 25,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pomodoro" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calculator History
CREATE TABLE public.calculator_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expression TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.calculator_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calc history" ON public.calculator_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
