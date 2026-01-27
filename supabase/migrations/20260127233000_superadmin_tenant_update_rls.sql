-- Allow superadmins to update tenants (activation state, tiers, etc.)
DROP POLICY IF EXISTS "Superadmins can update all tenants" ON public.tenants;
CREATE POLICY "Superadmins can update all tenants"
  ON public.tenants FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Re-verify SELECT for sanity
DROP POLICY IF EXISTS "Users can view their own tenant or superadmin sees all" ON public.tenants;
CREATE POLICY "Users can view their own tenant or superadmin sees all"
  ON public.tenants FOR SELECT
  USING (
    id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );
