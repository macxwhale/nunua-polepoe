import React from 'react';
import { Clock, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

export const TrialBanner: React.FC = () => {
  const [dismissed, setDismissed] = React.useState(false);
  const { status, trialDaysLeft, isLoading } = useSubscription();

  if (isLoading || dismissed) return null;
  if (status !== 'trial') return null;

  const isUrgent = trialDaysLeft <= 2;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-red-500 text-white'
          : 'bg-amber-400 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          <strong>
            {trialDaysLeft === 0
              ? 'Your trial expires today!'
              : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your free trial.`}
          </strong>{' '}
          Subscribe now to keep your data and access.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/subscription"
          className={`flex items-center gap-1 font-semibold underline underline-offset-2 ${
            isUrgent ? 'text-white' : 'text-amber-900'
          }`}
        >
          View Plans <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
