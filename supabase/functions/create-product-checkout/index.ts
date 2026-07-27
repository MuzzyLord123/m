import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { site_id, items, visitor_email, success_url, cancel_url } = await req.json();
    if (!site_id || !items?.length) throw new Error("site_id and items are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch products from DB
    const productIds = items.map((i: any) => i.product_id);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, price, currency, images")
      .in("id", productIds);

    if (error || !products?.length) throw new Error("Products not found");

    // Build line items
    const lineItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      const imageUrl = product.images?.[0]?.url || undefined;
      return {
        price_data: {
          currency: (product.currency || "gbp").toLowerCase(),
          product_data: {
            name: product.name,
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity || 1,
      };
    });

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Check for existing Stripe customer
    let customerId: string | undefined;
    if (visitor_email) {
      const customers = await stripe.customers.list({ email: visitor_email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : visitor_email || undefined,
      line_items: lineItems,
      mode: "payment",
      success_url: success_url || `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || origin,
      metadata: { site_id },
    });

    // Create order record
    const { data: orderNum } = await supabaseAdmin.rpc("generate_order_number");
    await supabaseAdmin.from("site_orders").insert({
      site_id,
      visitor_id: null,
      order_number: orderNum || `ORD-${Date.now()}`,
      status: "pending",
      total_amount: items.reduce((sum: number, item: any) => {
        const p = products.find((pr: any) => pr.id === item.product_id);
        return sum + (p?.price || 0) * (item.quantity || 1);
      }, 0),
      currency: products[0]?.currency || "GBP",
      items: items.map((item: any) => {
        const p = products.find((pr: any) => pr.id === item.product_id);
        return { product_id: item.product_id, name: p?.name, price: p?.price, quantity: item.quantity || 1 };
      }),
      payment_intent_id: session.payment_intent as string,
      customer_email: visitor_email || null,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-product-checkout] ERROR:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
