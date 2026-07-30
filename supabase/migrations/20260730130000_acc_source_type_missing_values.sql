-- The AR/AP posting functions insert journal entries with source_type
-- values that were never added to the acc_source_type enum, so posting
-- any AR invoice or payment failed with "invalid input value for enum"
-- (this is the Create and post error the owner hit). Add every value the
-- shipped functions actually use.
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ar_invoice';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ar_invoice_void';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ar_payment';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ap_bill';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ap_bill_void';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'ap_payment';
ALTER TYPE public.acc_source_type ADD VALUE IF NOT EXISTS 'fx_reval';
