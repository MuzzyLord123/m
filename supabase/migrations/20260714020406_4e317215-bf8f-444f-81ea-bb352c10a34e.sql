
ALTER TABLE public.subscription_sites
  ADD COLUMN IF NOT EXISTS acc_org_id uuid REFERENCES public.acc_organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acc_customer_id uuid REFERENCES public.acc_customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acc_revenue_account_id uuid REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_invoice boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_invoiced_on date;

ALTER TABLE public.acc_ar_invoices
  ADD COLUMN IF NOT EXISTS subscription_site_id uuid REFERENCES public.subscription_sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acc_ar_invoices_subscription_site
  ON public.acc_ar_invoices(subscription_site_id) WHERE subscription_site_id IS NOT NULL;
