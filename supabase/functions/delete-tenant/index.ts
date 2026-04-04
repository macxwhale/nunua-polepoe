import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify User is Superadmin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'superadmin') {
      throw new Error('Only superadmins can perform this operation')
    }

    // 2. Get Tenant ID from Body
    const { tenant_id } = await req.json()
    if (!tenant_id) throw new Error('Tenant ID is required')

    console.log(`Hard deleting tenant: ${tenant_id}`)

    // 3. Identify all linked users from profiles
    const { data: profiles, error: profileFetchError } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('tenant_id', tenant_id)

    if (profileFetchError) throw profileFetchError

    const userIds = profiles?.map(p => p.user_id) || []
    console.log(`Identifying ${userIds.length} linked users for deletion.`)

    // 4. Atomic Deletion Sequence (Order matters for FK constraints)
    
    // Transactions
    const { error: txError } = await adminClient.from('transactions').delete().eq('tenant_id', tenant_id)
    if (txError) throw txError

    // Payments
    const { error: payError } = await adminClient.from('payments').delete().eq('tenant_id', tenant_id)
    if (payError) throw payError

    // Invoices
    const { error: invError } = await adminClient.from('invoices').delete().eq('tenant_id', tenant_id)
    if (invError) throw invError

    // Products
    const { error: prodError } = await adminClient.from('products').delete().eq('tenant_id', tenant_id)
    if (prodError) throw prodError

    // Clients
    const { error: clientError } = await adminClient.from('clients').delete().eq('tenant_id', tenant_id)
    if (clientError) throw clientError

    // Tenant Subscriptions
    const { error: subError } = await adminClient.from('tenant_subscriptions').delete().eq('tenant_id', tenant_id)
    if (subError) throw subError

    // 5. Delete linked user roles & profiles
    if (userIds.length > 0) {
      await adminClient.from('user_roles').delete().in('user_id', userIds)
      await adminClient.from('profiles').delete().in('user_id', userIds)
      
      // 6. Hard delete from Auth
      console.log(`Hard deleting ${userIds.length} users from Supabase Auth...`)
      for (const uid of userIds) {
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(uid)
        if (authDeleteError) {
          console.error(`Failed to delete user ${uid} from Auth:`, authDeleteError)
          // We continue anyway to ensure as much as possible is deleted
        }
      }
    }

    // 7. Finally, delete the Tenant record itself
    const { error: tenantDeleteError } = await adminClient.from('tenants').delete().eq('id', tenant_id)
    if (tenantDeleteError) throw tenantDeleteError

    console.log(`Success: Tenant ${tenant_id} and all related data purged.`)

    return new Response(JSON.stringify({ message: 'Tenant purged successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Purge Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
