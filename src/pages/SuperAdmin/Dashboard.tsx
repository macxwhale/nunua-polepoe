import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { superAdminApi, PlatformStats } from '@/api/superAdmin.api';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await superAdminApi.getPlatformStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.total_tenants || 0,
      icon: Building2,
      description: 'Organizations on platform',
      color: 'text-blue-600'
    },
    {
      title: 'Active Tenants',
      value: stats?.active_tenants || 0,
      icon: CheckCircle,
      description: 'Currently active',
      color: 'text-green-600'
    },
    {
      title: 'Suspended Tenants',
      value: stats?.suspended_tenants || 0,
      icon: AlertTriangle,
      description: 'Require attention',
      color: 'text-amber-600'
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      description: 'Across all tenants',
      color: 'text-purple-600'
    },
    {
      title: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: UserCheck,
      description: 'Customer records',
      color: 'text-indigo-600'
    },
    {
      title: 'Total Invoices',
      value: stats?.total_invoices || 0,
      icon: FileText,
      description: 'Created invoices',
      color: 'text-cyan-600'
    },
    {
      title: 'Total Transactions',
      value: stats?.total_transactions || 0,
      icon: CreditCard,
      description: 'Payment records',
      color: 'text-emerald-600'
    }
  ];

  const planDistribution = [
    { plan: 'Free', count: stats?.free_plan_tenants || 0, color: 'bg-gray-500' },
    { plan: 'Pro', count: stats?.pro_plan_tenants || 0, color: 'bg-blue-500' },
    { plan: 'Enterprise', count: stats?.enterprise_plan_tenants || 0, color: 'bg-purple-500' }
  ];

  const totalPlanTenants = planDistribution.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your multi-tenant platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.slice(0, 4).map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.slice(4).map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Subscription Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of tenants by subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                {planDistribution.map((plan) => (
                  <div
                    key={plan.plan}
                    className={`${plan.color} transition-all duration-500`}
                    style={{ 
                      width: totalPlanTenants > 0 
                        ? `${(plan.count / totalPlanTenants) * 100}%` 
                        : '0%' 
                    }}
                  />
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {planDistribution.map((plan) => (
                  <div key={plan.plan} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${plan.color}`} />
                    <span className="text-sm font-medium">{plan.plan}</span>
                    <span className="text-sm text-muted-foreground">
                      ({plan.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;