-- ============================================================
-- Subscription & Trial Migration
-- Run this in the Supabase SQL Editor AFTER recreate_database.sql
-- ============================================================

-- 1. Add trial_ends_at to tenants (7 days from account creation)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '7 days');

-- Backfill existing tenants (set trial to 7 days from created_at)
UPDATE public.tenants
  SET trial_ends_at = created_at + interval '7 days'
  WHERE trial_ends_at IS NULL;

-- 2. Add Paystack-specific columns to tenant_subscriptions
ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS paystack_customer_code text,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code text,
  ADD COLUMN IF NOT EXISTS next_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Update status check to include 'pending' and 'past_due'
-- (Supabase doesn't support direct constraint modification; drop and recreate)
-- If you have an existing constraint, drop it first:
-- ALTER TABLE public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_status_check;

-- 3. Auto-set trial on new tenant INSERT
CREATE OR REPLACE FUNCTION public.set_tenant_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.trial_ends_at := NEW.created_at + interval '7 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_tenant_trial ON public.tenants;
CREATE TRIGGER trigger_set_tenant_trial
  BEFORE INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_trial();

-- 4. Helper function: get subscription status for a tenant
-- Returns: 'trial' | 'active' | 'expired' | 'cancelled'
CREATE OR REPLACE FUNCTION public.get_tenant_subscription_status(_tenant_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_trial_ends_at timestamptz;
  v_sub_status text;
  v_cancelled_at timestamptz;
BEGIN
  SELECT trial_ends_at INTO v_trial_ends_at
  FROM public.tenants WHERE id = _tenant_id;

  SELECT status, cancelled_at INTO v_sub_status, v_cancelled_at
  FROM public.tenant_subscriptions WHERE tenant_id = _tenant_id;

  -- Active subscription takes priority
  IF v_sub_status = 'active' AND v_cancelled_at IS NULL THEN
    RETURN 'active';
  END IF;

  -- Cancelled
  IF v_cancelled_at IS NOT NULL THEN
    RETURN 'cancelled';
  END IF;

  -- Still in trial
  IF v_trial_ends_at IS NOT NULL AND now() <= v_trial_ends_at THEN
    RETURN 'trial';
  END IF;

  -- No subscription, trial ended
  RETURN 'expired';
END;
$$;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
