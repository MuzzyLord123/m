-- Update generator function to use QUO- prefix
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'QUO-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 5));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Rename all existing ECH- customer_ids to QUO-
UPDATE public.profiles
SET customer_id = 'QUO-' || SUBSTRING(customer_id FROM 5)
WHERE customer_id LIKE 'ECH-%';