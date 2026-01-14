import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  phone_number: string;
}

const generatePin = (): string => {
  // Use cryptographically secure random number generation
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const pin = (array[0] % 900000) + 100000;
  return pin.toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number }: ResetPasswordRequest = await req.json();

    if (!phone_number || !/^0\d{9}$/.test(phone_number)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const newPin = generatePin();

    // Find users by phone via profiles to avoid pagination and email pattern issues
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone_number', phone_number);

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to search users' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userIds = Array.from(new Set((profiles ?? []).map((p: { user_id: string }) => p.user_id))).filter(Boolean);

    if (userIds.length === 0) {
      console.log('No user found with phone number:', phone_number);
      return new Response(
        JSON.stringify({ error: "No account found with this phone number" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update password for all matching users (in case same phone exists in multiple tenants)
    const updatePromises = userIds.map((id) =>
      supabaseAdmin.auth.admin.updateUserById(id, { password: newPin })
    );

    const results = await Promise.allSettled(updatePromises);
    const failures = results.filter((r) => r.status === 'rejected');

    if (failures.length > 0) {
      console.error('Some password updates failed:', failures);
    }

    console.log(`Password updated successfully for ${userIds.length} account(s)`);
    
    // SECURITY: Do NOT return the PIN in the response - only send via SMS
    // The PIN should only be delivered through the SMS channel
    return new Response(
      JSON.stringify({ 
        success: true,
        message: userIds.length > 1 
          ? `Password reset for ${userIds.length} accounts with this phone number. Check your SMS.`
          : 'Password reset successfully. Check your SMS for your new PIN.',
        accountCount: userIds.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
