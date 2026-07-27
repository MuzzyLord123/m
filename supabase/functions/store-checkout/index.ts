// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  customer?: {
    email?: string; name?: string; phone?: string;
    address?: { line1?: string; line2?: string; city?: string; postal_code?: string; country?: string; };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const action = parts[parts.length - 1] || '';

  try {
    const supa = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

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
        .select('shipping_enabled,shipping_flat_rate,shipping_free_over,tax_enabled,tax_rate,tax_inclusive,payments_provider,checkout_success_url,checkout_cancel_url,store_name,checkout_accent,contact_email')
        .eq('user_id', body.user_id).maybeSingle();

      const shipping = settings?.shipping_enabled
        ? (settings.shipping_free_over != null && subtotal >= Number(settings.shipping_free_over) ? 0 : Number(settings.shipping_flat_rate ?? 0))
        : 0;
      const taxable = settings?.tax_inclusive ? 0 : subtotal;
      const tax = settings?.tax_enabled ? +(taxable * (Number(settings.tax_rate ?? 0) / 100)).toFixed(2) : 0;
      const total = +(subtotal + shipping + tax).toFixed(2);

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
        payment_provider: settings?.payments_provider ?? 'none',
        payment_status: 'unpaid',
        metadata: { store_name: settings?.store_name, checkout_accent: settings?.checkout_accent, contact_email: settings?.contact_email, success_url: settings?.checkout_success_url, cancel_url: settings?.checkout_cancel_url },
      };
      const { error: oerr } = await supa.from('ecommerce_orders').insert(record);
      if (oerr) return json({ error: oerr.message }, 500);

      return json({ session_id: sessionId, total, currency, provider: settings?.payments_provider ?? 'none' });
    }

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
      return json({ session: { ...data, items } });
    }

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

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
