import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Zap, Star, Crown, Mail, Loader2 } from 'lucide-react';
import { initializePaystackPayment } from '@/api/subscription.api';
import { getCurrentTenantId } from '@/api/tenant.api';
import { getUserProfile, updateUserProfile } from '@/api/profile.api';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { paystackConfig } from '@/lib/paystackConfig';
import { toast } from 'sonner';

interface PricingPlan {
  id: 'monthly' | '6month' | '12month';
  title: string;
  price: string;
  originalPrice: string;
  savings: string;
  subtext: string;
  planCode: string;
  amount: number; // in cents (KES * 100)
  icon: React.ReactNode;
  popular: boolean;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    title: 'Essential',
    price: 'KES 1,700',
    originalPrice: 'KES 2,500',
    savings: 'Save 32%',
    subtext: '/mo',
    planCode: paystackConfig.planCodes.monthly,
    amount: 170000,
    icon: <Zap className="h-5 w-5" />,
    popular: false,
    features: [
      '5 User Seats',
      '50 Clients / 20 Products',
      '100 Invoices per month',
      'Core Invoicing Modules',
      'Real-time Notifications',
    ],
  },
  {
    id: '6month',
    title: 'Professional',
    price: 'KES 9,600',
    originalPrice: 'KES 12,000',
    savings: 'Save 20%',
    subtext: 'KES 1,600/mo',
    planCode: paystackConfig.planCodes['6month'],
    amount: 960000,
    icon: <Star className="h-5 w-5" />,
    popular: true,
    features: [
      '15 User Seats',
      '500 Clients / 100 Products',
      '1,000 Invoices per month',
      'Business Insights (PDF Reports)',
      'Priority Support Support',
      'Everything in Essential',
    ],
  },
  {
    id: '12month',
    title: 'Elite',
    price: 'KES 17,000',
    originalPrice: 'KES 19,600',
    savings: 'Save 13%',
    subtext: 'KES 1,417/mo',
    planCode: paystackConfig.planCodes['12month'],
    amount: 1700000,
    icon: <Crown className="h-5 w-5" />,
    popular: false,
    features: [
      'Unlimited Users & Clients',
      'Unlimited Invoices',
      'Bulk Data Operations',
      'Dedicated Account Manager',
      'Custom Branding',
      'Everything in Professional',
    ],
  },
];

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const { status, planKey, trialDaysLeft, trialEndsAt, nextPaymentDate, isLoading } = useSubscription();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [paymentEmail, setPaymentEmail] = React.useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [hasSavedEmail, setHasSavedEmail] = useState(false);

  useEffect(() => {
    const loadProfileEmail = async () => {
      try {
        const profile = await getUserProfile();
        if (profile.email && !profile.email.endsWith('@owner.internal')) {
          setPaymentEmail(profile.email);
          setHasSavedEmail(true);
        }
      } catch (err) {
        console.error("Error loading profile email:", err);
      }
    };
    loadProfileEmail();

    // Check for success status from Paystack redirect
    if (searchParams.get('status') === 'success') {
      setShowSuccess(true);
      toast.success('Subscription successful! Welcome on board.');
      
      // Redirect to dashboard after 3 seconds
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  const isInternalAccount = user?.email?.endsWith('@owner.internal');
  const effectiveEmail = isInternalAccount ? paymentEmail : (paymentEmail || (user?.email ?? ''));

  const handleSaveEmail = async () => {
    if (!paymentEmail || !paymentEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      await updateUserProfile({ email: paymentEmail });
      setHasSavedEmail(true);
      toast.success('Email saved to profile successfully');
    } catch (err) {
      console.error('Error saving email:', err);
      toast.error('Failed to save email');
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user?.email) return;
    setLoadingPlan(plan.id);
    try {
      // Get the tenant_id (different from user.id — it's the UUID from the profiles table)
      const tenantId = await getCurrentTenantId();
      // If still using internal email, prevent payment
      if (isInternalAccount && (!paymentEmail || !paymentEmail.includes('@'))) {
        alert('Please enter a valid email address for payment notifications.');
        return;
      }

      const { authorization_url } = await initializePaystackPayment(
        plan.planCode,
        effectiveEmail,
        tenantId,
        plan.amount,
      );
      window.location.href = authorization_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Payment initialization failed:', msg);
      alert(`Failed to start payment: ${msg}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const statusBadge = () => {
    let badge = null;

    if (status === 'trial') {
      badge = (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Free Trial Active</p>
            <p className="text-sm text-blue-600">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              {trialEndsAt && ` (expires ${new Date(trialEndsAt).toLocaleDateString()})`}
            </p>
          </div>
        </div>
      );
    } else if (status === 'active') {
      badge = (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Subscription Active</p>
            {nextPaymentDate && (
              <p className="text-sm text-green-600">
                Next payment: {new Date(nextPaymentDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      );
    } else if (status === 'expired') {
      badge = (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Trial Expired</p>
            <p className="text-sm text-red-600">Choose a plan below to continue using Lipia Pole Pole.</p>
          </div>
        </div>
      );
    }

    const isCurrentlyActive = status === 'active';
    const emailWarning = isInternalAccount && !isCurrentlyActive && !hasSavedEmail ? (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 group animate-in slide-in-from-top-2 duration-500">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Mail className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900 mb-1">Payment Notification Email Required</p>
            <p className="text-sm text-amber-700 mb-4">
              Since you signed up with a phone number, Paystack requires a real email address for your subscription receipts.
            </p>
            <div className="max-w-md flex gap-2">
              <input
                type="email"
                value={paymentEmail}
                onChange={(e) => setPaymentEmail(e.target.value)}
                placeholder="Enter your email (e.g. name@example.com)"
                className="flex-1 h-11 px-4 rounded-xl border-2 border-amber-200 bg-white focus:border-amber-500 focus:ring-0 transition-all text-sm font-medium placeholder:text-amber-300"
              />
              <button
                onClick={handleSaveEmail}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200/50 active:scale-[0.98] whitespace-nowrap"
              >
                Save to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <>
        {badge}
        {emailWarning}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center p-8 max-w-sm">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 scale-in-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-8">
              Your subscription is being activated. You are being redirected to your dashboard...
            </p>
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium text-green-600 hover:text-green-700 underline"
              >
                Go to Dashboard now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-500 mt-2">
            Flexible pricing for businesses of all sizes. Cancel anytime.
          </p>
        </div>

        {/* Status banner */}
        {!isLoading && statusBadge()}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = status === 'active' && planKey === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm border-2 flex flex-col transition-transform hover:-translate-y-1 ${
                  isPopular ? 'border-green-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={isPopular ? 'text-green-500' : 'text-gray-400'}>{plan.icon}</span>
                    <h2 className="text-xl font-bold text-gray-900">{plan.title}</h2>
                  </div>

                  <div className="mt-4 mb-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-1 text-sm">{plan.subtext}</span>
                  </div>
                  <p className="text-sm text-gray-400 line-through">{plan.originalPrice}</p>
                  <p className="text-sm font-medium text-green-600 mb-6">{plan.savings}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  {isCurrentPlan ? (
                    <div className="w-full rounded-lg py-3 px-4 text-center bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isLoading || !!loadingPlan}
                      className={`w-full rounded-lg py-3 px-4 font-semibold text-sm transition-colors ${
                        isPopular
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-white border-2 border-gray-300 hover:border-green-500 text-gray-800 hover:text-green-700'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {loadingPlan === plan.id ? 'Redirecting...' : 
                       (status === 'active' ? 'Upgrade & Pay Difference' : `Select ${plan.title}`)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Payments are securely processed by Paystack. By subscribing you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Subscription;
