-- ============================================================
-- Lipia Pole Pole - Complete Database Recreation Script
-- Generated: 2026-03-26
-- ============================================================
-- WARNING: This script will DROP all existing tables and recreate them.
-- All data will be lost. Use with extreme caution.
-- ============================================================

-- ============================================================
-- 1. DROP EXISTING OBJECTS (reverse dependency order)
-- ============================================================
DROP VIEW IF EXISTS public.client_details CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payment_details CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.super_admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;
DROP TABLE IF EXISTS public.tenant_feature_flags CASCADE;
DROP TABLE IF EXISTS public.tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS public.tenant_usage_metrics CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- ============================================================
-- 2. CREATE ENUM TYPES (if not exist)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'client', 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('monthly', 'semi-annual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.super_admin_role AS ENUM ('super_admin', 'support_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'pending', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. CREATE TABLES
-- ============================================================

-- 3.1 tenants (root table, no FK dependencies)
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  business_name text NOT NULL,
  phone_number text NOT NULL UNIQUE,
  status public.tenant_status NOT NULL DEFAULT 'active'::tenant_status,
  is_active boolean DEFAULT true,
  subscription_tier public.subscription_tier DEFAULT 'monthly'::subscription_tier,
  last_activity_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT phone_number_format CHECK (phone_number ~ '^[0-9]{10}$'),
  CONSTRAINT phone_number_length CHECK (length(phone_number) = 10)
);

-- 3.2 profiles (depends on tenants, auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT phone_number_format CHECK (phone_number ~ '^[0-9]{10}$'),
  CONSTRAINT phone_number_length CHECK (length(phone_number) = 10)
);

-- 3.3 clients (depends on tenants)
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text,
  phone_number text NOT NULL,
  email text,
  total_balance numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'active'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_phone_tenant_unique UNIQUE (phone_number, tenant_id),
  CONSTRAINT phone_number_format CHECK ((phone_number IS NULL) OR (phone_number ~ '^[0-9]{10}$')),
  CONSTRAINT phone_number_length CHECK ((phone_number IS NULL) OR (length(phone_number) = 10))
);

-- 3.4 products (depends on tenants)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.5 invoices (depends on tenants, clients, products)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_tenant_id_invoice_number_key UNIQUE (tenant_id, invoice_number),
  CONSTRAINT invoices_status_check CHECK (status = ANY (ARRAY['pending','paid','overdue','partial']))
);

-- 3.6 transactions (depends on tenants, clients, invoices)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  notes text,
  date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY['sale','payment']))
);

-- 3.7 notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY['invoice','payment','client','product','system']))
);

-- 3.8 payment_details
CREATE TABLE public.payment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_type text NOT NULL,
  name text NOT NULL,
  paybill text,
  account_no text,
  till text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.9 user_roles (depends on auth.users, profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role),
  CONSTRAINT user_roles_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- 3.10 super_admins
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role public.super_admin_role NOT NULL DEFAULT 'support_admin'::super_admin_role,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.11 super_admin_audit_logs
CREATE TABLE public.super_admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  tenant_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.12 tenant_subscriptions (depends on tenants)
CREATE TABLE public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free'::subscription_plan,
  max_users integer NOT NULL DEFAULT 5,
  max_clients integer NOT NULL DEFAULT 50,
  max_invoices_per_month integer NOT NULL DEFAULT 100,
  max_products integer NOT NULL DEFAULT 20,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.13 tenant_feature_flags (depends on tenants)
CREATE TABLE public.tenant_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  flag_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_feature_flags_tenant_id_flag_name_key UNIQUE (tenant_id, flag_name)
);

