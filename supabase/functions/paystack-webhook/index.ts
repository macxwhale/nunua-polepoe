// Paystack Webhook Handler Edge Function
// Handles subscription lifecycle events from Paystack
// Set these secrets in Supabase: PAYSTACK_ENV, PAYSTACK_TEST_SECRET_KEY, PAYSTACK_PROD_SECRET_KEY
// plus the 6 plan code secrets below.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const PAYSTACK_ENV = Deno.env.get("PAYSTACK_ENV") ?? "test"; // "test" or "prod"
const isProd = PAYSTACK_ENV === "prod";

// Secret key — picked automatically based on PAYSTACK_ENV
const PAYSTACK_SECRET = isProd
  ? Deno.env.get("PAYSTACK_PROD_SECRET_KEY")!
  : Deno.env.get("PAYSTACK_TEST_SECRET_KEY")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!PAYSTACK_SECRET) {
  console.error(`ERROR: Missing ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"} secret.`);
}

serve(async (req: Request) => {
  if (!PAYSTACK_SECRET) {
    return new Response(JSON.stringify({ 
      error: `Edge Function Secret Missing: ${isProd ? "PAYSTACK_PROD_SECRET_KEY" : "PAYSTACK_TEST_SECRET_KEY"}. Please set it using 'supabase secrets set'.` 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify Paystack HMAC-SHA512 signature
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const hash = createHmac("sha512", PAYSTACK_SECRET).update(rawBody).digest("hex");

  if (hash !== signature) {
    console.error("Invalid Paystack signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log(`[${PAYSTACK_ENV}] Paystack webhook event:`, event.event);

  const getPlanType = (planCode: string) => {
    const code = planCode || '';
    if (code.includes('vlmku5sss7utuxa') || code.includes('my290etjxrvx3ua')) return 'monthly';
    if (code.includes('u8qbn62idpq9kl7') || code.includes('rgnlydjvh2bgjns')) return '6month';
    if (code.includes('cehf5d5o8ef8ixc') || code.includes('sw7zn39dmlxult4')) return '12month';
    return 'monthly'; // default
  };
  
  const getPlanLimits = (planType: string) => {
    switch (planType) {
      case 'monthly': return { max_users: 5, max_clients: 50, max_invoices_per_month: 100, max_products: 20 };
      case '6month': return { max_users: 15, max_clients: 500, max_invoices_per_month: 500, max_products: 100 };
      case '12month': return { max_users: 99999, max_clients: 99999, max_invoices_per_month: 99999, max_products: 99999 };
      default: return { max_users: 5, max_clients: 50, max_invoices_per_month: 100, max_products: 20 };
    }
  };

    try {
    switch (event.event) {
      case "charge.success":
      case "subscription.create": {
        const data = event.data;
        const customerCode = data.customer?.customer_code;
        
        let tenantId = data.metadata?.tenant_id ?? data.customer?.metadata?.tenant_id;
        
        // Paystack does not always copy transaction metadata to subscriptions. 
        // Fallback: look up the tenant_id via the customer code from charge.success.
        if (!tenantId && customerCode) {
          const { data: existingSub } = await supabase
            .from("tenant_subscriptions")
            .select("tenant_id")
            .eq("paystack_customer_code", customerCode)
            .single();
            
          if (existingSub) tenantId = existingSub.tenant_id;
        }

        if (!tenantId) {
          console.warn(`[${event.event}]: no tenant_id found in metadata or DB lookup for customer ${customerCode}`);
          break;
        }
        
        // Extract fields from various possible locations in Paystack payload
        let planCode = data.plan?.plan_code ?? data.metadata?.plan_code ?? data.plan_object?.plan_code;
        let subCode = data.subscription_code ?? data.subscription?.subscription_code ?? data.plan_object?.subscription_code;
        let nextPayDate = data.next_payment_date ?? data.subscription?.next_payment_date ?? data.plan_object?.next_payment_date;

        // If we are missing subCode on a charge success, actively fetch the subscription from Paystack
        if (!subCode && customerCode && event.event === 'charge.success') {
          console.log(`[${event.event}] subCode missing. Actively fetching active subscriptions for customer ${customerCode}...`);
          try {
            const res = await fetch(`https://api.paystack.co/subscription?customer=${customerCode}`, {
              headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            });
            if (res.ok) {
              const json = await res.json();
              if (json.data && json.data.length > 0) {
                // Find matching active subscription
                const activeSub = json.data.find((s: any) => s.status === 'active' && s.plan.plan_code === planCode);
                if (activeSub) {
                  subCode = activeSub.subscription_code;
                  nextPayDate = activeSub.next_payment_date;
                  console.log(`[${event.event}] Successfully fetched subCode from API:`, subCode);
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch subscription from Paystack API:", err);
          }
        }

        console.log(`[${event.event}] Extracted primary fields for tenant ${tenantId}:`, { planCode, subCode, nextPayDate, customerCode });

        // Retrieve existing subscription to safely fill in payload gaps (prevent plan downgrades)
        const { data: existingSub } = await supabase
          .from("tenant_subscriptions")
          .select("plan, paystack_subscription_code")
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (!planCode && existingSub?.plan) {
          planCode = existingSub.plan;
          console.log(`[${event.event}] Recovered missing planCode from existing DB row:`, planCode);
        }

        // --- UPGRADE/DOWNGRADE & PRORATION LOGIC ---
        const isProrated = data.metadata?.is_prorated === true;
        const oldSubCode = data.metadata?.old_subscription_code ?? existingSub?.paystack_subscription_code;

        // CASE A: Prorated Upgrade (User paid the difference)
        // We need to manually Disable the old sub and Start the new one
        if (isProrated && oldSubCode) {
          console.log(`[${event.event}] PRORATION SWITCH: ${oldSubCode} -> ${planCode}`);
          try {
            const oldRes = await fetch(`https://api.paystack.co/subscription/${oldSubCode}`, {
              headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            });
            const oldData = await oldRes.json();
            const emailToken = oldData.data?.email_token;

            if (emailToken) {
              await fetch("https://api.paystack.co/subscription/disable", {
                method: "POST",
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
                body: JSON.stringify({ code: oldSubCode, token: emailToken })
              });
              console.log(`[${event.event}] Disabled old plan: ${oldSubCode}`);
            }

            // Create the new recurring subscription using the authorization from this payment
            const authCode = data.authorization?.authorization_code;
            if (authCode && planCode) {
              const createRes = await fetch("https://api.paystack.co/subscription", {
                method: "POST",
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer: data.customer.customer_code,
                  plan: planCode,
                  authorization: authCode
                })
              });
              const newSub = await createRes.json();
              if (newSub.status) {
                subCode = newSub.data.subscription_code;
                nextPayDate = newSub.data.next_payment_date;
                console.log(`[${event.event}] Started new recurring subscription: ${subCode}`);
              }
            }
          } catch (err) {
            console.error(`[${event.event}] Proration switch failed:`, err);
          }
        }
        // CASE B: Standard Switch (User paid full price for a new plan)
        // Only trigger if we have a NEW subscription code and an OLD one to clean up
        else if (subCode && existingSub?.paystack_subscription_code && existingSub.paystack_subscription_code !== subCode) {
          console.log(`[${event.event}] Standard Upgrade/Downgrade: Disabling ${existingSub.paystack_subscription_code}...`);
          try {
            const oldRes = await fetch(`https://api.paystack.co/subscription/${existingSub.paystack_subscription_code}`, {
              headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            });
            const oldData = await oldRes.json();
            const emailToken = oldData.data?.email_token;

            if (emailToken) {
              await fetch("https://api.paystack.co/subscription/disable", {
                method: "POST",
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
                body: JSON.stringify({ code: existingSub.paystack_subscription_code, token: emailToken })
              });
              console.log(`[${event.event}] Automatically disabled orphaned subscription: ${existingSub.paystack_subscription_code}`);
            }
          } catch (cancelErr) {
            console.error(`[${event.event}] Error canceling older subscription ${existingSub.paystack_subscription_code}:`, cancelErr);
          }
        }
        // -------------------------------------------

        const planType = getPlanType(planCode || '');
        const limits = getPlanLimits(planType);

        // Build a dynamic payload so we do NOT overwrite existing valid data with NULL
        const updatePayload: any = {
          tenant_id: tenantId,
          status: "active",
          cancelled_at: null,
          updated_at: new Date().toISOString(),
          max_users: limits.max_users,
          max_clients: limits.max_clients,
          max_invoices_per_month: limits.max_invoices_per_month,
          max_products: limits.max_products
        };

        if (planCode) updatePayload.plan = planCode;
        if (customerCode) updatePayload.paystack_customer_code = customerCode;
        if (subCode) updatePayload.paystack_subscription_code = subCode;
        if (nextPayDate) {
          updatePayload.next_payment_date = nextPayDate;
          updatePayload.expires_at = nextPayDate;
        }

        // ---------- HISTORICAL BILLING LOGGING ----------
        // Only explicitly log a history line for the exact moment money moved successfully
        if (event.event === "charge.success") {
          const rawAmount = data.amount || 0;
          const currency = data.currency || "KES";
          const reference = data.reference;

          if (rawAmount > 0 && reference) {
            // Paystack amount is generally sent in minimum units (e.g. kobo/cents) -> Divide by 100
            const actualAmount = rawAmount / 100;
            console.log(`[${event.event}] Logging historical payment: ${actualAmount} ${currency} (Ref: ${reference})`);
            
            const { error: historyErr } = await supabase.from("subscription_billing_history").insert({
              tenant_id: tenantId,
              event_type: "charge.success",
              paystack_reference: reference,
              amount: actualAmount,
              currency: currency,
              status: "success",
              plan_code: planCode,
              paystack_subscription_code: subCode
            });

            if (historyErr) {
              console.error(`[${event.event}] Failed to log historical billing history:`, historyErr);
            }
          }
        }
        // ------------------------------------------------

        const { error: upsertError } = await supabase.from("tenant_subscriptions").upsert(
          updatePayload, 
          { onConflict: "tenant_id" }
        );

        if (upsertError) {
          console.error("Upsert failed:", upsertError);
          throw upsertError;
        }

        // MASTER SYNC: Activate features
        await syncTenantData(supabase, tenantId, planCode, true);
        break;
      }

      case "invoice.payment": {
        const data = event.data;
        const subCode = data.subscription_code ?? data.subscription?.subscription_code;
        const nextPayDate = data.next_payment_date ?? data.subscription?.next_payment_date;
        if (!subCode) break;

        const { data: sub } = await supabase
          .from("tenant_subscriptions")
          .select("tenant_id, plan")
          .eq("paystack_subscription_code", subCode)
          .single();

        await supabase
          .from("tenant_subscriptions")
          .update({
            status: "active",
            next_payment_date: nextPayDate,
            expires_at: nextPayDate,
            updated_at: new Date().toISOString()
          })
          .eq("paystack_subscription_code", subCode);

        if (sub) await syncTenantData(supabase, sub.tenant_id, sub.plan, true);
        break;
      }

      case "invoice.payment_failed": {
        const data = event.data;
        const subscriptionCode = data.subscription?.subscription_code;
        if (!subscriptionCode) break;

        await supabase
          .from("tenant_subscriptions")
          .update({ status: "past_due" })
          .eq("paystack_subscription_code", subscriptionCode);

        console.log(`Payment FAILED for subscription ${subscriptionCode}`);
        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const data = event.data;
        const subCode = data.subscription_code ?? data.subscription?.subscription_code;
        if (!subCode) break;

        const { data: sub } = await supabase
          .from("tenant_subscriptions")
          .select("tenant_id, plan")
          .eq("paystack_subscription_code", subCode)
          .single();

        await supabase
          .from("tenant_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("paystack_subscription_code", subCode);

        // MASTER SYNC: Deactivate features
        if (sub) await syncTenantData(supabase, sub.tenant_id, sub.plan, false);
        break;
      }

      default:
        console.log("Unhandled Paystack event:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * MASTER SYNC: Updates feature flags and metrics based on plan status.
 */
async function syncTenantData(supabase: any, tenantId: string, planCode: string | null, isActive: boolean) {
  console.log(`Syncing data for tenant ${tenantId} (Plan: ${planCode}, Active: ${isActive})`);
  
  const getPlanType = (code: string) => {
    if (code.includes('vlmku5sss7utuxa') || code.includes('my290etjxrvx3ua')) return 'monthly';
    if (code.includes('u8qbn62idpq9kl7') || code.includes('rgnlydjvh2bgjns')) return '6month';
    if (code.includes('cehf5d5o8ef8ixc') || code.includes('sw7zn39dmlxult4')) return '12month';
    return 'monthly'; // default
  };

  const planType = getPlanType(planCode || '');
  const isPro = isActive && (planType === '6month' || planType === '12month');
  const isElite = isActive && planType === '12month';

  const flags = [
    { name: 'reports', enabled: isPro },
    { name: 'prioritySupport', enabled: isPro },
    { name: 'bulkOps', enabled: isElite },
    { name: 'customBranding', enabled: isElite },
    { name: 'accountManager', enabled: isElite },
    { name: 'invoicing', enabled: isActive },
    { name: 'clients', enabled: isActive },
  ];

  for (const flag of flags) {
    await supabase.from("tenant_feature_flags").upsert({
      tenant_id: tenantId,
      flag_name: flag.name,
      is_enabled: flag.enabled,
      updated_at: new Date().toISOString()
    }, { onConflict: "tenant_id,flag_name" });
  }

  // Update Period & Sync Metrics Basics
  await supabase.from("tenant_usage_metrics").upsert({
    tenant_id: tenantId,
    period_start: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  }, { onConflict: "tenant_id,period_start" });
}
