import { useState } from 'react';
import { superAdminApi } from '@/api/superAdmin.api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface CreateAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const adminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['super_admin', 'support_admin'])
});

export const CreateAdminDialog = ({
  open,
  onClose,
  onComplete
}: CreateAdminDialogProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'support_admin'>('support_admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = adminSchema.safeParse({ email, password, fullName, role });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      await superAdminApi.createSuperAdmin(email, password, fullName, role);
      toast.success('Admin created successfully');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('support_admin');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Admin</DialogTitle>
          <DialogDescription>
            Add a new platform administrator
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full Name</Label>
            <Input
              id="admin-name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support_admin">
                  <div>
                    <span className="font-medium">Support Admin</span>
                    <span className="text-muted-foreground ml-2">Read-only access</span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div>
                    <span className="font-medium">Super Admin</span>
                    <span className="text-muted-foreground ml-2">Full access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};