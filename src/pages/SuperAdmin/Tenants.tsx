import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi, TenantListItem } from '@/api/superAdmin.api';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  PlayCircle, 
  PauseCircle,
  ArrowUpCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TenantActionDialog } from '@/components/super-admin/TenantActionDialog';

const PAGE_SIZE = 10;

type ActionType = 'activate' | 'suspend' | 'upgrade' | 'delete' | null;

const SuperAdminTenants = () => {
  const navigate = useNavigate();
  const { canWrite } = useSuperAdmin();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  
  // Action dialog state
  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const result = await superAdminApi.getTenants({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
        search: search || undefined
      });
      setTenants(result.tenants);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter, planFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(0);
      fetchTenants();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleAction = (tenant: TenantListItem, action: ActionType) => {
    setSelectedTenant(tenant);
    setActionType(action);
  };

  const handleActionComplete = () => {
    setSelectedTenant(null);
    setActionType(null);
    fetchTenants();
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
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[plan] || colors.free}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground">
          View and manage all organizations on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Tenants
          </CardTitle>
          <CardDescription>
            {total} total organizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-center">Clients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.business_name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.phone_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{getPlanBadge(tenant.subscription_plan)}</TableCell>
                      <TableCell className="text-center">{tenant.users_count}</TableCell>
                      <TableCell className="text-center">{tenant.clients_count}</TableCell>
                      <TableCell>{format(new Date(tenant.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canWrite && (
                              <>
                                <DropdownMenuSeparator />
                                {tenant.status === 'suspended' ? (
                                  <DropdownMenuItem onClick={() => handleAction(tenant, 'activate')}>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                ) : tenant.status === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleAction(tenant, 'suspend')}>
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => handleAction(tenant, 'upgrade')}>
                                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                                  Change Plan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleAction(tenant, 'delete')}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Archive Tenant
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <TenantActionDialog
        tenant={selectedTenant}
        actionType={actionType}
        onClose={() => { setSelectedTenant(null); setActionType(null); }}
        onComplete={handleActionComplete}
      />
    </div>
  );
};

export default SuperAdminTenants;