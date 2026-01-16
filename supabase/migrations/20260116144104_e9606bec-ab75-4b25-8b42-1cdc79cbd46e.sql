-- ===========================================
-- SUPER ADMIN BACKEND SCHEMA
-- ===========================================

-- 1. SUPER ADMIN ROLES ENUM
-- ===========================================
CREATE TYPE public.super_admin_role AS ENUM ('super_admin', 'support_admin');

-- 2. SUBSCRIPTION PLAN ENUM
-- ===========================================
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- 3. TENANT STATUS ENUM
-- ===========================================
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'pending', 'archived');

-- 4. SUPER ADMINS TABLE (Platform-level admins, separate from tenants)
-- ===========================================
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role super_admin_role NOT NULL DEFAULT 'support_admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can only view their own record
CREATE POLICY "Super admins can view own record"
  ON public.super_admins FOR SELECT
  USING (user_id = auth.uid());

-- 5. TENANT SUBSCRIPTIONS TABLE
-- ===========================================
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_clients INTEGER NOT NULL DEFAULT 50,
  max_invoices_per_month INTEGER NOT NULL DEFAULT 100,
  max_products INTEGER NOT NULL DEFAULT 20,
  features JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own subscription
CREATE POLICY "Tenants can view own subscription"
  ON public.tenant_subscriptions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- 6. TENANT USAGE METRICS TABLE
-- ===========================================
CREATE TABLE public.tenant_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  users_count INTEGER NOT NULL DEFAULT 0,
  clients_count INTEGER NOT NULL DEFAULT 0,
  invoices_count INTEGER NOT NULL DEFAULT 0,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  total_invoice_amount NUMERIC NOT NULL DEFAULT 0,
  total_payment_amount NUMERIC NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own usage
CREATE POLICY "Tenants can view own usage"
  ON public.tenant_usage_metrics FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- 7. SUPER ADMIN AUDIT LOGS TABLE (Immutable)
-- ===========================================
CREATE TABLE public.super_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  tenant_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS - No direct access, only via edge functions
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- No policies = no direct access (immutable, accessed via functions only)

-- 8. FEATURE FLAGS TABLE
-- ===========================================
CREATE TABLE public.tenant_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, flag_name)
);

-- Enable RLS
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own feature flags
CREATE POLICY "Tenants can view own feature flags"
  ON public.tenant_feature_flags FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- 9. ADD STATUS COLUMN TO TENANTS TABLE
-- ===========================================
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS status tenant_status NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- 10. HELPER FUNCTION: Check if user is super admin
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = _user_id AND is_active = true
  );
$$;

-- 11. HELPER FUNCTION: Get super admin role
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_super_admin_role(_user_id UUID)
RETURNS super_admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.super_admins
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- 12. UPDATE TIMESTAMPS TRIGGERS
-- ===========================================
CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_usage_metrics_updated_at
  BEFORE UPDATE ON public.tenant_usage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_feature_flags_updated_at
  BEFORE UPDATE ON public.tenant_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX idx_super_admins_user_id ON public.super_admins(user_id);
CREATE INDEX idx_super_admins_email ON public.super_admins(email);
CREATE INDEX idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_plan ON public.tenant_subscriptions(plan);
CREATE INDEX idx_tenant_usage_metrics_tenant_id ON public.tenant_usage_metrics(tenant_id);
CREATE INDEX idx_tenant_usage_metrics_period ON public.tenant_usage_metrics(period_start, period_end);
CREATE INDEX idx_super_admin_audit_logs_admin_id ON public.super_admin_audit_logs(admin_id);
CREATE INDEX idx_super_admin_audit_logs_tenant_id ON public.super_admin_audit_logs(tenant_id);
CREATE INDEX idx_super_admin_audit_logs_action ON public.super_admin_audit_logs(action);
CREATE INDEX idx_super_admin_audit_logs_created_at ON public.super_admin_audit_logs(created_at);
CREATE INDEX idx_tenant_feature_flags_tenant_id ON public.tenant_feature_flags(tenant_id);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_deleted_at ON public.tenants(deleted_at);
CREATE INDEX idx_tenants_last_activity_at ON public.tenants(last_activity_at);