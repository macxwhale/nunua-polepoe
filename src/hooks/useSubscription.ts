import { useEffect, useState, useCallback } from 'react';
import { getCurrentTenantId } from '@/api/tenant.api';
import { getSubscriptionStatus, SubscriptionStatus } from '@/api/subscription.api';
import { PLAN_FEATURES, PlanKey, PlanFeatures, PLAN_LABELS } from '@/lib/featureFlags';
import { paystackConfig } from '@/lib/paystackConfig';

interface UseSubscriptionReturn extends Omit<SubscriptionStatus, 'status'> {
  status: SubscriptionStatus['status'];
  planKey: PlanKey;
  trialDaysLeft: number;
  isFeatureEnabled: (feature: keyof PlanFeatures) => boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [state, setState] = useState<SubscriptionStatus>({
    status: 'loading',
    plan: null,
    trialEndsAt: null,
    nextPaymentDate: null,
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tenantId = await getCurrentTenantId();
      const status = await getSubscriptionStatus(tenantId);
      setState(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Compute the plan key for the feature map
  // Compute the plan key for the feature map
  const planKey: PlanKey = (() => {
    // Mapping Paystack codes to our internal PlanKey names
    const planMap: Record<string, PlanKey> = {
      [paystackConfig.planCodes.monthly]: 'monthly',
      [paystackConfig.planCodes['6month']]: '6month',
      [paystackConfig.planCodes['12month']]: '12month',
    };

    // If we have a recognized plan code, use it even if status is pending
    if (state.plan && planMap[state.plan]) {
      if (state.status === 'active' || state.status === 'pending') {
        return planMap[state.plan];
      }
    }

    if (state.status === 'trial') return 'trial';
    if (state.status === 'expired' || state.status === 'cancelled') return 'expired';
    return 'trial'; // fallback while loading
  })();

  // Days left in trial
  const trialDaysLeft = (() => {
    if (!state.trialEndsAt) return 0;
    const diff = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const isFeatureEnabled = (feature: keyof PlanFeatures): boolean => {
    if (isLoading) return true; // don't flash lock UI while loading
    return PLAN_FEATURES[planKey][feature] ?? false;
  };

  return {
    ...state,
    planKey,
    trialDaysLeft,
    isFeatureEnabled,
    isLoading,
    error,
    refetch: loadStatus,
  };
};
