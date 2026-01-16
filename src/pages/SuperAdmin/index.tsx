import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar';
import { SuperAdminHeader } from '@/components/super-admin/SuperAdminHeader';
import { Loader2 } from 'lucide-react';
import { superAdminApi } from '@/api/superAdmin.api';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAnyAdmin, isLoading: adminLoading, adminInfo } = useSuperAdmin();

  useEffect(() => {
    // Update last login when admin accesses the dashboard
    if (isAnyAdmin && adminInfo) {
      superAdminApi.updateLastLogin().catch(console.error);
    }
  }, [isAnyAdmin, adminInfo]);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/super-admin/login');
        return;
      }
      if (!isAnyAdmin) {
        navigate('/super-admin/login');
        return;
      }
      // Redirect to dashboard if on base route
      if (location.pathname === '/super-admin') {
        navigate('/super-admin/dashboard');
      }
    }
  }, [user, isAnyAdmin, authLoading, adminLoading, navigate, location.pathname]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAnyAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col">
        <SuperAdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;