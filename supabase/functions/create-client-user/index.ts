// Create client auth user without affecting current session
// Uses service role to call Admin API safely on the server
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const createClientSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255, 'Password too long'),
  phoneNumber: z.string().regex(/^0\d{9}$/, 'Phone number must be 10 digits starting with 0'),
  tenantId: z.string().uuid('Invalid tenant ID'),
  metadata: z.record(z.any()).optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createClientSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.issues);
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validationResult.error.issues 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { password, metadata, tenantId, phoneNumber } = validationResult.data;
    // Create tenant-specific email format: phoneNumber-tenantId@client.internal
    const email = `${phoneNumber}-${tenantId}@client.internal`;
    console.log("Creating client user with phone:", phoneNumber, "and email:", email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to create auth user, or retrieve if already exists
    console.log("Creating or retrieving auth user...");
    let { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

    // If user already exists, retrieve the existing user
    if (error && (error.message?.includes('already been registered') || error.message?.includes('already exists') || error.code === 'email_exists')) {
      console.log("User already exists, retrieving existing user...");
      
      // Get the user by email
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error("Failed to retrieve existing user:", listError);
        return new Response(JSON.stringify({ error: 'Failed to retrieve existing user account' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      const existingUser = users.find(u => u.email === email);
      
      if (!existingUser) {
        console.error("User email exists but could not find user in list");
        return new Response(JSON.stringify({ error: 'User account exists but could not be retrieved' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // Update password for existing user
      console.log("Updating password for existing user:", existingUser.id);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );
      
      if (updateError) {
        console.error("Failed to update password:", updateError);
        return new Response(JSON.stringify({ error: 'Failed to update account password' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      data = { user: existingUser };
    } else if (error) {
      // Handle other errors
      console.error("Auth user creation failed:", error);
      
      let clientMessage = 'Failed to create client account';
      let statusCode = 400;
      
      if (error.message?.includes('Invalid') || error.message?.includes('invalid')) {
        clientMessage = 'Invalid phone number or data format';
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        clientMessage = 'Network error. Please check your connection and try again';
        statusCode = 503;
      } else if (error.status && error.status >= 500) {
        clientMessage = 'Server error. Please try again later';
        statusCode = 500;
      }
      
      console.error("Returning client error:", clientMessage, "Status:", statusCode);
      
      return new Response(JSON.stringify({ error: clientMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    console.log("Auth user ready:", data.user!.id);

    // Create profile for the client user (check if already exists)
    console.log("Creating or updating profile...");
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select()
      .eq("user_id", data.user!.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Failed to check existing profile:", profileCheckError);
    }

    if (existingProfile) {
      console.log("Profile already exists, updating...");
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({
          tenant_id: tenantId,
          full_name: phoneNumber,
          phone_number: phoneNumber,
        })
        .eq("user_id", data.user!.id);

      if (profileUpdateError) {
        console.error("Profile update failed:", profileUpdateError);
      }
    } else {
      console.log("Creating new profile...");
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: data.user!.id,
          tenant_id: tenantId,
          full_name: phoneNumber,
          phone_number: phoneNumber,
        });

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        // Rollback: delete the auth user if profile creation fails
        console.log("Rolling back auth user creation due to profile error");
        await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
        
        let clientMessage = 'Failed to create client profile';
        let statusCode = 400;
        
        if (profileError.message?.includes('duplicate') || profileError.message?.includes('already exists') || profileError.code === '23505') {
          clientMessage = 'Client profile already exists for this phone number';
          statusCode = 409;
        } else if (profileError.message?.includes('foreign key') || profileError.code === '23503') {
          clientMessage = 'Invalid tenant reference. Please contact support';
        } else if (profileError.message?.includes('not null') || profileError.code === '23502') {
          clientMessage = 'Missing required information';
        }
        
        console.error("Returning profile error:", clientMessage, "Status:", statusCode);
        
        return new Response(JSON.stringify({ error: clientMessage }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: statusCode,
        });
      }
    }

    console.log("Profile ready");

    // Assign client role (check if already exists)
    console.log("Assigning client role...");
    const { data: existingRole, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select()
      .eq("user_id", data.user!.id)
      .single();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Failed to check existing role:", roleCheckError);
    }

    if (!existingRole) {
      console.log("Creating role assignment...");
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: data.user!.id,
          role: 'client',
        });

      if (roleError) {
        console.error("Role assignment failed:", roleError);
        // Rollback: delete profile and auth user
        console.log("Rolling back profile and auth user due to role assignment error");
        await supabaseAdmin.from("profiles").delete().eq("user_id", data.user!.id);
        await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
        
        let clientMessage = 'Failed to assign client permissions';
        if (roleError.message?.includes('duplicate') || roleError.code === '23505') {
          clientMessage = 'Client role already assigned';
        }
        
        console.error("Returning role error:", clientMessage);
        
        return new Response(JSON.stringify({ error: clientMessage }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      console.log("Role already assigned");
    }

    console.log("Client role ready");

    // Send notification via Telegram
    try {
      console.log("Sending notification to Telegram...");
      const notificationBody = {
        channel: "telegram",
        title: "🎉 *New Client Created*",
        body: `✅ *Client account successfully created!*\n\n👤 *Username:* ${phoneNumber}\n🔐 *PIN:* ${password}\n\n📱 *Phone:* ${phoneNumber}\n🕒 *Created:* ${new Date().toLocaleString()}\n\n_Please share these credentials with the client._`,
        format: "markdown",
        notify_type: "success",
        silent: false,
        attach: [""]
      };

      const notificationResponse = await fetch('https://notify-woi3.onrender.com/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ZbYKwD74cqfPMdmT7ksL9ql3S0cdh5jp'
        },
        body: JSON.stringify(notificationBody)
      });

      if (notificationResponse.ok) {
        const notificationResult = await notificationResponse.json();
        console.log("Notification sent successfully:", notificationResult);
      } else {
        console.error("Failed to send notification:", await notificationResponse.text());
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error("Error sending notification:", notificationError);
    }

    // Send SMS notification via Africa's Talking
    try {
      console.log("Sending SMS notification via Africa's Talking...");
      const atApiKey = Deno.env.get("AT_API_KEY");
      const atUsername = Deno.env.get("AT_USERNAME");

      if (atApiKey && atUsername) {
        // Format phone number for Africa's Talking (needs +254 format)
        const formattedPhone = phoneNumber.startsWith("0") 
          ? `+254${phoneNumber.substring(1)}` 
          : phoneNumber;

        const smsMessage = `Lipia Pole Pole:\nUsername: ${phoneNumber}\nPassword: ${password}\nLogin: https://lipapolepole.com\nChange your password after first login.`;

        const smsBody = new URLSearchParams({
          username: atUsername,
          to: formattedPhone,
          message: smsMessage,
        });

        const smsResponse = await fetch("https://api.africastalking.com/version1/messaging", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "apiKey": atApiKey,
          },
          body: smsBody.toString(),
        });

        if (smsResponse.ok) {
          const smsResult = await smsResponse.json();
          console.log("SMS sent successfully:", smsResult);
        } else {
          const smsError = await smsResponse.text();
          console.error("Failed to send SMS:", smsError);
        }
      } else {
        console.warn("Africa's Talking credentials not configured, skipping SMS notification");
      }
    } catch (smsError) {
      // Don't fail the request if SMS fails
      console.error("Error sending SMS:", smsError);
    }

    return new Response(
      JSON.stringify({ userId: data.user?.id, email: data.user?.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error');
    console.error("Unexpected error in create-client-user:", msg);
    if (e instanceof Error) {
      console.error("Error details:", e.stack);
    }
    
    // Sanitize error message for client
    let clientMessage = 'An unexpected error occurred while creating the client account';
    if (e instanceof Error) {
      // Don't expose internal error details to client
      if (e.message?.includes('fetch') || e.message?.includes('network')) {
        clientMessage = 'Network error. Please check your connection and try again';
      } else if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
        clientMessage = 'A client with this information already exists';
      } else if (e.message?.includes('foreign key') || e.message?.includes('Invalid')) {
        clientMessage = 'Invalid data provided. Please check your input';
      }
    }
    
    console.error("Returning error to client:", clientMessage);
    
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
