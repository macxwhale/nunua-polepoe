-- Create subscription_tier enum
DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('monthly', 'semi-annual', 'annual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add subscription_tier and is_active to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_tier public.subscription_tier DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS policies for aggregated metrics if needed
-- Allow superadmins to see aggregate transaction data for dashboarding
DROP POLICY IF EXISTS "Superadmins can view all transactions" ON public.transactions;
CREATE POLICY "Superadmins can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

DROP POLICY IF EXISTS "Superadmins can view all invoices" ON public.invoices;
CREATE POLICY "Superadmins can view all invoices"
  ON public.invoices FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );
