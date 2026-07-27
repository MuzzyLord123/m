
-- Drop the unique constraint on user_id to allow multiple vaults per user
ALTER TABLE public.vault_configs DROP CONSTRAINT IF EXISTS vault_configs_user_id_key;

-- Remove DELETE policies on vault_configs (vaults can never be deleted)
DROP POLICY IF EXISTS "Users can delete own vault config" ON public.vault_configs;
