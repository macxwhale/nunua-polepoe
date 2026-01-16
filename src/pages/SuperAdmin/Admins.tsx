import { useState, useEffect } from 'react';
import { superAdminApi, SuperAdmin } from '@/api/superAdmin.api';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreHorizontal, 
  UserPlus,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateAdminDialog } from '@/components/super-admin/CreateAdminDialog';

const SuperAdminAdmins = () => {
  const { canWrite, adminInfo } = useSuperAdmin();
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchAdmins = async () => {
    try {
      const data = await superAdminApi.getSuperAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleStatus = async (admin: SuperAdmin) => {
    if (!canWrite) return;
    if (admin.id === adminInfo?.id) {
      toast.error('Cannot deactivate your own account');
      return;
    }

    try {
      await superAdminApi.updateSuperAdminStatus(admin.id, !admin.is_active);
      setAdmins(admins.map(a => 
        a.id === admin.id ? { ...a, is_active: !a.is_active } : a
      ));
      toast.success(`Admin ${admin.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update admin');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Shield className="h-3 w-3 mr-1" />
        Support Admin
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">
            Manage platform administrators
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Administrators
          </CardTitle>
          <CardDescription>
            {admins.length} total administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  {canWrite && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      {canWrite && <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      No administrators found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.full_name}
                        {admin.id === adminInfo?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{admin.email}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.last_login_at 
                          ? format(new Date(admin.last_login_at), 'MMM d, HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>{format(new Date(admin.created_at), 'MMM d, yyyy')}</TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={admin.id === adminInfo?.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {admin.is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(admin)}
                                  className="text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateAdminDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onComplete={() => {
          setShowCreateDialog(false);
          fetchAdmins();
        }}
      />
    </div>
  );
};

export default SuperAdminAdmins;