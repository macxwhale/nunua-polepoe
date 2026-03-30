// Paystack Initialize Edge Function
// Called from frontend when user selects a plan
// Secrets needed: PAYSTACK_ENV, PAYSTACK_TEST_SECRET_KEY, PAYSTACK_PROD_SECRET_KEY
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_ENV = Deno.env.get("PAYSTACK_ENV") ?? "test";
const isProd = PAYSTACK_ENV === "prod";

const PAYSTACK_SECRET = isProd
  ? Deno.env.get("PAYSTACK_PROD_SECRET_KEY")!
  : Deno.env.get("PAYSTACK_TEST_SECRET_KEY")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!PAYSTACK_SECRET) {
  console.error(`ERROR: Missing ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"} secret.`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planCode, email, tenantId, amount } = await req.json();

    if (!PAYSTACK_SECRET) {
      return new Response(JSON.stringify({ 
        error: `Edge Function Secret Missing: ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"}. Please set it using 'supabase secrets set'.` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!planCode || !email || !tenantId) {
      const missing = [];
      if (!planCode) missing.push("planCode");
      if (!email) missing.push("email");
      if (!tenantId) missing.push("tenantId");
      return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email.endsWith("@owner.internal")) {
      return new Response(JSON.stringify({ 
        error: "Paystack requires a real email address for receipts. Please provide a valid email on the subscription page." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${PAYSTACK_ENV}] Initializing payment for tenant ${tenantId}, plan ${planCode}, email: ${email}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Fetch current subscription to check for proration/upgrade
    const { data: currentSub } = await supabase
      .from("tenant_subscriptions")
      .select("plan, next_payment_date, paystack_customer_code, paystack_subscription_code, status")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    let customerCode = currentSub?.paystack_customer_code;
    let finalAmount = amount; // default to full amount passed from frontend
    let isUpgrade = false;
    let creditAmount = 0;
    const oldSubCode = currentSub?.paystack_subscription_code;

    // 2. PRORATION LOGIC
    // Only prorate if they have an active subscription and are choosing a DIFFERENT plan
    if (currentSub?.status === 'active' && currentSub.plan !== planCode && currentSub.next_payment_date) {
      console.log(`[PRORATION] Calculating credit for switch from ${currentSub.plan} to ${planCode}`);
      
      const nextPayment = new Date(currentSub.next_payment_date);
      const now = new Date();
      const msRemaining = nextPayment.getTime() - now.getTime();
      const daysRemaining = Math.max(0, msRemaining / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        // Map plan codes back to their total prices to find the daily rate
        // (Matching Subscription.tsx values)
        const getPlanValues = (code: string) => {
          if (code.includes('vlmku5') || code.includes('my290e')) return { price: 170000, days: 30 };
          if (code.includes('u8qbn6') || code.includes('rgnlyd')) return { price: 960000, days: 180 };
          if (code.includes('cehf5d') || code.includes('sw7zn3')) return { price: 1700000, days: 365 };
          return { price: 170000, days: 30 };
        };

        const oldPlan = getPlanValues(currentSub.plan || '');
        const dailyRate = oldPlan.price / oldPlan.days;
        creditAmount = Math.floor(daysRemaining * dailyRate);
        
        // Calculate the difference
        // We charge the FULL amount of the new plan minus the remaining credit on the old plan
        finalAmount = Math.max(5000, amount - creditAmount); // Minimum KES 50.00
        isUpgrade = true;
        
        console.log(`[PRORATION] Days remaining: ${daysRemaining.toFixed(2)}, Credit: KES ${(creditAmount/100).toFixed(2)}, Final Charge: KES ${(finalAmount/100).toFixed(2)}`);
      }
    }

    // 3. If no customer code, create Paystack customer first
    if (!customerCode) {
      const customerRes = await fetch("https://api.paystack.co/customer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const customerData = await customerRes.json();
      if (customerData.status) {
        customerCode = customerData.data.customer_code;
      }
    }

    // Upsert the subscription record as pending
    await supabase.from("tenant_subscriptions").upsert({
      tenant_id: tenantId,
      plan: planCode,
      paystack_customer_code: customerCode,
      status: "pending",
    }, { onConflict: "tenant_id" });

    // 4. Initialize Transaction
    const initPayload: any = {
      email,
      amount: finalAmount,
      callback_url: `${req.headers.get("origin") ?? "https://lipiapole.com"}/subscription?status=success`,
      metadata: {
        tenant_id: tenantId,
        plan_code: planCode,
        paystack_env: PAYSTACK_ENV,
        is_prorated: isUpgrade,
        old_subscription_code: oldSubCode,
        credit_applied: creditAmount
      },
    };

    // If it's a normal checkout (not a mid-cycle switch), attach the plan directly
    // If it's an UPGRADE, we charge a one-time prorated amount FIRST, then switch the plan in the webhook
    if (!isUpgrade) {
      initPayload.plan = planCode;
    }

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(initPayload),
    });

    const initData = await initRes.json();

    if (!initData.status) {
      throw new Error(initData.message ?? "Paystack initialization failed");
    }

    return new Response(
      JSON.stringify({
        authorization_url: initData.data.authorization_url,
        reference: initData.data.reference,
        prorated: isUpgrade,
        pushed_amount: finalAmount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Initialize error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
