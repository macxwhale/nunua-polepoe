import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'superadmin' | 'owner' | 'staff' | 'client' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [capabilities, setCapabilities] = useState({
    isSuperAdmin: false,
    isOwner: false,
    isStaff: false,
    isClient: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setCapabilities({ isSuperAdmin: false, isOwner: false, isStaff: false, isClient: false });
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      setIsLoading(true);
      try {
        const { data: rolesData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRole(null);
          return;
        }

        const roles = rolesData?.map(r => r.role as string) || [];

        const hasSuperAdmin = roles.includes('superadmin');
        const hasAdmin = roles.includes('admin');
        const hasUser = roles.includes('user');
        const hasClient = roles.includes('client');

        setCapabilities({
          isSuperAdmin: hasSuperAdmin,
          isOwner: hasAdmin || hasSuperAdmin,
          isStaff: hasUser,
          isClient: hasClient
        });

        // Set primary role for UI strings
        if (hasSuperAdmin) setRole('superadmin');
        else if (hasAdmin) setRole('owner');
        else if (hasUser) setRole('staff');
        else if (hasClient) setRole('client');
        else setRole(null);

      } catch (err) {
        console.error('Unexpected error fetching role:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    ...capabilities,
    isLoading
  };
};
