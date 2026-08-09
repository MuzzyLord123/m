// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = (Deno.env.get('SITE_URL') || 'https://quooro.com').replace(/\/$/, '');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });

interface CartItem { id: string; qty: number; }
interface CreatePayload {
  user_id: string;
  items: CartItem[];
  return_url?: string;
  customer?: {
    email?: string; name?: string; phone?: string;
    address?: { line1?: string; line2?: string; city?: string; postal_code?: string; country?: string; };
  };
}

/* Public projection of an order for the pay page: everything a customer
   may see, and nothing else. The raw row's metadata carries internal
   URLs; the settings row carries the merchant's Stripe secret. Neither
   ever leaves this function. */
function publicOrder(o: any) {
  return {
    id: o.id,
    order_number: o.order_number ?? null,
    status: o.status,
    payment_status: o.payment_status,
    payment_provider: o.payment_provider,
    customer_email: o.customer_email,
    customer_name: o.customer_name,
    items: o.items,
    currency: o.currency,
    subtotal: o.subtotal,
    shipping_cost: o.shipping_cost,
    tax_amount: o.tax_amount,
    total: o.total,
    created_at: o.created_at,
    store_name: o.metadata?.store_name ?? null,
    accent: o.metadata?.checkout_accent ?? null,
    success_url: o.metadata?.success_url ?? null,
    /* legacy /checkout page reads these off metadata - keep only the safe keys */
    metadata: { store_name: o.metadata?.store_name ?? null, checkout_accent: o.metadata?.checkout_accent ?? null },
  };
}

