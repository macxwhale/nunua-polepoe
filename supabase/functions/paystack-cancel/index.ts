// Cancel Subscription Edge Function
// Secrets needed: PAYSTACK_ENV, PAYSTACK_TEST_SECRET_KEY, PAYSTACK_PROD_SECRET_KEY
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PAYSTACK_ENV = Deno.env.get("PAYSTACK_ENV") ?? "test";
const isProd = PAYSTACK_ENV === "prod";

const PAYSTACK_SECRET = isProd
  ? Deno.env.get("PAYSTACK_PROD_SECRET_KEY")!
  : Deno.env.get("PAYSTACK_TEST_SECRET_KEY")!;

if (!PAYSTACK_SECRET) {
  console.error(`ERROR: Missing ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"} secret.`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!PAYSTACK_SECRET) {
    return new Response(JSON.stringify({ 
      error: `Edge Function Secret Missing: ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"}. Please set it using 'supabase secrets set'.` 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { subscriptionCode } = await req.json();

    if (!subscriptionCode) {
      throw new Error("Missing subscriptionCode");
    }

    console.log(`[${PAYSTACK_ENV}] Cancelling subscription ${subscriptionCode}`);

    // 1. Fetch the subscription to get the required email_token
    const subRes = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}`, {
       headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const subData = await subRes.json();
    
    if (!subData.status) {
      throw new Error(subData.message || "Failed to fetch subscription details from Paystack");
    }

    const emailToken = subData.data?.email_token;
    if (!emailToken) {
      throw new Error("Could not find secure email token for this subscription");
    }

    // 2. Transmit the disable request
    const res = await fetch("https://api.paystack.co/subscription/disable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