-- 3.14 tenant_usage_metrics (depends on tenants)
CREATE TABLE public.tenant_usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  users_count integer NOT NULL DEFAULT 0,
  clients_count integer NOT NULL DEFAULT 0,
  invoices_count integer NOT NULL DEFAULT 0,
  transactions_count integer NOT NULL DEFAULT 0,
  total_invoice_amount numeric NOT NULL DEFAULT 0,
  total_payment_amount numeric NOT NULL DEFAULT 0,
  api_calls integer NOT NULL DEFAULT 0,
  storage_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_usage_metrics_tenant_id_period_start_period_end_key UNIQUE (tenant_id, period_start, period_end)
);

-- ============================================================
-- 4. CREATE VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.client_details AS
SELECT
  c.id,
  c.tenant_id,
  c.name,
  c.phone_number,
  c.email,
  c.total_balance,
  c.status,
  c.created_at,
  c.updated_at,
  COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) AS total_invoiced,
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS total_paid
FROM public.clients c
LEFT JOIN public.invoices i ON i.client_id = c.id
LEFT JOIN public.transactions t ON t.client_id = c.id
GROUP BY c.id;

-- ============================================================
-- 5. CREATE INDEXES
-- ============================================================
CREATE INDEX idx_tenants_status ON public.tenants USING btree (status);
CREATE INDEX idx_tenants_deleted_at ON public.tenants USING btree (deleted_at);
CREATE INDEX idx_tenants_last_activity_at ON public.tenants USING btree (last_activity_at);

CREATE INDEX idx_profiles_tenant_id ON public.profiles USING btree (tenant_id);
CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);

CREATE INDEX idx_clients_tenant_id ON public.clients USING btree (tenant_id);
CREATE INDEX idx_clients_status ON public.clients USING btree (status);

CREATE INDEX idx_products_tenant_id ON public.products USING btree (tenant_id);

CREATE INDEX idx_invoices_tenant_id ON public.invoices USING btree (tenant_id);
CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);
CREATE INDEX idx_invoices_product_id ON public.invoices USING btree (product_id);
CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);

CREATE INDEX idx_transactions_tenant_id ON public.transactions USING btree (tenant_id);
CREATE INDEX idx_transactions_client_id ON public.transactions USING btree (client_id);
CREATE INDEX idx_transactions_invoice_id ON public.transactions USING btree (invoice_id);
CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);

CREATE INDEX idx_notifications_user_tenant ON public.notifications USING btree (user_id, tenant_id, created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications USING btree (read, created_at DESC);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX idx_super_admins_user_id ON public.super_admins USING btree (user_id);
CREATE INDEX idx_super_admins_email ON public.super_admins USING btree (email);

CREATE INDEX idx_super_admin_audit_logs_admin_id ON public.super_admin_audit_logs USING btree (admin_id);
CREATE INDEX idx_super_admin_audit_logs_tenant_id ON public.super_admin_audit_logs USING btree (tenant_id);
CREATE INDEX idx_super_admin_audit_logs_action ON public.super_admin_audit_logs USING btree (action);
CREATE INDEX idx_super_admin_audit_logs_created_at ON public.super_admin_audit_logs USING btree (created_at);

CREATE INDEX idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions USING btree (tenant_id);
CREATE INDEX idx_tenant_subscriptions_plan ON public.tenant_subscriptions USING btree (plan);

CREATE INDEX idx_tenant_feature_flags_tenant_id ON public.tenant_feature_flags USING btree (tenant_id);

CREATE INDEX idx_tenant_usage_metrics_tenant_id ON public.tenant_usage_metrics USING btree (tenant_id);
CREATE INDEX idx_tenant_usage_metrics_period ON public.tenant_usage_metrics USING btree (period_start, period_end);

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. DATABASE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin'::public.app_role
  ) THEN RETURN TRUE; END IF;
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND phone_number IN ('07XXXXXXXX')
  ) THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_super_admin_role(_user_id uuid)
