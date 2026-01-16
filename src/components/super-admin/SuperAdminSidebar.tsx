import { NavLink } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  History,
  Shield,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/super-admin/tenants', label: 'Tenants', icon: Building2 },
  { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: History },
  { to: '/super-admin/admins', label: 'Admins', icon: Shield }
];

export const SuperAdminSidebar = () => {
  const { adminInfo } = useSuperAdmin();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h2 className="font-bold text-lg">Super Admin</h2>
            <p className="text-xs text-muted-foreground">Platform Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{adminInfo?.fullName}</p>
          <p className="capitalize">{adminInfo?.role?.replace('_', ' ')}</p>
        </div>
      </div>
    </aside>
  );
};