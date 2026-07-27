
ALTER VIEW public.acc_trial_balance SET (security_invoker = true);

ALTER FUNCTION public.acc_block_posted_entry_mutation() SET search_path = public;
ALTER FUNCTION public.acc_block_posted_line_mutation()  SET search_path = public;
ALTER FUNCTION public.acc_enforce_period_lock()         SET search_path = public;
ALTER FUNCTION public.acc_check_entry_balanced()        SET search_path = public;
