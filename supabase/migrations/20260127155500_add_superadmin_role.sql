-- Add superadmin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Update RLS policies for tenants to allow superadmins to see everything
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant or superadmin sees all"
  ON public.tenants FOR SELECT
  USING (
    id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Update RLS policies for profiles to allow superadmins to see everything
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in their tenant or superadmin sees all"
  ON public.profiles FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Allow superadmins to view all user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles or superadmin sees all"
  ON public.user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'superadmin')
  );