/* Stripe REST, form-encoded - no SDK needed in an edge function. */
function form(data: Record<string, string>) {
  return Object.entries(data).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
}
async function stripe(key: string, method: 'GET' | 'POST', path: string, body?: Record<string, string>) {
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method,
    headers: {
      authorization: 'Bearer ' + key,
      ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? form(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe request failed');
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const action = parts[parts.length - 1] || '';

  try {
    const supa = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

    // ---- Create an order session from a cart ----
    if (req.method === 'POST' && (action === 'session' || action === 'store-checkout')) {
      const body: CreatePayload = await req.json();
      if (!body.user_id || !Array.isArray(body.items) || !body.items.length) {
        return json({ error: 'user_id and items required' }, 400);
      }
      const ids = body.items.map(i => i.id);
      const { data: prods, error: perr } = await supa
        .from('products')
        .select('id,name,price,currency,images,status,inventory_count,track_inventory')
        .in('id', ids);
      if (perr) return json({ error: perr.message }, 500);
      const priceMap = new Map((prods ?? []).map((p: any) => [p.id, p]));
      let subtotal = 0;
      const currency = (prods?.[0] as any)?.currency || 'GBP';
      const lineItems = body.items.map(li => {
        const p: any = priceMap.get(li.id);
        if (!p) throw new Error(`Product not found: ${li.id}`);
        const qty = Math.max(1, Math.min(li.qty || 1, 999));
        const lineTotal = Number(p.price) * qty;
        subtotal += lineTotal;
        return { product_id: p.id, name: p.name, price: Number(p.price), qty, line_total: lineTotal, image: (p.images?.[0] ?? null) };
      });

      const { data: settings } = await supa
        .from('ecommerce_settings')
        .select('shipping_enabled,shipping_flat_rate,shipping_free_over,tax_enabled,tax_rate,tax_inclusive,payments_provider,stripe_secret_key,checkout_success_url,checkout_cancel_url,store_name,checkout_accent,contact_email')
        .eq('user_id', body.user_id).maybeSingle();

      const shipping = settings?.shipping_enabled
        ? (settings.shipping_free_over != null && subtotal >= Number(settings.shipping_free_over) ? 0 : Number(settings.shipping_flat_rate ?? 0))
        : 0;
      const taxable = settings?.tax_inclusive ? 0 : subtotal;
      const tax = settings?.tax_enabled ? +(taxable * (Number(settings.tax_rate ?? 0) / 100)).toFixed(2) : 0;
      const total = +(subtotal + shipping + tax).toFixed(2);

      // The provider the CUSTOMER experiences: stripe only when a key
      // is actually saved - a provider set to stripe with no key would
      // otherwise dead-end the pay page.
      const provider = settings?.payments_provider === 'stripe' && settings?.stripe_secret_key
        ? 'stripe' : (settings?.payments_provider ?? 'none');

      const sessionId = crypto.randomUUID();
      const record = {
        id: sessionId,
        user_id: body.user_id,
        status: 'pending',
        customer_email: body.customer?.email ?? null,
        customer_name: body.customer?.name ?? null,
        customer_phone: body.customer?.phone ?? null,
        shipping_address: body.customer?.address ?? null,
        items: lineItems,
        currency,
        subtotal,
        shipping_cost: shipping,
        tax_amount: tax,
        total,
        payment_provider: provider,
        payment_status: 'unpaid',
        metadata: {
          store_name: settings?.store_name, checkout_accent: settings?.checkout_accent,
          contact_email: settings?.contact_email, success_url: settings?.checkout_success_url,
          cancel_url: settings?.checkout_cancel_url, return_url: body.return_url ?? null,
        },
      };
      const { error: oerr } = await supa.from('ecommerce_orders').insert(record);
      if (oerr) return json({ error: oerr.message }, 500);

      const payUrl = `${SITE_URL}/pay/${sessionId}` + (body.return_url ? `?return=${encodeURIComponent(body.return_url)}` : '');
      return json({ session_id: sessionId, total, currency, provider, pay_url: payUrl });
    }

    // ---- Start a Stripe Checkout for an order ----
    if (req.method === 'POST' && action === 'stripe-session') {
      const { session_id, return_url } = await req.json();
      if (!session_id) return json({ error: 'session_id required' }, 400);
      const { data: order } = await supa.from('ecommerce_orders').select('*').eq('id', session_id).maybeSingle();
      if (!order) return json({ error: 'Order not found' }, 404);
      if ((order as any).payment_status === 'paid') return json({ error: 'Order is already paid' }, 400);

      const { data: settings } = await supa
        .from('ecommerce_settings')
        .select('stripe_secret_key,payments_provider,store_name')
        .eq('user_id', (order as any).user_id).maybeSingle();
      const key = settings?.stripe_secret_key;
      if (!key) return json({ error: 'This store has not connected Stripe yet' }, 400);

      const cur = String((order as any).currency || 'GBP').toLowerCase();
      const back = `${SITE_URL}/pay/${session_id}` + (return_url ? `?return=${encodeURIComponent(return_url)}` : '');
      const sep = back.indexOf('?') === -1 ? '?' : '&';
      const params: Record<string, string> = {
        mode: 'payment',
        success_url: back + sep + 'paid=1',
        cancel_url: back + sep + 'cancelled=1',
        'metadata[quooro_order_id]': session_id,
      };
      if ((order as any).customer_email) params.customer_email = (order as any).customer_email;
      const items = Array.isArray((order as any).items) ? (order as any).items : [];
      items.forEach((it: any, i: number) => {
        params[`line_items[${i}][quantity]`] = String(it.qty || 1);
        params[`line_items[${i}][price_data][currency]`] = cur;
        params[`line_items[${i}][price_data][unit_amount]`] = String(Math.round(Number(it.price) * 100));
        params[`line_items[${i}][price_data][product_data][name]`] = String(it.name || 'Item');
      });
      let idx = items.length;
      if (Number((order as any).shipping_cost) > 0) {
        params[`line_items[${idx}][quantity]`] = '1';
        params[`line_items[${idx}][price_data][currency]`] = cur;
        params[`line_items[${idx}][price_data][unit_amount]`] = String(Math.round(Number((order as any).shipping_cost) * 100));
        params[`line_items[${idx}][price_data][product_data][name]`] = 'Shipping';
        idx++;
      }
      if (Number((order as any).tax_amount) > 0) {
        params[`line_items[${idx}][quantity]`] = '1';
        params[`line_items[${idx}][price_data][currency]`] = cur;
        params[`line_items[${idx}][price_data][unit_amount]`] = String(Math.round(Number((order as any).tax_amount) * 100));
        params[`line_items[${idx}][price_data][product_data][name]`] = 'Tax';
      }

      const cs = await stripe(key, 'POST', '/checkout/sessions', params);
      await supa.from('ecommerce_orders')
        .update({ payment_intent_id: cs.id, status: 'confirmed', payment_status: 'awaiting_payment' })
        .eq('id', session_id);
      return json({ url: cs.url });
    }

    // ---- Verify payment after the customer returns from Stripe ----
    if (req.method === 'POST' && action === 'verify') {
      const { session_id } = await req.json();
      if (!session_id) return json({ error: 'session_id required' }, 400);
      const { data: order } = await supa.from('ecommerce_orders').select('*').eq('id', session_id).maybeSingle();
      if (!order) return json({ error: 'Order not found' }, 404);
      if ((order as any).payment_status === 'paid') return json({ paid: true, order: publicOrder(order) });
      const csId = (order as any).payment_intent_id;
      if (!csId) return json({ paid: false, order: publicOrder(order) });

      const { data: settings } = await supa
        .from('ecommerce_settings').select('stripe_secret_key')
        .eq('user_id', (order as any).user_id).maybeSingle();
      if (!settings?.stripe_secret_key) return json({ paid: false, order: publicOrder(order) });

      const cs = await stripe(settings.stripe_secret_key, 'GET', '/checkout/sessions/' + encodeURIComponent(csId));
      if (cs.payment_status === 'paid') {
        await supa.from('ecommerce_orders')
          .update({ status: 'paid', payment_status: 'paid' })
          .eq('id', session_id);
        const { data: fresh } = await supa.from('ecommerce_orders').select('*').eq('id', session_id).maybeSingle();
        return json({ paid: true, order: publicOrder(fresh) });
      }
      return json({ paid: false, order: publicOrder(order) });
    }

    // ---- Confirm without online payment (manual / none) ----
    if (req.method === 'POST' && action === 'confirm') {
      const { session_id } = await req.json();
      if (!session_id) return json({ error: 'session_id required' }, 400);
      const { data: order } = await supa.from('ecommerce_orders').select('*').eq('id', session_id).maybeSingle();
      if (!order) return json({ error: 'not found' }, 404);
      const provider = (order as any).payment_provider ?? 'none';
      if (provider === 'manual') {
        await supa.from('ecommerce_orders').update({ status: 'confirmed', payment_status: 'awaiting_payment' }).eq('id', session_id);
        return json({ ok: true, redirect: (order as any).metadata?.success_url || null });
      }
      // For 'none' provider we mark it as confirmed too so the merchant sees it
      await supa.from('ecommerce_orders').update({ status: 'confirmed', payment_status: 'unpaid' }).eq('id', session_id);
      return json({ ok: true, redirect: (order as any).metadata?.success_url || null });
    }

    // ---- Public order fetch for the pay page ----
    if (req.method === 'GET' && action !== '' && action !== 'store-checkout') {
      const { data, error } = await supa.from('ecommerce_orders').select('*').eq('id', action).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Session not found' }, 404);
      // Re-sign product image URLs if they are storage paths
      const items = Array.isArray((data as any).items) ? (data as any).items : [];
      for (const it of items) {
        if (it.image && typeof it.image === 'string' && !it.image.startsWith('http')) {
          const { data: signed } = await supa.storage.from('product-images').createSignedUrl(it.image, 3600);
          if (signed?.signedUrl) it.image = signed.signedUrl;
        }
      }
      return json({ session: publicOrder({ ...data, items }) });
    }

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
