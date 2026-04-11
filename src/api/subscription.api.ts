import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'loading' | 'pending';
  plan: string | null;
  trialEndsAt: string | null;
  nextPaymentDate: string | null;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
}

export interface BillingHistory {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  event_type: string;
  paystack_reference: string;
  plan_code?: string;
}

/**
 * Fetch the current tenant's subscription status from Supabase
 */
export const getSubscriptionStatus = async (tenantId: string): Promise<SubscriptionStatus> => {
  // Fetch tenant trial info + subscription in one go
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('trial_ends_at')
    .eq('id', tenantId)
    .single();

  const tenant = tenantData as any;

  if (!tenant) {
    throw new Error('Failed to load tenant');
  }

  const { data: subData } = await supabase
    .from('tenant_subscriptions')
    .select('plan, status, next_payment_date, paystack_customer_code, paystack_subscription_code, cancelled_at')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const sub = subData as any;
  const now = new Date();
  const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;

  // 1. Check for Active or Pending Subscription
  if (sub && (sub.status === 'active' || sub.status === 'pending') && !sub.cancelled_at) {
    return {
      status: sub.status as 'active' | 'pending',
      plan: sub.plan,
      trialEndsAt: tenant.trial_ends_at,
      nextPaymentDate: sub.next_payment_date ?? null,
      paystackCustomerCode: sub.paystack_customer_code ?? null,
      paystackSubscriptionCode: sub.paystack_subscription_code ?? null,
    };
  }

  // 2. Check for Cancelled Subscription
  if (sub && sub.cancelled_at) {
    return {
      status: 'cancelled',
      plan: sub.plan,
      trialEndsAt: tenant.trial_ends_at,
      nextPaymentDate: null,
      paystackCustomerCode: sub.paystack_customer_code ?? null,
      paystackSubscriptionCode: null,
    };
  }

  // 3. Fallback to Trial
  if (trialEndsAt && now <= trialEndsAt) {
    return {
      status: 'trial',
      plan: null,
      trialEndsAt: tenant.trial_ends_at,
      nextPaymentDate: null,
      paystackCustomerCode: sub?.paystack_customer_code ?? null,
      paystackSubscriptionCode: null,
    };
  }

  // 4. Trial has ended
  return {
    status: 'expired',
    plan: null,
    trialEndsAt: tenant.trial_ends_at,
    nextPaymentDate: null,
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
  };
};

/**
 * Initialize a Paystack transaction — calls our Edge Function
 */
export const initializePaystackPayment = async (planCode: string, email: string, tenantId: string, amount: number) => {
  const { data, error } = await supabase.functions.invoke('paystack-initialize', {
    body: { planCode, email, tenantId, amount },
  });

  if (error) throw new Error(error.message);
  return data as { authorization_url: string; reference: string };
};

/**
 * Cancel a subscription — calls our Edge Function
 */
export const cancelSubscription = async (subscriptionCode: string) => {
  const { data, error } = await supabase.functions.invoke('paystack-cancel', {
    body: { subscriptionCode },
  });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Fetch the current tenant's billing history from Supabase
 */
export const getBillingHistory = async (_tenantId: string): Promise<BillingHistory[]> => {
  // subscription_billing_history table not yet created - return empty for now
  console.warn('Billing history table not yet available');
  return [];
};
