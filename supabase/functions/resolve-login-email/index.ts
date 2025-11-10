import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResolveLoginEmailRequest {
  phone_number: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number }: ResolveLoginEmailRequest = await req.json();

    if (!phone_number || !/^0\d{9}$/.test(phone_number)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Find users by phone via profiles table to avoid pagination and email pattern issues
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone_number', phone_number);

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to search users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userIds = Array.from(new Set((profiles ?? []).map((p: { user_id: string }) => p.user_id))).filter(Boolean);

    if (userIds.length === 0) {
      console.log('No user found with phone number:', phone_number);
      return new Response(
        JSON.stringify({ error: "No account found for this phone number" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch emails for each user id
    const lookups = await Promise.allSettled(
      userIds.map(id => supabaseAdmin.auth.admin.getUserById(id))
    );

    const emails = lookups
      .map(r => (r.status === 'fulfilled' ? r.value.data.user?.email : null))
      .filter((e): e is string => !!e);

    const uniqueEmails = Array.from(new Set(emails));

    if (uniqueEmails.length > 1) {
      console.log(`Found ${uniqueEmails.length} users with phone number:`, phone_number);
      return new Response(
        JSON.stringify({ 
          emails: uniqueEmails,
          multipleAccounts: true
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Single match found
    console.log(`Resolved email for phone number:`, phone_number);
    return new Response(
      JSON.stringify({ 
        email: uniqueEmails[0],
        multipleAccounts: false 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in resolve-login-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
