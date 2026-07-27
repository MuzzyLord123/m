
-- Owner flag on profiles (marks main owners who cannot be demoted by other admins)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Seed the two main owners by email
UPDATE public.profiles SET is_owner = true
WHERE lower(email) IN ('echelonsites@gmail.com', 'zakmuzzy100@gmail.com');
