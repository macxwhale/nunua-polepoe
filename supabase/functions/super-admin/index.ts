import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuperAdminRequest {
  action: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a super admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('super_admins')
      .select('id, email, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Not a super admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data }: SuperAdminRequest = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Helper to log actions
    const logAction = async (actionName: string, resourceType: string, resourceId?: string | null, tenantId?: string | null, details?: Record<string, unknown>) => {
      await supabaseAdmin.rpc('insert_super_admin_audit_log', {
        _admin_id: adminData.id,
        _admin_email: adminData.email,
        _action: actionName,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _tenant_id: tenantId || null,
        _details: details || null,
        _ip_address: ipAddress,
        _user_agent: userAgent
      });
    };

    let result: unknown;

    switch (action) {
      case 'get_platform_stats': {
        const { data: stats, error } = await supabaseAdmin.rpc('get_platform_stats_admin');
        if (error) throw error;
        result = stats?.[0] || {};
        break;
      }

      case 'get_tenants': {
        const { limit = 50, offset = 0, status, plan, search } = data || {};
        const { data: tenants, error } = await supabaseAdmin.rpc('get_all_tenants_for_admin', {
          _limit: limit,
          _offset: offset,
          _status: status || null,
          _plan: plan || null,
          _search: search || null
        });
        if (error) throw error;
        
        // Get total count
        const { count } = await supabaseAdmin
          .from('tenants')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null);
        
        result = { tenants, total: count };
        break;
      }

      case 'get_tenant_details': {
        const { tenant_id } = data || {};
        if (!tenant_id) throw new Error('tenant_id is required');
        
        const { data: tenant, error } = await supabaseAdmin.rpc('get_tenant_details_for_admin', {
          _tenant_id: tenant_id
        });
        if (error) throw error;
        
        await logAction('view_tenant_details', 'tenant', tenant_id as string, tenant_id as string);
        result = tenant?.[0] || null;
        break;
      }

      case 'update_tenant_status': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { tenant_id, status } = data || {};
        if (!tenant_id || !status) throw new Error('tenant_id and status are required');
        
        const { error } = await supabaseAdmin
          .from('tenants')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', tenant_id);
        
        if (error) throw error;
        
        await logAction('update_tenant_status', 'tenant', tenant_id as string, tenant_id as string, { new_status: status });
        result = { success: true };
        break;
      }

      case 'update_subscription': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { tenant_id, plan, max_users, max_clients, max_invoices, max_products } = data || {};
        if (!tenant_id || !plan) throw new Error('tenant_id and plan are required');
        
        // Set defaults based on plan
        const planDefaults: Record<string, { users: number; clients: number; invoices: number; products: number }> = {
          free: { users: 5, clients: 50, invoices: 100, products: 20 },
          pro: { users: 25, clients: 500, invoices: 1000, products: 200 },
          enterprise: { users: 999999, clients: 999999, invoices: 999999, products: 999999 }
        };
        
        const defaults = planDefaults[plan as string] || planDefaults.free;
        
        const { error } = await supabaseAdmin
          .from('tenant_subscriptions')
          .upsert({
            tenant_id,
            plan,
            max_users: max_users || defaults.users,
            max_clients: max_clients || defaults.clients,
            max_invoices_per_month: max_invoices || defaults.invoices,
            max_products: max_products || defaults.products,
            updated_at: new Date().toISOString()
          }, { onConflict: 'tenant_id' });
        
        if (error) throw error;
        
        await logAction('update_subscription', 'subscription', tenant_id as string, tenant_id as string, { plan, max_users, max_clients });
        result = { success: true };
        break;
      }

      case 'soft_delete_tenant': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { tenant_id } = data || {};
        if (!tenant_id) throw new Error('tenant_id is required');
        
        const { error } = await supabaseAdmin
          .from('tenants')
          .update({ 
            status: 'archived', 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .eq('id', tenant_id)
          .is('deleted_at', null);
        
        if (error) throw error;
        
        await logAction('soft_delete_tenant', 'tenant', tenant_id as string, tenant_id as string);
        result = { success: true };
        break;
      }

      case 'get_feature_flags': {
        const { tenant_id } = data || {};
        if (!tenant_id) throw new Error('tenant_id is required');
        
        const { data: flags, error } = await supabaseAdmin
          .from('tenant_feature_flags')
          .select('*')
          .eq('tenant_id', tenant_id)
          .order('flag_name');
        
        if (error) throw error;
        result = flags;
        break;
      }

      case 'toggle_feature_flag': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { tenant_id, flag_name, is_enabled } = data || {};
        if (!tenant_id || !flag_name || is_enabled === undefined) {
          throw new Error('tenant_id, flag_name, and is_enabled are required');
        }
        
        const { error } = await supabaseAdmin
          .from('tenant_feature_flags')
          .upsert({
            tenant_id,
            flag_name,
            is_enabled,
            updated_at: new Date().toISOString()
          }, { onConflict: 'tenant_id,flag_name' });
        
        if (error) throw error;
        
        await logAction('toggle_feature_flag', 'feature_flag', null, tenant_id as string, { flag_name, is_enabled });
        result = { success: true };
        break;
      }

      case 'get_audit_logs': {
        const { limit = 100, offset = 0, tenant_id, admin_id, action_filter, start_date, end_date } = data || {};
        
        let query = supabaseAdmin
          .from('super_admin_audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset as number, (offset as number) + (limit as number) - 1);
        
        if (tenant_id) query = query.eq('tenant_id', tenant_id);
        if (admin_id) query = query.eq('admin_id', admin_id);
        if (action_filter) query = query.eq('action', action_filter);
        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);
        
        const { data: logs, count, error } = await query;
        if (error) throw error;
        
        result = { logs, total: count };
        break;
      }

      case 'get_super_admins': {
        const { data: admins, error } = await supabaseAdmin
          .from('super_admins')
          .select('id, email, full_name, role, is_active, last_login_at, created_at')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        result = admins;
        break;
      }

      case 'create_super_admin': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { email, password, full_name, role } = data || {};
        if (!email || !password || !full_name) {
          throw new Error('email, password, and full_name are required');
        }
        
        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email as string,
          password: password as string,
          email_confirm: true
        });
        
        if (createError) throw createError;
        
        // Create super admin record
        const { error: insertError } = await supabaseAdmin
          .from('super_admins')
          .insert({
            user_id: newUser.user.id,
            email: email as string,
            full_name: full_name as string,
            role: role || 'support_admin'
          });
        
        if (insertError) {
          // Rollback: delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          throw insertError;
        }
        
        await logAction('create_super_admin', 'super_admin', newUser.user.id, null, { email, role });
        result = { success: true, user_id: newUser.user.id };
        break;
      }

      case 'update_super_admin_status': {
        if (adminData.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Access denied: Requires super admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { admin_id, is_active } = data || {};
        if (!admin_id || is_active === undefined) {
          throw new Error('admin_id and is_active are required');
        }
        
        // Prevent self-deactivation
        if (admin_id === adminData.id && !is_active) {
          throw new Error('Cannot deactivate your own account');
        }
        
        const { error } = await supabaseAdmin
          .from('super_admins')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', admin_id);
        
        if (error) throw error;
        
        await logAction('update_super_admin_status', 'super_admin', admin_id as string, null, { is_active });
        result = { success: true };
        break;
      }

      case 'update_last_login': {
        await supabaseAdmin
          .from('super_admins')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', user.id);
        
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Super admin function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});