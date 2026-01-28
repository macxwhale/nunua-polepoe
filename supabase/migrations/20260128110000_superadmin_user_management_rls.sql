-- Allow superadmins to manage user roles
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Ensure superadmins can view all profiles (refining existing policy)
DROP POLICY IF EXISTS "Users can view profiles in their tenant or superadmin sees all" ON public.profiles;
CREATE POLICY "Users can view profiles in their tenant or superadmin sees all"
  ON public.profiles FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id() OR 
    public.has_role(auth.uid(), 'superadmin')
  );
