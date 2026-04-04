import { createContext } from 'react';
import { PlanFeatures, PlanKey } from '@/lib/featureFlags';
import { SubscriptionStatus } from '@/api/subscription.api';

export interface SubscriptionContextType extends Omit<SubscriptionStatus, 'status'> {
  status: SubscriptionStatus['status'] | 'loading' | 'error';
  planKey: PlanKey;
  trialDaysLeft: number;
  isFeatureEnabled: (feature: keyof PlanFeatures) => boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);
