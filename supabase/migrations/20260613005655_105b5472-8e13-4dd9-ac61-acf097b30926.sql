
CREATE TABLE public.greeting_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.greeting_messages TO authenticated;
GRANT ALL ON public.greeting_messages TO service_role;

ALTER TABLE public.greeting_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all greetings"
ON public.greeting_messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own enabled greeting"
ON public.greeting_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_greeting_messages_updated_at
BEFORE UPDATE ON public.greeting_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
