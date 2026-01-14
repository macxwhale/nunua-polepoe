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
    
    // Send SMS with new PIN via Africa's Talking
    let smsSent = false;
    try {
      console.log("Sending password reset SMS via Africa's Talking...");
      const atApiKey = Deno.env.get("AT_SMS_API_KEY");
      const atUsername = Deno.env.get("AT_SMS_USERNAME");
      const atSenderId = Deno.env.get("AT_SMS_SENDER_ID");
      const atAllowlist = Deno.env.get("AT_SMS_ALLOWLIST");

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

      if (atApiKey && atUsername) {
        // Format phone number for Africa's Talking (needs +254 format)
        const formattedPhone = phone_number.startsWith("0") 
          ? `+254${phone_number.substring(1)}` 
          : phone_number;

        // Check allowlist before sending
        if (!isPhoneAllowed(phone_number, atAllowlist)) {
          console.log(`SMS skipped: ${phone_number} not in allowlist`);
        } else {
          const smsMessage = `Lipia Pole Pole: Your password has been reset.\nNew PIN: ${newPin}\nLogin: https://lipapolepole.com\nKeep this PIN secure.`;

          const smsPayload: Record<string, unknown> = {
            username: atUsername,
            message: smsMessage,
            phoneNumbers: [formattedPhone],
          };

          if (atSenderId) {
            smsPayload.senderId = atSenderId;
          }

          console.log("SMS payload:", JSON.stringify({ ...smsPayload, message: "[REDACTED]" }));

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
          console.log("SMS API raw response:", responseText);

          if (!smsResponse.ok) {
            console.error("SMS API error:", smsResponse.status, responseText);
          } else {
            try {
              const smsResult = JSON.parse(responseText);
              if (smsResult.SMSMessageData?.Recipients?.[0]?.status === "Success") {
                console.log("SMS sent successfully to:", formattedPhone);
                smsSent = true;
              } else {
                console.error("SMS sending failed:", smsResult);
              }
            } catch {
              console.error("Failed to parse SMS response:", responseText);
            }
          }
        }
      } else {
        console.warn("Africa's Talking credentials not configured (AT_SMS_API_KEY, AT_SMS_USERNAME), skipping SMS notification");
      }
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
    }

    // Return appropriate response based on SMS status
    const baseMessage = userIds.length > 1 
      ? `Password reset for ${userIds.length} accounts with this phone number.`
      : 'Password reset successfully.';
    
    const smsStatus = smsSent 
      ? ' Check your SMS for your new PIN.'
      : ' SMS delivery may be delayed. If you don\'t receive it, contact support.';

    return new Response(
      JSON.stringify({ 
        success: true,
        message: baseMessage + smsStatus,
        accountCount: userIds.length,
        smsSent
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
