import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type SuperAdminRole = 'super_admin' | 'support_admin' | null;

interface SuperAdminInfo {
  id: string;
  email: string;
  fullName: string;
  role: SuperAdminRole;
  isActive: boolean;
}

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [adminInfo, setAdminInfo] = useState<SuperAdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAdminInfo(null);
      setIsLoading(false);
      return;
    }

    const fetchAdminInfo = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('super_admins')
          .select('id, email, full_name, role, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching super admin info:', error);
          setAdminInfo(null);
          return;
        }

        if (!data) {
          setAdminInfo(null);
          return;
        }

        setAdminInfo({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role as SuperAdminRole,
          isActive: data.is_active
        });
      } catch (err) {
        console.error('Unexpected error fetching super admin info:', err);
        setAdminInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminInfo();
  }, [user]);

  return {
    adminInfo,
    isSuperAdmin: adminInfo?.role === 'super_admin',
    isSupportAdmin: adminInfo?.role === 'support_admin',
    isAnyAdmin: !!adminInfo,
    canWrite: adminInfo?.role === 'super_admin', // Only super_admin can write
    isLoading
  };
};