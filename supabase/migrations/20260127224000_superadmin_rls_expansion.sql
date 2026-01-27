-- Add SuperAdmin visibility for clients
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON public.clients;
CREATE POLICY "Users can view clients in their tenant or superadmin sees all"
  ON public.clients FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Add SuperAdmin visibility for products
DROP POLICY IF EXISTS "Users can view products in their tenant" ON public.products;
CREATE POLICY "Users can view products in their tenant or superadmin sees all"
  ON public.products FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Add SuperAdmin visibility for invoices (already handled in previous migration, but ensuring consistency)
DROP POLICY IF EXISTS "Superadmins can view all invoices" ON public.invoices;
CREATE POLICY "Superadmins can view all invoices"
  ON public.invoices FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Add SuperAdmin visibility for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles or superadmin sees all"
  ON public.user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'superadmin')
  );
