import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Where a buyer is sent after paying. It must be an origin WE control and
// that has a /checkout-success route, which is why this is not taken from
// the request's Origin header: for a Buy Now button pasted into a customer's
// own website, that header is the customer's domain, and sending a paying
// buyer to `their-shop.com/checkout-success` lands them on a 404 on a site
// that has never heard of us. Matches store-checkout's SITE_URL handling.
const SITE_URL = (Deno.env.get("SITE_URL") || "https://quooro.com").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  try {
    const body = await req.json();

    // ---------------------------------------------------------------
    // verify: called by /checkout-success once Stripe sends the buyer
    // back. Payment is confirmed against Stripe here, server-side. The
    // return redirect alone proves nothing - anyone can open that URL
    // with any session id - so the order is only marked paid after
    // Stripe itself says payment_status === "paid".
    // ---------------------------------------------------------------
    if (body?.action === "verify") {
      const { session_id } = body;
      if (!session_id) return json({ error: "session_id required" }, 400);

      const { data: order } = await supabaseAdmin
        .from("site_orders")
        .select("id, order_number, status, total, currency, items, customer_email, payment_intent_id")
        .eq("payment_intent_id", session_id)
        .maybeSingle();

      if (!order) return json({ error: "Order not found" }, 404);
      if (order.status === "paid") return json({ paid: true, order: publicOrder(order) });

      const cs = await stripe.checkout.sessions.retrieve(session_id);
      if (cs.payment_status !== "paid") {
        return json({ paid: false, order: publicOrder(order) });
      }

      // Stripe is the first place the buyer's email actually exists; the
      // order row was written before checkout opened.
      const email = cs.customer_details?.email || order.customer_email || null;
      await supabaseAdmin
        .from("site_orders")
        .update({ status: "paid", customer_email: email })
        .eq("id", order.id);

      return json({ paid: true, order: publicOrder({ ...order, status: "paid", customer_email: email }) });
    }

    // ---------------------------------------------------------------
    // default: open a Checkout session
    // ---------------------------------------------------------------
    const { site_id, items, visitor_email, success_url, cancel_url } = body;
    if (!site_id || !items?.length) throw new Error("site_id and items are required");

    // site_orders.user_id is NOT NULL and is the site owner - the merchant
    // being paid. It was never supplied before, so every insert here failed
    // its NOT NULL check, silently, while the buyer was still handed a
    // Stripe URL.
    const { data: site } = await supabaseAdmin
      .from("designer_sites")
      .select("id, user_id")
      .eq("id", site_id)
      .maybeSingle();
    if (!site) throw new Error("Site not found");

    // Products live in site_products - this read used to be against a
    // `products` table that the Designer never writes to, so it threw
    // "Products not found" on every single call and this checkout path had
    // never once reached Stripe.
    //
    // The .eq("site_id") is not redundant with .in("id"): site_id and the
    // product ids both arrive from the browser, and without it a caller
    // could name any product id in the database and buy another merchant's
    // stock at whatever price they had set.
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    const { data: products, error } = await supabaseAdmin
      .from("site_products")
      .select("id, name, price, currency, images")
      .eq("site_id", site_id)
      .in("id", productIds);

    if (error) throw new Error("Could not load products");
    if (!products?.length) throw new Error("Products not found");

    // Prices come from the database, never from the request body.
    const priced = items.map((item: { product_id: string; quantity?: number }) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return { product, quantity };
    });

    const lineItems = priced.map(({ product, quantity }) => {
      const imageUrl = (product.images as { url?: string }[] | null)?.[0]?.url || undefined;
      return {
        price_data: {
          currency: (product.currency || "gbp").toLowerCase(),
          product_data: {
            name: product.name,
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity,
      };
    });

    const subtotal = priced.reduce(
      (sum, { product, quantity }) => sum + Number(product.price) * quantity,
      0,
    );

    // Cancel returns the buyer where they came from - their own site is the
    // right place to land after backing out. Only success has to be ours.
    const origin = req.headers.get("origin") || SITE_URL;

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
      success_url:
        success_url || `${SITE_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || origin,
      metadata: { site_id },
    });

    const { data: orderNum } = await supabaseAdmin.rpc("generate_order_number");
    const { error: orderError } = await supabaseAdmin.from("site_orders").insert({
      site_id,
      user_id: site.user_id,
      order_number: orderNum || `ORD-${Date.now()}`,
      status: "pending",
      subtotal,
      total: subtotal,
      currency: products[0]?.currency || "GBP",
      items: priced.map(({ product, quantity }) => ({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
      })),
      // Holds the Checkout Session id, not a PaymentIntent id. The name is
      // inherited and wrong, but store-checkout's verify reads the same
      // column the same way, and one consistent misnomer beats two
      // conventions. Verification retrieves the session by this value.
      payment_intent_id: session.id,
      customer_email: visitor_email || null,
    });

    // Do not hand back a payment URL for an order we failed to record. A
    // buyer paying against a row that does not exist is money taken with
    // nothing to fulfil it, and that is exactly what used to happen here:
    // this insert's error was never even read.
    if (orderError) {
      console.error("[create-product-checkout] order insert failed:", orderError);
      return json({ error: "Could not record the order, so checkout was not opened." }, 500);
    }

    return json({ url: session.url });
  } catch (error) {
    console.error("[create-product-checkout] ERROR:", error);
    return json({ error: (error as Error).message }, 500);
  }
});

// Only what a buyer's own receipt screen needs. Deliberately omits site_id
// and user_id: the success page is public, reached with a Stripe session id,
// and has no business disclosing which merchant account is behind the store.
function publicOrder(o: Record<string, unknown>) {
  return {
    order_number: o.order_number,
    status: o.status,
    total: o.total,
    currency: o.currency,
    items: o.items,
    customer_email: o.customer_email,
  };
}
