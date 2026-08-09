-- Per-merchant Stripe secret key for storefront payments.
-- The table is already RLS'd to the owner (auth.uid() = user_id), so only
-- the merchant and the service role can ever read it. The embed feed's
-- public settings subset never selects this column.
-- (Applied to the live project on 2026-08-09 as migration ecom_stripe_secret_key.)
ALTER TABLE public.ecommerce_settings ADD COLUMN IF NOT EXISTS stripe_secret_key text;
