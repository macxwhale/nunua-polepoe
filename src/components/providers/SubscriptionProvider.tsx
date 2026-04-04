import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getCurrentTenantId } from '@/api/tenant.api';
import { getSubscriptionStatus, SubscriptionStatus } from '@/api/subscription.api';
import { PLAN_FEATURES, PlanKey, PlanFeatures } from '@/lib/featureFlags';
import { paystackConfig } from '@/lib/paystackConfig';
import { SubscriptionContext, SubscriptionContextType } from '@/contexts/SubscriptionContext';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
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
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tenantId = await getCurrentTenantId();
      const status = await getSubscriptionStatus(tenantId);
      setState(status);
    } catch (err) {
      console.error("SubscriptionProvider: Error loading status:", err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadStatus();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user, loadStatus]);

  const planKey: PlanKey = useMemo(() => {
    const planMap: Record<string, PlanKey> = {
      [paystackConfig.planCodes.monthly]: 'monthly',
      [paystackConfig.planCodes['6month']]: '6month',
      [paystackConfig.planCodes['12month']]: '12month',
    };

    if (state.plan && planMap[state.plan]) {
      if (state.status === 'active' || state.status === 'pending') {
        return planMap[state.plan];
      }
    }

    if (state.status === 'trial') return 'trial';
    if (state.status === 'expired' || state.status === 'cancelled') return 'expired';
    return 'trial';
  }, [state]);

  const trialDaysLeft = useMemo(() => {
    if (!state.trialEndsAt) return 0;
    const diff = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [state.trialEndsAt]);

  const isFeatureEnabled = useCallback((feature: keyof PlanFeatures): boolean => {
    // If trial is expired, features should definitely be false
    return PLAN_FEATURES[planKey][feature] ?? false;
  }, [planKey]);

  const contextValue: SubscriptionContextType = {
    ...state,
    planKey,
    trialDaysLeft,
    isFeatureEnabled,
    isLoading,
    error,
    refetch: loadStatus,
  };

  // Block the app from loading until the initial subscription check finishes
  // This ensures no 'feature flashing'.
  if ((authLoading || isLoading) && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          <p className="text-xs font-medium text-muted-foreground animate-pulse tracking-widest uppercase">
            Verifying Subscription...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};
