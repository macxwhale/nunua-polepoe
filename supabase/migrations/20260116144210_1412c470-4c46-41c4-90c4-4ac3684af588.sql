-- Fix RLS for super_admin_audit_logs - Super admins can view logs via function
-- Audit logs remain immutable (no INSERT/UPDATE/DELETE via direct access)

-- Create a security definer function to insert audit logs (only way to add)
CREATE OR REPLACE FUNCTION public.insert_super_admin_audit_log(
  _admin_id UUID,
  _admin_email TEXT,
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _tenant_id UUID DEFAULT NULL,
  _details JSONB DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.super_admin_audit_logs (
    admin_id, admin_email, action, resource_type, 
    resource_id, tenant_id, details, ip_address, user_agent
  ) VALUES (
    _admin_id, _admin_email, _action, _resource_type,
    _resource_id, _tenant_id, _details, _ip_address, _user_agent
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Create a security definer function to read audit logs (super admins only)
CREATE OR REPLACE FUNCTION public.get_super_admin_audit_logs(
  _limit INTEGER DEFAULT 100,
  _offset INTEGER DEFAULT 0,
  _tenant_id UUID DEFAULT NULL,
  _admin_id UUID DEFAULT NULL,
  _action TEXT DEFAULT NULL,
  _start_date TIMESTAMPTZ DEFAULT NULL,
  _end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  tenant_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id, l.admin_id, l.admin_email, l.action, l.resource_type,
    l.resource_id, l.tenant_id, l.details, l.ip_address, l.user_agent, l.created_at
  FROM public.super_admin_audit_logs l
  WHERE 
    (_tenant_id IS NULL OR l.tenant_id = _tenant_id)
    AND (_admin_id IS NULL OR l.admin_id = _admin_id)
    AND (_action IS NULL OR l.action = _action)
    AND (_start_date IS NULL OR l.created_at >= _start_date)
    AND (_end_date IS NULL OR l.created_at <= _end_date)
  ORDER BY l.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Create function to get all tenants with details (super admin only)
CREATE OR REPLACE FUNCTION public.get_all_tenants_for_admin(
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0,
  _status tenant_status DEFAULT NULL,
  _plan subscription_plan DEFAULT NULL,
  _search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  phone_number TEXT,
  status tenant_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  subscription_plan subscription_plan,
  subscription_status TEXT,
  max_users INTEGER,
  max_clients INTEGER,
  users_count BIGINT,
  clients_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.business_name,
    t.phone_number,
    t.status,
    t.created_at,
    t.updated_at,
    t.last_activity_at,
    t.deleted_at,
    COALESCE(ts.plan, 'free'::subscription_plan) as subscription_plan,
    COALESCE(ts.status, 'active') as subscription_status,
    COALESCE(ts.max_users, 5) as max_users,
    COALESCE(ts.max_clients, 50) as max_clients,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.tenant_id = t.id) as users_count,
    (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id) as clients_count
  FROM public.tenants t
  LEFT JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
  WHERE 
    t.deleted_at IS NULL
    AND (_status IS NULL OR t.status = _status)
    AND (_plan IS NULL OR ts.plan = _plan)
    AND (_search IS NULL OR t.business_name ILIKE '%' || _search || '%' OR t.phone_number ILIKE '%' || _search || '%')
  ORDER BY t.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Create function to get tenant details (super admin only)
CREATE OR REPLACE FUNCTION public.get_tenant_details_for_admin(_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  phone_number TEXT,
  status tenant_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  subscription_plan subscription_plan,
  subscription_status TEXT,
  max_users INTEGER,
  max_clients INTEGER,
  max_invoices_per_month INTEGER,
  max_products INTEGER,
  features JSONB,
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  users_count BIGINT,
  clients_count BIGINT,
  invoices_count BIGINT,
  transactions_count BIGINT,
  total_invoice_amount NUMERIC,
  total_payment_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.business_name,
    t.phone_number,
    t.status,
    t.created_at,
    t.updated_at,
    t.last_activity_at,
    COALESCE(ts.plan, 'free'::subscription_plan),
    COALESCE(ts.status, 'active'),
    COALESCE(ts.max_users, 5),
    COALESCE(ts.max_clients, 50),
    COALESCE(ts.max_invoices_per_month, 100),
    COALESCE(ts.max_products, 20),
    COALESCE(ts.features, '{}'::JSONB),
    ts.started_at,
    ts.expires_at,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.invoices i WHERE i.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.transactions tr WHERE tr.tenant_id = t.id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.invoices i WHERE i.tenant_id = t.id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions tr WHERE tr.tenant_id = t.id AND tr.type = 'payment')
  FROM public.tenants t
  LEFT JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
  WHERE t.id = _tenant_id;
END;
$$;

-- Create function to update tenant status (super admin only)
CREATE OR REPLACE FUNCTION public.update_tenant_status_admin(
  _tenant_id UUID,
  _new_status tenant_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin (not support admin for status changes)
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Requires super admin role';
  END IF;
  
  UPDATE public.tenants
  SET status = _new_status, updated_at = now()
  WHERE id = _tenant_id;
  
  RETURN FOUND;
END;
$$;

-- Create function to update tenant subscription (super admin only)
CREATE OR REPLACE FUNCTION public.update_tenant_subscription_admin(
  _tenant_id UUID,
  _plan subscription_plan,
  _max_users INTEGER DEFAULT NULL,
  _max_clients INTEGER DEFAULT NULL,
  _max_invoices INTEGER DEFAULT NULL,
  _max_products INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _defaults RECORD;
BEGIN
  -- Verify caller is a super admin
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Requires super admin role';
  END IF;
  
  -- Set defaults based on plan
  SELECT INTO _defaults
    CASE _plan
      WHEN 'free' THEN 5
      WHEN 'pro' THEN 25
      WHEN 'enterprise' THEN 999999
    END as max_users,
    CASE _plan
      WHEN 'free' THEN 50
      WHEN 'pro' THEN 500
      WHEN 'enterprise' THEN 999999
    END as max_clients,
    CASE _plan
      WHEN 'free' THEN 100
      WHEN 'pro' THEN 1000
      WHEN 'enterprise' THEN 999999
    END as max_invoices,
    CASE _plan
      WHEN 'free' THEN 20
      WHEN 'pro' THEN 200
      WHEN 'enterprise' THEN 999999
    END as max_products;
  
  -- Upsert subscription
  INSERT INTO public.tenant_subscriptions (
    tenant_id, plan, max_users, max_clients, max_invoices_per_month, max_products
  ) VALUES (
    _tenant_id,
    _plan,
    COALESCE(_max_users, _defaults.max_users),
    COALESCE(_max_clients, _defaults.max_clients),
    COALESCE(_max_invoices, _defaults.max_invoices),
    COALESCE(_max_products, _defaults.max_products)
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    max_users = EXCLUDED.max_users,
    max_clients = EXCLUDED.max_clients,
    max_invoices_per_month = EXCLUDED.max_invoices_per_month,
    max_products = EXCLUDED.max_products,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Create function to soft delete tenant (super admin only)
CREATE OR REPLACE FUNCTION public.soft_delete_tenant_admin(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Requires super admin role';
  END IF;
  
  UPDATE public.tenants
  SET 
    status = 'archived',
    deleted_at = now(),
    updated_at = now()
  WHERE id = _tenant_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Create function to get tenant feature flags (super admin only)
CREATE OR REPLACE FUNCTION public.get_tenant_feature_flags_admin(_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  flag_name TEXT,
  is_enabled BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;
  
  RETURN QUERY
  SELECT f.id, f.flag_name, f.is_enabled, f.metadata, f.created_at, f.updated_at
  FROM public.tenant_feature_flags f
  WHERE f.tenant_id = _tenant_id
  ORDER BY f.flag_name;
END;
$$;

-- Create function to toggle feature flag (super admin only)
CREATE OR REPLACE FUNCTION public.toggle_tenant_feature_flag_admin(
  _tenant_id UUID,
  _flag_name TEXT,
  _is_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Requires super admin role';
  END IF;
  
  INSERT INTO public.tenant_feature_flags (tenant_id, flag_name, is_enabled)
  VALUES (_tenant_id, _flag_name, _is_enabled)
  ON CONFLICT (tenant_id, flag_name) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Get platform stats for dashboard (super admin only)
CREATE OR REPLACE FUNCTION public.get_platform_stats_admin()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  suspended_tenants BIGINT,
  free_plan_tenants BIGINT,
  pro_plan_tenants BIGINT,
  enterprise_plan_tenants BIGINT,
  total_users BIGINT,
  total_clients BIGINT,
  total_invoices BIGINT,
  total_transactions BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Not a super admin';
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.tenants WHERE status = 'active' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.tenants WHERE status = 'suspended' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.tenant_subscriptions WHERE plan = 'free'),
    (SELECT COUNT(*) FROM public.tenant_subscriptions WHERE plan = 'pro'),
    (SELECT COUNT(*) FROM public.tenant_subscriptions WHERE plan = 'enterprise'),
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.clients),
    (SELECT COUNT(*) FROM public.invoices),
    (SELECT COUNT(*) FROM public.transactions);
END;
$$;