RETURNS super_admin_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role FROM public.super_admins WHERE user_id = _user_id AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_client_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_total_invoiced NUMERIC;
  v_total_paid NUMERIC;
  v_balance NUMERIC;
  v_new_status TEXT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_invoiced FROM invoices WHERE client_id = NEW.client_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM transactions WHERE client_id = NEW.client_id AND type = 'payment';
  v_balance := v_total_invoiced - v_total_paid;
  IF v_balance = 0 THEN v_new_status := 'closed'; ELSE v_new_status := 'open'; END IF;
  UPDATE clients SET status = v_new_status WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_invoice_status_on_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_invoice_amount NUMERIC;
  v_total_paid NUMERIC;
  v_new_status TEXT;
  v_invoice_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN v_invoice_id := OLD.invoice_id; ELSE v_invoice_id := NEW.invoice_id; END IF;
  IF v_invoice_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  SELECT amount INTO v_invoice_amount FROM invoices WHERE id = v_invoice_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM transactions WHERE invoice_id = v_invoice_id AND type = 'payment';
  IF v_total_paid >= v_invoice_amount THEN v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN v_new_status := 'partial';
  ELSE v_new_status := 'pending'; END IF;
  UPDATE invoices SET status = v_new_status, updated_at = now() WHERE id = v_invoice_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_client_name TEXT;
  v_invoice_number TEXT;
  v_user_id UUID;
BEGIN
  IF NEW.type != 'payment' THEN RETURN NEW; END IF;
  SELECT COALESCE(name, phone_number) INTO v_client_name FROM clients WHERE id = NEW.client_id;
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT invoice_number INTO v_invoice_number FROM invoices WHERE id = NEW.invoice_id;
  END IF;
  SELECT user_id INTO v_user_id FROM profiles WHERE tenant_id = NEW.tenant_id LIMIT 1;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO notifications (tenant_id, user_id, title, message, type, link)
  VALUES (NEW.tenant_id, v_user_id, 'Payment Received',
    format('Payment of KSH %s received from %s%s',
      to_char(NEW.amount, 'FM999,999,999'), v_client_name,
      CASE WHEN v_invoice_number IS NOT NULL THEN format(' for Invoice %s', v_invoice_number) ELSE '' END),
    'payment', '/clients');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_client_name TEXT;
  v_user_id UUID;
