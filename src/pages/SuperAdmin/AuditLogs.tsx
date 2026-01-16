import { useState, useEffect } from 'react';
import { superAdminApi, AuditLog } from '@/api/superAdmin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  History,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  view_tenant_details: 'Viewed Tenant',
  update_tenant_status: 'Updated Status',
  update_subscription: 'Changed Subscription',
  soft_delete_tenant: 'Archived Tenant',
  toggle_feature_flag: 'Toggled Feature',
  create_super_admin: 'Created Admin',
  update_super_admin_status: 'Updated Admin'
};

const SuperAdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await superAdminApi.getAuditLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        action_filter: actionFilter !== 'all' ? actionFilter : undefined
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      view_tenant_details: 'bg-blue-100 text-blue-800',
      update_tenant_status: 'bg-amber-100 text-amber-800',
      update_subscription: 'bg-purple-100 text-purple-800',
      soft_delete_tenant: 'bg-red-100 text-red-800',
      toggle_feature_flag: 'bg-green-100 text-green-800',
      create_super_admin: 'bg-indigo-100 text-indigo-800',
      update_super_admin_status: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {ACTION_LABELS[action] || action}
      </span>
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {total} total entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="view_tenant_details">View Tenant</SelectItem>
                <SelectItem value="update_tenant_status">Update Status</SelectItem>
                <SelectItem value="update_subscription">Change Subscription</SelectItem>
                <SelectItem value="soft_delete_tenant">Archive Tenant</SelectItem>
                <SelectItem value="toggle_feature_flag">Toggle Feature</SelectItem>
                <SelectItem value="create_super_admin">Create Admin</SelectItem>
                <SelectItem value="update_super_admin_status">Update Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{log.admin_email}</span>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{log.resource_type}</span>
                      </TableCell>
                      <TableCell>
                        {log.details ? (
                          <span className="text-xs font-mono text-muted-foreground">
                            {JSON.stringify(log.details).slice(0, 50)}
                            {JSON.stringify(log.details).length > 50 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{log.ip_address || 'N/A'}</span>
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
    </div>
  );
};

export default SuperAdminAuditLogs;