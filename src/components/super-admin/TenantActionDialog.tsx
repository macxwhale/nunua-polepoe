import { useState } from 'react';
import { superAdminApi, TenantListItem, TenantDetails } from '@/api/superAdmin.api';
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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ActionType = 'activate' | 'suspend' | 'upgrade' | 'delete' | null;

interface TenantActionDialogProps {
  tenant: TenantListItem | TenantDetails | null;
  actionType: ActionType;
  onClose: () => void;
  onComplete: () => void;
}

export const TenantActionDialog = ({
  tenant,
  actionType,
  onClose,
  onComplete
}: TenantActionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [confirmText, setConfirmText] = useState('');

  const handleSubmit = async () => {
    if (!tenant) return;
    setIsSubmitting(true);

    try {
      switch (actionType) {
        case 'activate':
          await superAdminApi.updateTenantStatus(tenant.id, 'active');
          toast.success('Tenant activated successfully');
          break;
        case 'suspend':
          await superAdminApi.updateTenantStatus(tenant.id, 'suspended');
          toast.success('Tenant suspended');
          break;
        case 'upgrade':
          await superAdminApi.updateSubscription(tenant.id, selectedPlan);
          toast.success(`Subscription updated to ${selectedPlan}`);
          break;
        case 'delete':
          if (confirmText !== tenant.business_name) {
            toast.error('Please type the tenant name to confirm');
            setIsSubmitting(false);
            return;
          }
          await superAdminApi.softDeleteTenant(tenant.id);
          toast.success('Tenant archived');
          break;
      }
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenant || !actionType) return null;

  const getDialogContent = () => {
    switch (actionType) {
      case 'activate':
        return {
          title: 'Activate Tenant',
          description: `Are you sure you want to activate "${tenant.business_name}"? This will restore their access to the platform.`,
          confirmLabel: 'Activate',
          variant: 'default' as const
        };
      case 'suspend':
        return {
          title: 'Suspend Tenant',
          description: `Are you sure you want to suspend "${tenant.business_name}"? Users will lose access to the platform.`,
          confirmLabel: 'Suspend',
          variant: 'destructive' as const
        };
      case 'upgrade':
        return {
          title: 'Change Subscription Plan',
          description: `Update the subscription plan for "${tenant.business_name}".`,
          confirmLabel: 'Update Plan',
          variant: 'default' as const
        };
      case 'delete':
        return {
          title: 'Archive Tenant',
          description: `This action will archive "${tenant.business_name}" and all associated data. This cannot be undone.`,
          confirmLabel: 'Archive Tenant',
          variant: 'destructive' as const
        };
      default:
        return { title: '', description: '', confirmLabel: '', variant: 'default' as const };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={!!actionType} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(actionType === 'suspend' || actionType === 'delete') && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {content.title}
          </DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {actionType === 'upgrade' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as typeof selectedPlan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">
                      <div>
                        <span className="font-medium">Free</span>
                        <span className="text-muted-foreground ml-2">5 users, 50 clients</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div>
                        <span className="font-medium">Pro</span>
                        <span className="text-muted-foreground ml-2">25 users, 500 clients</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div>
                        <span className="font-medium">Enterprise</span>
                        <span className="text-muted-foreground ml-2">Unlimited</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {actionType === 'delete' && (
            <div className="space-y-2">
              <Label>
                Type <span className="font-mono font-bold">{tenant.business_name}</span> to confirm
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter tenant name"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant={content.variant}
            onClick={handleSubmit}
            disabled={isSubmitting || (actionType === 'delete' && confirmText !== tenant.business_name)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {content.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};