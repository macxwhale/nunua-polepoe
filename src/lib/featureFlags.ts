// Feature flags per subscription plan
export type PlanKey = 'trial' | 'monthly' | '6month' | '12month' | 'expired';

export interface PlanFeatures {
  clients: boolean;        // Access to clients module
  invoicing: boolean;      // Create/manage invoices
  payments: boolean;       // View/record payments
  products: boolean;       // Products module
  notifications: boolean;  // Real-time notifications
  reports: boolean;        // PDF report export & business insights
  bulkOps: boolean;        // Bulk data operations
  customBranding: boolean; // Custom branding
  prioritySupport: boolean;// Priority support
  accountManager: boolean; // Dedicated account manager
}

export const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  trial: {
    clients: true,
    invoicing: true,
    payments: true,
    products: true,
    notifications: true,
    reports: false,
    bulkOps: false,
    customBranding: false,
    prioritySupport: false,
    accountManager: false,
  },
  monthly: {
    clients: true,
    invoicing: true,
    payments: true,
    products: true,
    notifications: true,
    reports: false,
    bulkOps: false,
    customBranding: false,
    prioritySupport: false,
    accountManager: false,
  },
  '6month': {
    clients: true,
    invoicing: true,
    payments: true,
    products: true,
    notifications: true,
    reports: true,
    bulkOps: false,
    customBranding: false,
    prioritySupport: true,
    accountManager: false,
  },
  '12month': {
    clients: true,
    invoicing: true,
    payments: true,
    products: true,
    notifications: true,
    reports: true,
    bulkOps: true,
    customBranding: true,
    prioritySupport: true,
    accountManager: true,
  },
  expired: {
    clients: false,
    invoicing: false,
    payments: false,
    products: false,
    notifications: false,
    reports: false,
    bulkOps: false,
    customBranding: false,
    prioritySupport: false,
    accountManager: false,
  },
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  trial: 'Free Trial',
  monthly: 'Monthly Essential',
  '6month': '6 Months Professional',
  '12month': '12 Months Elite',
  expired: 'Expired',
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  trial: 'Free',
  monthly: 'KES 1,700/mo',
  '6month': 'KES 9,600/6mo',
  '12month': 'KES 17,000/yr',
  expired: '-',
};
