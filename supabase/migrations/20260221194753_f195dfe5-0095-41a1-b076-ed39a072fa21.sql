
-- Table to track active calls and signaling
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  channel_id UUID REFERENCES public.comm_channels(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL DEFAULT 'audio' CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed', 'busy')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see calls they're part of
CREATE POLICY "Users can view their own calls" ON public.call_sessions
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can create calls
CREATE POLICY "Users can create calls" ON public.call_sessions
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

-- Users can update calls they're part of
CREATE POLICY "Users can update their calls" ON public.call_sessions
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Trigger for updated_at
CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON public.call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for call_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
