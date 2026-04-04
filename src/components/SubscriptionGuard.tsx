import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps all tenant-owner routes.
 * Redirects to /subscription if the trial has expired and there is no active subscription.
 * Does NOT block the /subscription page itself.
 */
export const SubscriptionGuard: React.FC<Props> = ({ children }) => {
  const { status, isLoading } = useSubscription();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If subscription page itself — always allow
  if (location.pathname === '/subscription') {
    return <>{children}</>;
  }

  // Allow access during trial, active subscription, or expired (for read-only view)
  if (status === 'trial' || status === 'active' || status === 'expired') {
    return <>{children}</>;
  }

  // Only redirect if there is an unknown error or cancelled state without a plan
  return <Navigate to="/subscription" state={{ from: location }} replace />;
};
