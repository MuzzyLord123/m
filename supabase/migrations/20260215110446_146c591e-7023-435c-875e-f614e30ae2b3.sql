
-- Calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule JSONB,
  reminders JSONB DEFAULT '[]'::jsonb,
  attendees JSONB DEFAULT '[]'::jsonb,
  meeting_link TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  calendar_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User calendars table
CREATE TABLE public.user_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Calendar',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recurring event exceptions
CREATE TABLE public.calendar_event_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  modified_event_data JSONB,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_exceptions ENABLE ROW LEVEL SECURITY;

-- Calendar events policies
CREATE POLICY "Users can view own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- User calendars policies
CREATE POLICY "Users can view own calendars" ON public.user_calendars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendars" ON public.user_calendars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendars" ON public.user_calendars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendars" ON public.user_calendars FOR DELETE USING (auth.uid() = user_id);

-- Event exceptions policies
CREATE POLICY "Users can view own event exceptions" ON public.calendar_event_exceptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.calendar_events WHERE id = event_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own event exceptions" ON public.calendar_event_exceptions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.calendar_events WHERE id = event_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own event exceptions" ON public.calendar_event_exceptions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.calendar_events WHERE id = event_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own event exceptions" ON public.calendar_event_exceptions FOR DELETE USING (EXISTS (SELECT 1 FROM public.calendar_events WHERE id = event_id AND user_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_calendars_updated_at BEFORE UPDATE ON public.user_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
