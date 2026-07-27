import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Valid price IDs for all subscription features and plans
const VALID_PRICE_IDS = new Set([
  // Individual feature prices
  "price_1T2fYnRsdRM0b4FvLAVZg309", // Website Designer (individual)
  "price_1T2fZMRsdRM0b4FvF6LLq6VB", // CAD Studio (individual)
  "price_1T2fZtRsdRM0b4FvYHdsU3Mx", // Inventory Management (individual)
  // Bundled plan prices
  "price_1T2fm9RsdRM0b4Fv9eIY9AAa", // Professional Plan (Website Designer)
  "price_1T2fokRsdRM0b4Fv5NPeZ2gL", // Growth Plan (Website Designer + Inventory)
  "price_1T2fp1RsdRM0b4FvPQ19nd9c", // Enterprise Plan (all 3)
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Parse the price ID from request body
    let priceId: string | null = null;
    try {
      const body = await req.json();
      priceId = body?.priceId ?? null;
    } catch { /* no body */ }

    // Validate the price ID
    if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
      throw new Error("Invalid or missing priceId");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30,
      },
      success_url: `${req.headers.get("origin")}/lounge/billing`,
      cancel_url: `${req.headers.get("origin")}/lounge/billing`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
