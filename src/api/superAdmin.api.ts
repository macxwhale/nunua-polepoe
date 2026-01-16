import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin`;

interface SuperAdminResponse<T> {
  data?: T;
  error?: string;
}

async function callSuperAdminFunction<T>(action: string, data?: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, data })
  });

  const result: SuperAdminResponse<T> = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data as T;
}

// Types
export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  free_plan_tenants: number;
  pro_plan_tenants: number;
  enterprise_plan_tenants: number;
  total_users: number;
  total_clients: number;
  total_invoices: number;
  total_transactions: number;
}

export interface TenantListItem {
  id: string;
  business_name: string;
  phone_number: string;
  status: 'active' | 'suspended' | 'pending' | 'archived';
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  deleted_at: string | null;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: string;
  max_users: number;
  max_clients: number;
  users_count: number;
  clients_count: number;
}

export interface TenantDetails extends TenantListItem {
  max_invoices_per_month: number;
  max_products: number;
  features: Record<string, unknown>;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  invoices_count: number;
  transactions_count: number;
  total_invoice_amount: number;
  total_payment_amount: number;
}

export interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  tenant_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SuperAdmin {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'support_admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

// API Functions
export const superAdminApi = {
  // Platform Stats
  getPlatformStats: () => callSuperAdminFunction<PlatformStats>('get_platform_stats'),

  // Tenants
  getTenants: (params?: { 
    limit?: number; 
    offset?: number; 
    status?: string; 
    plan?: string; 
    search?: string;
  }) => callSuperAdminFunction<{ tenants: TenantListItem[]; total: number }>('get_tenants', params),

  getTenantDetails: (tenantId: string) => 
    callSuperAdminFunction<TenantDetails>('get_tenant_details', { tenant_id: tenantId }),

  updateTenantStatus: (tenantId: string, status: 'active' | 'suspended' | 'pending' | 'archived') =>
    callSuperAdminFunction<{ success: boolean }>('update_tenant_status', { tenant_id: tenantId, status }),

  updateSubscription: (tenantId: string, plan: 'free' | 'pro' | 'enterprise', limits?: {
    max_users?: number;
    max_clients?: number;
    max_invoices?: number;
    max_products?: number;
  }) => callSuperAdminFunction<{ success: boolean }>('update_subscription', { 
    tenant_id: tenantId, 
    plan,
    ...limits 
  }),

  softDeleteTenant: (tenantId: string) =>
    callSuperAdminFunction<{ success: boolean }>('soft_delete_tenant', { tenant_id: tenantId }),

  // Feature Flags
  getFeatureFlags: (tenantId: string) =>
    callSuperAdminFunction<FeatureFlag[]>('get_feature_flags', { tenant_id: tenantId }),

  toggleFeatureFlag: (tenantId: string, flagName: string, isEnabled: boolean) =>
    callSuperAdminFunction<{ success: boolean }>('toggle_feature_flag', { 
      tenant_id: tenantId, 
      flag_name: flagName, 
      is_enabled: isEnabled 
    }),

  // Audit Logs
  getAuditLogs: (params?: {
    limit?: number;
    offset?: number;
    tenant_id?: string;
    admin_id?: string;
    action_filter?: string;
    start_date?: string;
    end_date?: string;
  }) => callSuperAdminFunction<{ logs: AuditLog[]; total: number }>('get_audit_logs', params),

  // Super Admins
  getSuperAdmins: () => callSuperAdminFunction<SuperAdmin[]>('get_super_admins'),

  createSuperAdmin: (email: string, password: string, fullName: string, role: 'super_admin' | 'support_admin') =>
    callSuperAdminFunction<{ success: boolean; user_id: string }>('create_super_admin', {
      email,
      password,
      full_name: fullName,
      role
    }),

  updateSuperAdminStatus: (adminId: string, isActive: boolean) =>
    callSuperAdminFunction<{ success: boolean }>('update_super_admin_status', { 
      admin_id: adminId, 
      is_active: isActive 
    }),

  updateLastLogin: () => callSuperAdminFunction<{ success: boolean }>('update_last_login')
};