
-- Allow admins to view all vault configs for audit purposes
CREATE POLICY "Admins can view all vault configs"
  ON public.password_vault_configs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Check if vault_configs already has admin policy, if not add one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vault_configs' AND policyname = 'Admins can view all vault configs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all vault configs" ON public.vault_configs FOR SELECT USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;