BEGIN
  SELECT COALESCE(name, phone_number) INTO v_client_name FROM clients WHERE id = NEW.client_id;
  SELECT user_id INTO v_user_id FROM profiles WHERE tenant_id = NEW.tenant_id LIMIT 1;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO notifications (tenant_id, user_id, title, message, type, link)
  VALUES (NEW.tenant_id, v_user_id, 'Invoice Created',
    format('Invoice %s for KSH %s created for %s',
      NEW.invoice_number, to_char(NEW.amount, 'FM999,999,999'), v_client_name),
    'invoice', '/invoices');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_super_admin_audit_log(
  _admin_id uuid, _admin_email text, _action text, _resource_type text,
  _resource_id uuid DEFAULT NULL, _tenant_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL, _ip_address text DEFAULT NULL, _user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _log_id UUID;
BEGIN
  INSERT INTO public.super_admin_audit_logs (admin_id, admin_email, action, resource_type, resource_id, tenant_id, details, ip_address, user_agent)
  VALUES (_admin_id, _admin_email, _action, _resource_type, _resource_id, _tenant_id, _details, _ip_address, _user_agent)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_stats_admin()
RETURNS TABLE(total_tenants bigint, active_tenants bigint, suspended_tenants bigint, free_plan_tenants bigint, pro_plan_tenants bigint, enterprise_plan_tenants bigint, total_users bigint, total_clients bigint, total_invoices bigint, total_transactions bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Not a super admin'; END IF;
  RETURN QUERY SELECT
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

CREATE OR REPLACE FUNCTION public.get_all_tenants_for_admin(
  _limit integer DEFAULT 50, _offset integer DEFAULT 0,
  _status tenant_status DEFAULT NULL, _plan subscription_plan DEFAULT NULL, _search text DEFAULT NULL
) RETURNS TABLE(id uuid, business_name text, phone_number text, status tenant_status, created_at timestamptz, updated_at timestamptz, last_activity_at timestamptz, deleted_at timestamptz, subscription_plan subscription_plan, subscription_status text, max_users integer, max_clients integer, users_count bigint, clients_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Not a super admin'; END IF;
  RETURN QUERY SELECT t.id, t.business_name, t.phone_number, t.status, t.created_at, t.updated_at, t.last_activity_at, t.deleted_at,
    COALESCE(ts.plan, 'free'::subscription_plan), COALESCE(ts.status, 'active'), COALESCE(ts.max_users, 5), COALESCE(ts.max_clients, 50),
    (SELECT COUNT(*) FROM public.profiles p WHERE p.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id)
  FROM public.tenants t LEFT JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
  WHERE t.deleted_at IS NULL
    AND (_status IS NULL OR t.status = _status)
    AND (_plan IS NULL OR ts.plan = _plan)
    AND (_search IS NULL OR t.business_name ILIKE '%' || _search || '%' OR t.phone_number ILIKE '%' || _search || '%')
  ORDER BY t.created_at DESC LIMIT _limit OFFSET _offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_details_for_admin(_tenant_id uuid)
RETURNS TABLE(id uuid, business_name text, phone_number text, status tenant_status, created_at timestamptz, updated_at timestamptz, last_activity_at timestamptz, subscription_plan subscription_plan, subscription_status text, max_users integer, max_clients integer, max_invoices_per_month integer, max_products integer, features jsonb, subscription_started_at timestamptz, subscription_expires_at timestamptz, users_count bigint, clients_count bigint, invoices_count bigint, transactions_count bigint, total_invoice_amount numeric, total_payment_amount numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Not a super admin'; END IF;
  RETURN QUERY SELECT t.id, t.business_name, t.phone_number, t.status, t.created_at, t.updated_at, t.last_activity_at,
    COALESCE(ts.plan, 'free'::subscription_plan), COALESCE(ts.status, 'active'), COALESCE(ts.max_users, 5), COALESCE(ts.max_clients, 50),
    COALESCE(ts.max_invoices_per_month, 100), COALESCE(ts.max_products, 20), COALESCE(ts.features, '{}'::JSONB), ts.started_at, ts.expires_at,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.invoices i WHERE i.tenant_id = t.id),
    (SELECT COUNT(*) FROM public.transactions tr WHERE tr.tenant_id = t.id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.invoices i WHERE i.tenant_id = t.id),
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions tr WHERE tr.tenant_id = t.id AND tr.type = 'payment')
  FROM public.tenants t LEFT JOIN public.tenant_subscriptions ts ON ts.tenant_id = t.id
  WHERE t.id = _tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tenant_status_admin(_tenant_id uuid, _new_status tenant_status)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN RAISE EXCEPTION 'Access denied: Requires super admin role'; END IF;
  UPDATE public.tenants SET status = _new_status, updated_at = now() WHERE id = _tenant_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tenant_subscription_admin(
  _tenant_id uuid, _plan subscription_plan,
  _max_users integer DEFAULT NULL, _max_clients integer DEFAULT NULL,
  _max_invoices integer DEFAULT NULL, _max_products integer DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _defaults RECORD;
BEGIN
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN RAISE EXCEPTION 'Access denied: Requires super admin role'; END IF;
  SELECT INTO _defaults
    CASE _plan WHEN 'free' THEN 5 WHEN 'pro' THEN 25 WHEN 'enterprise' THEN 999999 END as max_users,
    CASE _plan WHEN 'free' THEN 50 WHEN 'pro' THEN 500 WHEN 'enterprise' THEN 999999 END as max_clients,
    CASE _plan WHEN 'free' THEN 100 WHEN 'pro' THEN 1000 WHEN 'enterprise' THEN 999999 END as max_invoices,
    CASE _plan WHEN 'free' THEN 20 WHEN 'pro' THEN 200 WHEN 'enterprise' THEN 999999 END as max_products;
  INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_clients, max_invoices_per_month, max_products)
  VALUES (_tenant_id, _plan, COALESCE(_max_users, _defaults.max_users), COALESCE(_max_clients, _defaults.max_clients),
    COALESCE(_max_invoices, _defaults.max_invoices), COALESCE(_max_products, _defaults.max_products))
  ON CONFLICT (tenant_id) DO UPDATE SET plan = EXCLUDED.plan, max_users = EXCLUDED.max_users,
    max_clients = EXCLUDED.max_clients, max_invoices_per_month = EXCLUDED.max_invoices_per_month,
    max_products = EXCLUDED.max_products, updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_tenant_admin(_tenant_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN RAISE EXCEPTION 'Access denied: Requires super admin role'; END IF;
  UPDATE public.tenants SET status = 'archived', deleted_at = now(), updated_at = now() WHERE id = _tenant_id AND deleted_at IS NULL;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_tenant_feature_flag_admin(_tenant_id uuid, _flag_name text, _is_enabled boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF get_super_admin_role(auth.uid()) != 'super_admin' THEN RAISE EXCEPTION 'Access denied: Requires super admin role'; END IF;
  INSERT INTO public.tenant_feature_flags (tenant_id, flag_name, is_enabled)
  VALUES (_tenant_id, _flag_name, _is_enabled)
  ON CONFLICT (tenant_id, flag_name) DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_feature_flags_admin(_tenant_id uuid)
RETURNS TABLE(id uuid, flag_name text, is_enabled boolean, metadata jsonb, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Not a super admin'; END IF;
  RETURN QUERY SELECT f.id, f.flag_name, f.is_enabled, f.metadata, f.created_at, f.updated_at
  FROM public.tenant_feature_flags f WHERE f.tenant_id = _tenant_id ORDER BY f.flag_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_super_admin_audit_logs(
  _limit integer DEFAULT 100, _offset integer DEFAULT 0,
  _tenant_id uuid DEFAULT NULL, _admin_id uuid DEFAULT NULL,
  _action text DEFAULT NULL, _start_date timestamptz DEFAULT NULL, _end_date timestamptz DEFAULT NULL
) RETURNS TABLE(id uuid, admin_id uuid, admin_email text, action text, resource_type text, resource_id uuid, tenant_id uuid, details jsonb, ip_address text, user_agent text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied: Not a super admin'; END IF;
  RETURN QUERY SELECT l.id, l.admin_id, l.admin_email, l.action, l.resource_type, l.resource_id, l.tenant_id, l.details, l.ip_address, l.user_agent, l.created_at
  FROM public.super_admin_audit_logs l
  WHERE (_tenant_id IS NULL OR l.tenant_id = _tenant_id)
    AND (_admin_id IS NULL OR l.admin_id = _admin_id)
    AND (_action IS NULL OR l.action = _action)
    AND (_start_date IS NULL OR l.created_at >= _start_date)
    AND (_end_date IS NULL OR l.created_at <= _end_date)
  ORDER BY l.created_at DESC LIMIT _limit OFFSET _offset;
END;
$$;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- tenants
CREATE POLICY "Users can view their own tenant" ON public.tenants FOR SELECT USING (id = get_user_tenant_id());
CREATE POLICY "Users can view their own tenant or superadmin sees all" ON public.tenants FOR SELECT USING ((id = get_user_tenant_id()) OR is_super_admin(auth.uid()));
CREATE POLICY "Users can update their own tenant" ON public.tenants FOR UPDATE USING (id = get_user_tenant_id());

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view profiles in their tenant" ON public.profiles FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can view profiles in their tenant or superadmin sees all" ON public.profiles FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- clients
CREATE POLICY "Clients can view their own record" ON public.clients FOR SELECT USING (
  (phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text))
  AND ((tenant_id)::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text))
);
CREATE POLICY "Superadmins can view all clients" ON public.clients FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can view clients in their tenant or superadmin sees all" ON public.clients FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR is_super_admin(auth.uid()));
CREATE POLICY "Users can insert clients in their tenant" ON public.clients FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update clients in their tenant" ON public.clients FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can delete clients in their tenant" ON public.clients FOR DELETE USING (tenant_id = get_user_tenant_id());

-- products
CREATE POLICY "Superadmins can view all products" ON public.products FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can insert products in their tenant" ON public.products FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update products in their tenant" ON public.products FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can delete products in their tenant" ON public.products FOR DELETE USING (tenant_id = get_user_tenant_id());

-- invoices
CREATE POLICY "Clients can view their own invoices" ON public.invoices FOR SELECT USING (
  client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text)
    AND (clients.tenant_id)::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text)
  )
);
CREATE POLICY "Users can view invoices in their tenant or superadmin sees all" ON public.invoices FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR is_super_admin(auth.uid()));
CREATE POLICY "Users can insert invoices in their tenant" ON public.invoices FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update invoices in their tenant" ON public.invoices FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can delete invoices in their tenant" ON public.invoices FOR DELETE USING (tenant_id = get_user_tenant_id());

