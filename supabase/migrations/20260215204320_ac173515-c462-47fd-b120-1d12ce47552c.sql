
-- Add join_code to comm_channels for team members to join by code
ALTER TABLE public.comm_channels ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Function to generate a random 6-char alphanumeric join code
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Auto-generate join code on channel creation
CREATE OR REPLACE FUNCTION public.set_channel_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_channel_join_code
  BEFORE INSERT ON public.comm_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_channel_join_code();

-- Backfill existing channels with join codes
UPDATE public.comm_channels SET join_code = public.generate_join_code() WHERE join_code IS NULL;
