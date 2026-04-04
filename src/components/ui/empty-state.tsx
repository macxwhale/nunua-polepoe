import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { FeatureGate } from "@/components/FeatureGate";
import type { PlanFeatures } from "@/lib/featureFlags";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  feature?: keyof PlanFeatures;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action, feature }: EmptyStateProps) {
  const button = action ? (
    <Button 
      onClick={action.onClick} 
      className="shadow-md hover:shadow-glow px-8 h-11"
    >
      {action.label}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in text-center">
      {/* Icon with atmospheric glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 opacity-50" />
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 ring-1 ring-primary/20 shadow-lg">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-2xl font-display font-bold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-10 max-w-sm leading-relaxed">
        {description}
      </p>
      
      {/* Action Button */}
      {button && (
        feature ? (
          <FeatureGate feature={feature} fallback="lock">
            {button}
          </FeatureGate>
        ) : button
      )}
    </div>
  );
}