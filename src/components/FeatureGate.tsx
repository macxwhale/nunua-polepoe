import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlanFeatures } from '@/lib/featureFlags';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: 'hide' | 'lock' | 'inline' | React.ReactNode;
  upgradeMessage?: string;
}

/**
 * A wrapper component that conditionally renders content based on the user's subscription plan.
 * 
 * - 'hide': Completely removes the element.
 * - 'lock': Shows the element but greyed out with a lock icon and tooltip.
 * - 'inline': Shows a small "Upgrade" button/badge.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback = 'hide',
  upgradeMessage = "Upgrade your plan to unlock this feature."
}) => {
  const { isFeatureEnabled, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;

  const hasAccess = isFeatureEnabled(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different fallback UI states
  if (fallback === 'hide') return null;

  if (fallback === 'lock') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group cursor-not-allowed opacity-60 grayscale filter">
              <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="pointer-events-none">
                {children}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-4 bg-white border-2 border-primary/20 shadow-xl rounded-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Crown className="h-4 w-4" />
                <span>Feature Locked</span>
              </div>
              <p className="text-xs text-muted-foreground">{upgradeMessage}</p>
              <Button asChild size="sm" className="mt-1 h-7 text-[10px] font-bold uppercase tracking-wider">
                <Link to="/subscription">Upgrade Now</Link>
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (fallback === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
        <Lock className="h-3 w-3" />
        {upgradeMessage}
        <Link to="/subscription" className="font-bold underline hover:text-amber-900 ml-1">
          Upgrade
        </Link>
      </div>
    );
  }

  if (React.isValidElement(fallback)) {
    return <>{fallback}</>;
  }

  return null;
};
