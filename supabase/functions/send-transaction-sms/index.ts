// Send SMS notification for transactions (sales and top-ups)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionSmsRequest {
  clientId: string;
  type: 'sale' | 'payment';
  amount: number;
  invoiceNumber?: string;
  productName?: string;
  newBalance?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Authentication check - verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create a client with the user's token to verify authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Token verification failed:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Get user's tenant from profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Failed to get user profile:", profileError);
      return new Response(JSON.stringify({ error: 'Unauthorized - no profile found' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TransactionSmsRequest = await req.json();
    const { clientId, type, amount, invoiceNumber, productName, newBalance } = body;

    console.log("Received SMS request:", { clientId, type, amount, invoiceNumber, productName });

    if (!clientId || !type || amount === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = supabaseAdmin;

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("phone_number, name, tenant_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      console.error("Failed to fetch client:", clientError);
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization check - verify caller has access to this client's tenant
    if (client.tenant_id !== userProfile.tenant_id) {
      console.error("Tenant mismatch - user tenant:", userProfile.tenant_id, "client tenant:", client.tenant_id);
      return new Response(JSON.stringify({ error: 'Forbidden - not authorized for this client' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch tenant/business details
    const { data: tenant } = await supabase
      .from("tenants")
      .select("business_name")
      .eq("id", client.tenant_id)
      .single();

    const businessName = tenant?.business_name || "Lipia Pole Pole";
    const clientName = client.name || "Customer";
    const phoneNumber = client.phone_number;

    console.log("Client details:", { phoneNumber, clientName, businessName });

    // Check SMS allowlist
    const atApiKey = Deno.env.get("AT_SMS_API_KEY");
    const atUsername = Deno.env.get("AT_SMS_USERNAME");
    const atSenderId = Deno.env.get("AT_SMS_SENDER_ID");
    const atAllowlist = Deno.env.get("AT_SMS_ALLOWLIST");

    if (!atApiKey || !atUsername) {
      console.log("SMS not configured (missing API key or username)");
      return new Response(JSON.stringify({ 
        success: true, 
        sms_sent: false, 
        reason: "SMS not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper function to check if phone is in allowlist
    const isPhoneAllowed = (phone: string, allowlist: string | undefined): boolean => {
      if (!allowlist || allowlist.trim() === '') {
        console.log("SMS allowlist not configured, skipping SMS");
        return false;
      }
      if (allowlist.trim() === '*') {
        console.log("SMS allowlist set to *, sending to all");
        return true;
      }
      const allowedNumbers = allowlist.split(',').map(n => n.trim());
      const phoneVariants = [
        phone,
        phone.startsWith("0") ? `+254${phone.substring(1)}` : phone,
        phone.startsWith("+254") ? `0${phone.substring(4)}` : phone,
      ];
      const isAllowed = phoneVariants.some(variant => allowedNumbers.includes(variant));
      console.log(`Phone ${phone} allowlist check: ${isAllowed ? 'ALLOWED' : 'NOT ALLOWED'}`);
      return isAllowed;
    };

    if (!isPhoneAllowed(phoneNumber, atAllowlist)) {
      console.log(`SMS skipped: ${phoneNumber} not in allowlist`);
      return new Response(JSON.stringify({ 
        success: true, 
        sms_sent: false, 
        reason: "Phone not in allowlist" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone number for Africa's Talking
    const formattedPhone = phoneNumber.startsWith("0") 
      ? `+254${phoneNumber.substring(1)}` 
      : phoneNumber;

    // Build SMS message based on type
    let smsMessage: string;
    const formattedAmount = `KSH ${amount.toLocaleString()}`;

    if (type === 'sale') {
      smsMessage = `${businessName}: Dear ${clientName}, a new invoice of ${formattedAmount} has been added to your account${productName ? ` for ${productName}` : ''}${invoiceNumber ? ` (Invoice: ${invoiceNumber})` : ''}. Please pay at your convenience.`;
    } else {
      // payment/top-up
      smsMessage = `${businessName}: Dear ${clientName}, we have received your payment of ${formattedAmount}${invoiceNumber ? ` for Invoice ${invoiceNumber}` : ''}. Thank you for your payment!${newBalance !== undefined ? ` Your remaining balance is KSH ${newBalance.toLocaleString()}.` : ''}`;
    }

    console.log("SMS message:", smsMessage);

    // Send SMS via Africa's Talking
    const smsPayload: Record<string, unknown> = {
      username: atUsername,
      message: smsMessage,
      phoneNumbers: [formattedPhone],
    };

    if (atSenderId) {
      smsPayload.senderId = atSenderId;
    }

    console.log("Sending SMS via Africa's Talking...");

    const smsResponse = await fetch("https://api.africastalking.com/version1/messaging/bulk", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "apiKey": atApiKey,
      },
      body: JSON.stringify(smsPayload),
    });

    const responseText = await smsResponse.text();
    console.log("SMS API response:", responseText);

    if (!smsResponse.ok) {
      console.error("SMS API error:", smsResponse.status, responseText);
      return new Response(JSON.stringify({ 
        success: true, 
        sms_sent: false, 
        reason: `SMS API error: ${smsResponse.status}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smsResult = JSON.parse(responseText);
    console.log("SMS sent successfully:", smsResult);

    return new Response(JSON.stringify({ 
      success: true, 
      sms_sent: true,
      sms_result: smsResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in send-transaction-sms:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
