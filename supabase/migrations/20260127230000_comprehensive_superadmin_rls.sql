-- 1. Ensure 'superadmin' exists in the enum
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'superadmin') THEN
    ALTER TYPE public.app_role ADD VALUE 'superadmin';
  END IF;
END $$;

-- 2. Expand RLS for Profiles (SuperAdmin can see all users)
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR public.has_role(auth.uid(), 'superadmin'));

-- 3. Expand RLS for Clients
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON public.clients;
CREATE POLICY "Superadmins can view all clients"
  ON public.clients FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR public.has_role(auth.uid(), 'superadmin'));

-- 4. Expand RLS for Products
DROP POLICY IF EXISTS "Users can view products in their tenant" ON public.products;
CREATE POLICY "Superadmins can view all products"
  ON public.products FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR public.has_role(auth.uid(), 'superadmin'));

-- 5. Expand RLS for Invoices
DROP POLICY IF EXISTS "Users can view invoices in their tenant" ON public.invoices;
CREATE POLICY "Superadmins can view all invoices"
  ON public.invoices FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR public.has_role(auth.uid(), 'superadmin'));

-- 6. Expand RLS for Transactions
DROP POLICY IF EXISTS "Users can view transactions in their tenant" ON public.transactions;
CREATE POLICY "Superadmins can view all transactions"
  ON public.transactions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR public.has_role(auth.uid(), 'superadmin'));

-- 7. Expand RLS for User Roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Superadmins can view all roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- 8. QUERY TO VERIFY YOUR ROLE (Run this to check if you are superadmin)
-- SELECT role FROM public.user_roles WHERE user_id = auth.uid();
