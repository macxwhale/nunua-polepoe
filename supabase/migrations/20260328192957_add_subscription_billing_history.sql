-- Migration: add_subscription_billing_history

CREATE TABLE IF NOT EXISTS public.subscription_billing_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'charge.success', 'invoice.payment_failed', etc.
  paystack_reference text,
  amount numeric NOT NULL, -- Stored as decimal currency (e.g. 1700.00 KES)
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL, -- 'success', 'failed'
  plan_code text,
  paystack_subscription_code text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_billing_history ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own billing history
CREATE POLICY "Tenants can view own billing history" 
  ON public.subscription_billing_history 
  FOR SELECT 
  USING (tenant_id = public.get_user_tenant_id());

-- Create an index to quickly load history by tenant
CREATE INDEX IF NOT EXISTS idx_subscription_billing_history_tenant_id 
  ON public.subscription_billing_history USING btree (tenant_id);

-- Create an index to lookup by reference, useful for webhook deduplication if ever needed
CREATE INDEX IF NOT EXISTS idx_subscription_billing_history_reference 
  ON public.subscription_billing_history USING btree (paystack_reference);
