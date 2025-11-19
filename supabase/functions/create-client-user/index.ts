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

    // Create auth user
    console.log("Creating auth user...");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

    if (error) {
      console.error("Auth user creation failed:", error);
      
      // Sanitize error message for client with detailed logging
      let clientMessage = 'Failed to create client account';
      let statusCode = 400;
      
      if (error.message?.includes('already been registered') || error.message?.includes('already exists') || error.code === 'email_exists') {
        clientMessage = 'A client with this phone number already exists for this business';
        statusCode = 409; // Conflict
      } else if (error.message?.includes('Invalid') || error.message?.includes('invalid')) {
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

    console.log("Auth user created successfully:", data.user!.id);

    // Create profile for the client user
    console.log("Creating profile...");
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

    console.log("Profile created successfully");

    // Assign client role
    console.log("Assigning client role...");
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

    console.log("Client role assigned successfully");

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
