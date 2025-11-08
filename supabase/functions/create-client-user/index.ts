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

    const { email, password, metadata, tenantId, phoneNumber } = validationResult.data;
    console.log("Creating client user with phone:", phoneNumber);

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
      
      // Sanitize error message for client
      let clientMessage = 'Failed to create client user';
      if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
        clientMessage = 'A client with this phone number already exists';
      }
      
      return new Response(JSON.stringify({ error: clientMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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
      await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
      
      let clientMessage = 'Failed to create client profile';
      if (profileError.message?.includes('duplicate') || profileError.message?.includes('already exists')) {
        clientMessage = 'Client profile already exists';
      }
      
      return new Response(JSON.stringify({ error: clientMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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
      await supabaseAdmin.from("profiles").delete().eq("user_id", data.user!.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
      
      let clientMessage = 'Failed to assign client role';
      if (roleError.message?.includes('duplicate') || roleError.message?.includes('already exists')) {
        clientMessage = 'Client role already assigned';
      }
      
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
    console.error("Unexpected error:", msg);
    
    // Sanitize error message for client
    let clientMessage = 'Failed to create client user';
    if (e instanceof Error) {
      if (e.message.includes('duplicate') || e.message.includes('already exists')) {
        clientMessage = 'User already exists';
      } else if (e.message.includes('foreign key') || e.message.includes('Invalid')) {
        clientMessage = 'Invalid data provided';
      }
    }
    
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
