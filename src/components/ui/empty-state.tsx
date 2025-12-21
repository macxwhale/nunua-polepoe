import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
      {/* Icon with atmospheric glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 ring-1 ring-primary/20 shadow-lg">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-display font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm leading-relaxed">
        {description}
      </p>
      
      {/* Action Button */}
      {action && (
        <Button 
          onClick={action.onClick} 
          className="shadow-md hover:shadow-glow"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}