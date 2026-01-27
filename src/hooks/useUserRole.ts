import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'superadmin' | 'owner' | 'client' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Query the database for actual role instead of parsing email
    const fetchRole = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
          return;
        }

        if (!data) {
          // No role found in database - fallback to null
          setRole(null);
          return;
        }

        // Map database roles to frontend roles
        // Database has: 'superadmin' | 'admin' | 'user' | 'client'
        // Frontend uses: 'superadmin' | 'owner' | 'client'
        if (data.role === 'superadmin' as any) {
          setRole('superadmin');
        } else if (data.role === 'admin' || data.role === 'user') {
          setRole('owner');
        } else if (data.role === 'client') {
          setRole('client');
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Unexpected error fetching role:', err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isSuperAdmin: role === 'superadmin',
    isOwner: role === 'owner',
    isClient: role === 'client',
    isLoading
  };
};
