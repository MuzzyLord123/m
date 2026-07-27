-- Enable realtime for accounting tables so UI updates instantly on any change.
ALTER TABLE public.acc_journal_entries REPLICA IDENTITY FULL;
ALTER TABLE public.acc_journal_lines REPLICA IDENTITY FULL;
ALTER TABLE public.acc_ar_invoices REPLICA IDENTITY FULL;
ALTER TABLE public.acc_ap_bills REPLICA IDENTITY FULL;
ALTER TABLE public.acc_bank_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.acc_ar_payments REPLICA IDENTITY FULL;
ALTER TABLE public.acc_ap_payments REPLICA IDENTITY FULL;
ALTER TABLE public.acc_fixed_assets REPLICA IDENTITY FULL;
ALTER TABLE public.acc_vat_returns REPLICA IDENTITY FULL;
ALTER TABLE public.acc_accounting_periods REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_journal_entries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_journal_lines; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_ar_invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_ap_bills; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_bank_transactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_ar_payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_ap_payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_fixed_assets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_vat_returns; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_accounting_periods; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;