
-- Create poll_votes table to track who voted on what
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT NOT NULL,
  option_index INT NOT NULL,
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES public.comm_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.comm_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id) -- one vote per user per poll
);

-- Enable RLS
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view votes (to see counts)
CREATE POLICY "Authenticated users can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own vote
CREATE POLICY "Users can cast their own vote"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete votes (permanent)
-- No UPDATE or DELETE policies

-- Index for fast lookups
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);

-- Enable realtime for live vote updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
