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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddFeatureFlagDialogProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const AddFeatureFlagDialog = ({
  tenantId,
  open,
  onClose,
  onComplete
}: AddFeatureFlagDialogProps) => {
  const [flagName, setFlagName] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!flagName.trim()) {
      toast.error('Flag name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await superAdminApi.toggleFeatureFlag(tenantId, flagName.trim(), isEnabled);
      toast.success('Feature flag added');
      setFlagName('');
      setIsEnabled(false);
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feature Flag</DialogTitle>
          <DialogDescription>
            Create a new feature flag for this tenant
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flag-name">Flag Name</Label>
            <Input
              id="flag-name"
              placeholder="e.g., sms_notifications, advanced_reports"
              value={flagName}
              onChange={(e) => setFlagName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use snake_case naming convention
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Initial State</Label>
              <p className="text-sm text-muted-foreground">
                Enable this flag immediately
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !flagName.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};