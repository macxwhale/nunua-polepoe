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
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    // Search for all users matching this phone number
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: "Failed to search users" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Find all users matching the phone number pattern
    // Supports both new format (phone-tenantId@client.internal) and legacy formats
    const matchingUsers = allUsers.users.filter(u => {
      if (!u.email) return false;
      
      // New format: phoneNumber-tenantId@client.internal
      const newClientPattern = new RegExp(`^${phone_number}-[^-]+@client\\.internal$`);
      // Legacy format: phoneNumber@client.internal or phoneNumber@owner.internal
      const legacyClientEmail = `${phone_number}@client.internal`;
      const ownerEmail = `${phone_number}@owner.internal`;
      
      return newClientPattern.test(u.email) || u.email === legacyClientEmail || u.email === ownerEmail;
    });

    if (matchingUsers.length === 0) {
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
    const updatePromises = matchingUsers.map(user => 
      supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPin })
    );

    const results = await Promise.allSettled(updatePromises);
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      console.error('Some password updates failed:', failures);
    }

    console.log(`Password updated successfully for ${matchingUsers.length} account(s)`);
    return new Response(
      JSON.stringify({ 
        pin: newPin,
        message: matchingUsers.length > 1 
          ? `Password reset for ${matchingUsers.length} accounts with this phone number`
          : 'Password reset successfully',
        accountCount: matchingUsers.length
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
