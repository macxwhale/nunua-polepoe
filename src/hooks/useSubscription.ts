import { useContext } from 'react';
import { PlanKey, PlanFeatures } from '@/lib/featureFlags';
import { SubscriptionContext, SubscriptionContextType } from '@/contexts/SubscriptionContext';

interface UseSubscriptionReturn extends Omit<SubscriptionContextType, 'status'> {
  status: SubscriptionContextType['status'];
  planKey: PlanKey;
  trialDaysLeft: number;
  isFeatureEnabled: (feature: keyof PlanFeatures) => boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }

  return context as UseSubscriptionReturn;
};
