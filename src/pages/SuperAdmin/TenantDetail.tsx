import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminApi, TenantDetails, FeatureFlag } from '@/api/superAdmin.api';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  Calendar,
  Phone,
  Settings,
  Flag,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/currency';
import { TenantActionDialog } from '@/components/super-admin/TenantActionDialog';
import { AddFeatureFlagDialog } from '@/components/super-admin/AddFeatureFlagDialog';

type ActionType = 'activate' | 'suspend' | 'upgrade' | 'delete' | null;

const TenantDetailPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { canWrite } = useSuperAdmin();
  
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [showAddFlag, setShowAddFlag] = useState(false);

  const fetchTenantDetails = async () => {
    if (!tenantId) return;
    
    try {
      const [tenantData, flagsData] = await Promise.all([
        superAdminApi.getTenantDetails(tenantId),
        superAdminApi.getFeatureFlags(tenantId)
      ]);
      setTenant(tenantData);
      setFeatureFlags(flagsData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tenant');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const handleToggleFlag = async (flagName: string, currentValue: boolean) => {
    if (!tenantId || !canWrite) return;
    
    try {
      await superAdminApi.toggleFeatureFlag(tenantId, flagName, !currentValue);
      setFeatureFlags(flags => 
        flags.map(f => f.flag_name === flagName ? { ...f, is_enabled: !currentValue } : f)
      );
      toast.success(`Feature flag ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle flag');
    }
  };

  const handleActionComplete = () => {
    setActionType(null);
    fetchTenantDetails();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      suspended: 'destructive',
      pending: 'secondary',
      archived: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[plan] || colors.free}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tenant not found</p>
        <Button variant="link" onClick={() => navigate('/super-admin/tenants')}>
          Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{tenant.business_name}</h1>
            {getStatusBadge(tenant.status)}
            {getPlanBadge(tenant.subscription_plan)}
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Phone className="h-4 w-4" />
            {tenant.phone_number}
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {tenant.status === 'suspended' ? (
              <Button onClick={() => setActionType('activate')}>Activate</Button>
            ) : tenant.status === 'active' ? (
              <Button variant="outline" onClick={() => setActionType('suspend')}>Suspend</Button>
            ) : null}
            <Button variant="outline" onClick={() => setActionType('upgrade')}>
              Change Plan
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenant.users_count}</div>
                <p className="text-xs text-muted-foreground">
                  of {tenant.max_users === 999999 ? '∞' : tenant.max_users} allowed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenant.clients_count}</div>
                <p className="text-xs text-muted-foreground">
                  of {tenant.max_clients === 999999 ? '∞' : tenant.max_clients} allowed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenant.invoices_count}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(tenant.total_invoice_amount)} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenant.transactions_count}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(tenant.total_payment_amount)} collected
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tenant ID</dt>
                  <dd className="text-sm font-mono">{tenant.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(tenant.created_at), 'PPP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="text-sm">{format(new Date(tenant.updated_at), 'PPP p')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Activity</dt>
                  <dd className="text-sm">
                    {tenant.last_activity_at 
                      ? format(new Date(tenant.last_activity_at), 'PPP p')
                      : 'No activity recorded'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Current usage against plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Users', current: tenant.users_count, max: tenant.max_users },
                { label: 'Clients', current: tenant.clients_count, max: tenant.max_clients },
                { label: 'Invoices/month', current: tenant.invoices_count, max: tenant.max_invoices_per_month },
                { label: 'Products', current: 0, max: tenant.max_products }
              ].map((item) => {
                const percentage = item.max === 999999 ? 0 : (item.current / item.max) * 100;
                const isNearLimit = percentage > 80;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className={isNearLimit ? 'text-amber-600' : ''}>
                        {item.current} / {item.max === 999999 ? '∞' : item.max}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Enable or disable features for this tenant</CardDescription>
              </div>
              {canWrite && (
                <Button size="sm" onClick={() => setShowAddFlag(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Flag
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {featureFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feature flags configured
                </p>
              ) : (
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{flag.flag_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {format(new Date(flag.updated_at), 'PPP')}
                        </p>
                      </div>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggleFlag(flag.flag_name, flag.is_enabled)}
                        disabled={!canWrite}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Current Plan</dt>
                  <dd className="mt-1">{getPlanBadge(tenant.subscription_plan)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {tenant.subscription_status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Started</dt>
                  <dd className="text-sm">
                    {tenant.subscription_started_at 
                      ? format(new Date(tenant.subscription_started_at), 'PPP')
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Expires</dt>
                  <dd className="text-sm">
                    {tenant.subscription_expires_at 
                      ? format(new Date(tenant.subscription_expires_at), 'PPP')
                      : 'Never'}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4">Plan Limits</h4>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Max Users</dt>
                    <dd className="text-lg font-semibold">
                      {tenant.max_users === 999999 ? '∞' : tenant.max_users}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Max Clients</dt>
                    <dd className="text-lg font-semibold">
                      {tenant.max_clients === 999999 ? '∞' : tenant.max_clients}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Invoices/Month</dt>
                    <dd className="text-lg font-semibold">
                      {tenant.max_invoices_per_month === 999999 ? '∞' : tenant.max_invoices_per_month}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Max Products</dt>
                    <dd className="text-lg font-semibold">
                      {tenant.max_products === 999999 ? '∞' : tenant.max_products}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <TenantActionDialog
        tenant={tenant}
        actionType={actionType}
        onClose={() => setActionType(null)}
        onComplete={handleActionComplete}
      />

      {/* Add Feature Flag Dialog */}
      <AddFeatureFlagDialog
        tenantId={tenantId!}
        open={showAddFlag}
        onClose={() => setShowAddFlag(false)}
        onComplete={() => {
          setShowAddFlag(false);
          fetchTenantDetails();
        }}
      />
    </div>
  );
};

export default TenantDetailPage;