-- transactions
CREATE POLICY "Users can view transactions in their tenant" ON public.transactions FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert transactions in their tenant" ON public.transactions FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update transactions in their tenant" ON public.transactions FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can delete transactions in their tenant" ON public.transactions FOR DELETE USING (tenant_id = get_user_tenant_id());

-- notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((tenant_id = get_user_tenant_id()) AND (user_id = auth.uid()));
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = auth.uid()));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((tenant_id = get_user_tenant_id()) AND (user_id = auth.uid()));
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((tenant_id = get_user_tenant_id()) AND (user_id = auth.uid()));

-- payment_details
CREATE POLICY "Users can view payment details in their tenant" ON public.payment_details FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Clients can view active payment details" ON public.payment_details FOR SELECT USING (
  (is_active = true) AND (tenant_id IN (
    SELECT clients.tenant_id FROM clients
    WHERE clients.phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text)
    AND (clients.tenant_id)::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text)
  ))
);
CREATE POLICY "Users can insert payment details in their tenant" ON public.payment_details FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update payment details in their tenant" ON public.payment_details FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can delete payment details in their tenant" ON public.payment_details FOR DELETE USING (tenant_id = get_user_tenant_id());

-- user_roles
CREATE POLICY "Superadmins can view all roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- super_admins
CREATE POLICY "Super admins can view own record" ON public.super_admins FOR SELECT USING (user_id = auth.uid());

-- tenant_subscriptions
CREATE POLICY "Tenants can view own subscription" ON public.tenant_subscriptions FOR SELECT USING (tenant_id = get_user_tenant_id());

-- tenant_feature_flags
CREATE POLICY "Tenants can view own feature flags" ON public.tenant_feature_flags FOR SELECT USING (tenant_id = get_user_tenant_id());

-- tenant_usage_metrics
CREATE POLICY "Tenants can view own usage" ON public.tenant_usage_metrics FOR SELECT USING (tenant_id = get_user_tenant_id());

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_details_updated_at BEFORE UPDATE ON public.payment_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON public.super_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON public.tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_feature_flags_updated_at BEFORE UPDATE ON public.tenant_feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_usage_metrics_updated_at BEFORE UPDATE ON public.tenant_usage_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER trigger_update_client_status_on_invoice AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_client_status();
CREATE TRIGGER trigger_update_client_status_on_transaction AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_client_status();
CREATE TRIGGER trigger_update_invoice_status AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_payment();
CREATE TRIGGER trigger_invoice_notification AFTER INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION create_invoice_notification();
CREATE TRIGGER trigger_payment_notification AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION create_payment_notification();

-- ============================================================
-- 10. REALTIME (if needed)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
