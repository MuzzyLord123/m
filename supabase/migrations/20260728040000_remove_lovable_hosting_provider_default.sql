-- Lovable is fully revoked from the platform (2026-07-28, owner decision).
-- `profiles.hosting_provider` still defaulted to 'Lovable Cloud', so every new
-- signup was stamped with the old vendor's name in a customer-visible field.
ALTER TABLE public.profiles ALTER COLUMN hosting_provider SET DEFAULT 'Quooro Cloud';
UPDATE public.profiles SET hosting_provider = 'Quooro Cloud' WHERE hosting_provider = 'Lovable Cloud';
