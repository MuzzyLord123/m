// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'public, max-age=60', ...extra },
  });

const js = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { ...CORS, 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  // Path shape: /ecommerce-embed/<action>
  const parts = url.pathname.split('/').filter(Boolean);
  const action = parts[parts.length - 1] || '';

  try {
    const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

    // ---- Products + public store settings, one feed ----
    if (action === 'products') {
      const userId = url.searchParams.get('user_id');
      const siteId = url.searchParams.get('site_id');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '48', 10) || 48, 200);
      if (!userId && !siteId) return json({ error: 'user_id or site_id required' }, 400);

      let q = supabase
        .from('products')
        .select('id,user_id,name,slug,short_description,description,price,compare_at_price,currency,images,status,is_featured,inventory_count,track_inventory,tags')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .limit(limit);
      if (siteId) q = q.eq('site_id', siteId);
      else if (userId) q = q.eq('user_id', userId);

      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      const products = (data ?? []).map((p: any) => { const { user_id: _u, ...rest } = p; return rest; });

      // The widget needs the store's public checkout maths to show honest
      // totals in the cart. Only the public subset leaves this function.
      const ownerId = userId || (data?.[0] as any)?.user_id || null;
      let settings: any = null;
      if (ownerId) {
        const { data: s } = await supabase
          .from('ecommerce_settings')
          .select('store_name,shipping_enabled,shipping_flat_rate,shipping_free_over,tax_enabled,tax_rate,tax_inclusive,payments_provider,checkout_accent')
          .eq('user_id', ownerId).maybeSingle();
        settings = s ?? null;
      }
      return json({ products, settings, owner_id: ownerId });
    }

    // ---- Widget JS (default) ----
    if (action === '' || action === 'ecommerce-embed' || action === 'widget.js' || action === 'embed.js') {
      const productsEndpoint = `${SUPA_URL}/functions/v1/ecommerce-embed/products`;
      const checkoutEndpoint = `${SUPA_URL}/functions/v1/store-checkout`;
      const script = WIDGET_SRC
        .replaceAll('__PRODUCTS_ENDPOINT__', productsEndpoint)
        .replaceAll('__CHECKOUT_ENDPOINT__', checkoutEndpoint);
      return js(script);
    }

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

/* The storefront that runs on the customer's own website.
   Design rules, in order:
   1. The host site's look wins. Fonts, text colour, page background and
      accent are read off the host page at runtime, so the shop reads as
      part of the site it is pasted into - not as a bolted-on plugin.
   2. Everything happens in-page: catalogue, search, bag, checkout. The
      old widget redirected to quooro.com/checkout, where the visitor's
      cart (in the HOST site's localStorage) could never follow - orders
      could not actually complete. Checkout now runs inside the widget
      and posts straight to store-checkout, so the order lands in the
      merchant's Orders page.
   3. No backticks and no dollar-brace in this string - it is served
      inside a template literal. */
const WIDGET_SRC = `/*__WIDGET_BEGIN__*/
(function(){
  'use strict';
  var THIS = document.currentScript;
  if(!THIS){ var all=document.querySelectorAll('script[data-quooro]'); THIS=all[all.length-1]; }
  function attr(n,d){ var v = THIS && THIS.getAttribute(n); return v==null||v===''?d:v; }
  var cfg = {
    userId: attr('data-user-id',''),
    siteId: attr('data-site-id',''),
    columns: parseInt(attr('data-columns','3'),10)||3,
    limit: parseInt(attr('data-limit','24'),10)||24,
    currency: attr('data-currency','GBP'),
    accent: attr('data-accent',''),
    title: attr('data-title',''),
    ratio: attr('data-ratio','square'),
    radius: attr('data-radius',''),
    checkoutUrl: attr('data-checkout-url','')
  };
  var EP='__PRODUCTS_ENDPOINT__', CK='__CHECKOUT_ENDPOINT__';
  var CART_KEY='quooro_cart_v2_'+(cfg.siteId||cfg.userId||'default');

  var targets = document.querySelectorAll('[data-quooro-shop]');
  if(!targets.length){
    var mount=document.createElement('div'); mount.setAttribute('data-quooro-shop','');
    if(THIS && THIS.parentNode) THIS.parentNode.insertBefore(mount, THIS.nextSibling);
    else document.body.appendChild(mount);
    targets=[mount];
  }
  targets = Array.prototype.slice.call(targets);

  /* ---------- colour helpers ---------- */
  function parseColor(c){
    if(!c) return null;
    c=String(c).trim();
    var m=c.match(/^#([0-9a-f]{3})$/i);
    if(m){ var h=m[1]; return {r:parseInt(h[0]+h[0],16),g:parseInt(h[1]+h[1],16),b:parseInt(h[2]+h[2],16),a:1}; }
    m=c.match(/^#([0-9a-f]{6})$/i);
    if(m){ var x=m[1]; return {r:parseInt(x.slice(0,2),16),g:parseInt(x.slice(2,4),16),b:parseInt(x.slice(4,6),16),a:1}; }
    m=c.match(/^rgba?\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)$/i);
    if(m) return {r:+m[1],g:+m[2],b:+m[3],a:m[4]==null?1:+m[4]};
    return null;
  }
  function rgba(c,a){ return 'rgba('+Math.round(c.r)+','+Math.round(c.g)+','+Math.round(c.b)+','+a+')'; }
  function hex(c){ function p(v){v=Math.round(v).toString(16);return v.length<2?'0'+v:v;} return '#'+p(c.r)+p(c.g)+p(c.b); }
  function lum(c){ var f=function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b); }

  /* ---------- read the host page's look ---------- */
  function themeOf(mountEl){
    var bodyCs = getComputedStyle(document.body);
    var font = bodyCs.fontFamily || 'system-ui,sans-serif';
    var ink = parseColor(bodyCs.color) || {r:17,g:21,b:28,a:1};
    var paper=null, el=mountEl;
    while(el && el!==document.documentElement){
      var b=parseColor(getComputedStyle(el).backgroundColor);
      if(b && b.a>0.01){ paper=b; break; }
      el=el.parentElement;
    }
    if(!paper) paper = parseColor(bodyCs.backgroundColor);
    if(!paper || paper.a<0.01) paper = parseColor(getComputedStyle(document.documentElement).backgroundColor);
    if(!paper || paper.a<0.01) paper = {r:255,g:255,b:255,a:1};
    var accent = parseColor(cfg.accent) || (state.settings && parseColor(state.settings.checkout_accent)) || ink;
    return { font:font, ink:ink, paper:paper, accent:accent, dark: lum(paper)<0.35 };
  }
  function applyTokens(hostEl, t){
    var s=hostEl.style;
    s.setProperty('--q-font', t.font);
    s.setProperty('--q-ink', hex(t.ink));
    s.setProperty('--q-mut', rgba(t.ink,.58));
    s.setProperty('--q-faint', rgba(t.ink,.38));
    s.setProperty('--q-hair', rgba(t.ink, t.dark? .2 : .13));
    s.setProperty('--q-soft', rgba(t.ink, t.dark? .1 : .05));
    s.setProperty('--q-paper', hex(t.paper));
    s.setProperty('--q-paper92', rgba(t.paper,.94));
    s.setProperty('--q-accent', hex(t.accent));
    s.setProperty('--q-on-accent', lum(t.accent)>.55 ? '#101216' : '#ffffff');
    s.setProperty('--q-scrim', t.dark?'rgba(0,0,0,.6)':'rgba(15,18,24,.45)');
    s.setProperty('--q-rad', (cfg.radius===''? 4 : Math.max(0,parseInt(cfg.radius,10)||0))+'px');
    s.setProperty('--q-ar', cfg.ratio==='portrait' ? '4/5' : '1/1');
  }

  /* ---------- styles (shared by grid + overlay shadow roots) ---------- */
  var STYLE = ''
  +':host{all:initial;display:block;}'
  +'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}'
  +'button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;}'
  +'input{font:inherit;color:inherit;}'
  +'img{max-width:100%;display:block;}'
  +'.wrap{font:14px/1.5 var(--q-font);color:var(--q-ink);-webkit-font-smoothing:antialiased;}'
  /* toolbar */
  +'.bar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:0 0 14px;border-bottom:1px solid var(--q-hair);margin-bottom:26px;}'
  +'.ttl{font-size:15px;font-weight:600;letter-spacing:.01em;}'
  +'.cnt{margin-left:10px;font-size:11px;color:var(--q-mut);letter-spacing:.08em;text-transform:uppercase;}'
  +'.acts{display:flex;align-items:center;gap:2px;}'
  +'.ibtn{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--q-ink);position:relative;transition:background .15s;}'
  +'.ibtn:hover{background:var(--q-soft);}'
  +'.sbox{display:flex;align-items:center;}'
  +'.sin{width:0;opacity:0;border:0;border-bottom:1px solid var(--q-hair);background:transparent;padding:5px 2px;font-size:13px;letter-spacing:.01em;outline:none;transition:width .3s cubic-bezier(.22,1,.36,1),opacity .2s ease;}'
  +'.sin::placeholder{color:var(--q-faint);letter-spacing:.06em;text-transform:uppercase;font-size:11px;}'
  +'.sbox.open .sin{width:180px;opacity:1;margin-right:4px;}'
  +'.sbox.open .sin:focus{border-bottom-color:var(--q-ink);}'
  +'.sclear{display:none;width:22px;height:22px;border-radius:50%;color:var(--q-faint);align-items:center;justify-content:center;margin-right:2px;}'
  +'.sbox.open.has .sclear{display:inline-flex;}'
  +'.sclear:hover{color:var(--q-ink);background:var(--q-soft);}'
  +'.bagn{position:absolute;top:1px;right:0;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--q-accent);color:var(--q-on-accent);font-size:9px;font-weight:700;line-height:15px;text-align:center;}'
  /* grid */
  +'.grid{display:grid;gap:30px 22px;grid-template-columns:repeat(auto-fill,minmax(var(--q-min),1fr));}'
  +'@keyframes qin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'
  +'.card{cursor:pointer;animation:qin .55s cubic-bezier(.22,1,.36,1) both;}'
  +'.ph{position:relative;overflow:hidden;background:var(--q-soft);border-radius:var(--q-rad);aspect-ratio:var(--q-ar);}'
  +'.ph:after{content:\"\";position:absolute;inset:0;border:1px solid var(--q-hair);border-radius:var(--q-rad);pointer-events:none;opacity:.55;}'
  +'.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.22,1,.36,1),opacity .35s ease;}'
  +'.card:hover .ph img{transform:scale(1.04);}'
  +'.im2{opacity:0;}'
  +'.card:hover .im2{opacity:1;}'
  +'.noimg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--q-faint);font-size:11px;letter-spacing:.14em;text-transform:uppercase;}'
  +'.chip{position:absolute;top:10px;left:10px;padding:3px 8px;background:var(--q-paper92);color:var(--q-ink);font-size:9.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;border-radius:3px;backdrop-filter:blur(4px);}'
  +'.soldph img{opacity:.45;}'
  +'.qadd{position:absolute;left:0;right:0;bottom:0;padding:9px 0;background:var(--q-paper92);color:var(--q-ink);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-align:center;transform:translateY(102%);transition:transform .22s ease;backdrop-filter:blur(6px);}'
  +'.card:hover .qadd{transform:none;}'
  +'.qadd:hover{color:var(--q-accent);}'
  +'@media (hover:none){.qadd{transform:none;}}'
  +'.cap{padding:10px 2px 0;}'
  +'.nm{font-size:13.5px;font-weight:500;line-height:1.35;}'
  +'.pr{margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;}'
  +'.pr s{color:var(--q-faint);margin-left:7px;font-size:12px;}'
  +'.sold{color:var(--q-faint);}'
  +'.empty{padding:56px 20px;text-align:center;color:var(--q-mut);font-size:13px;}'
  /* skeleton */
  +'.sk .ph{background:var(--q-soft);}'
  +'.skl{height:11px;border-radius:3px;background:var(--q-soft);margin-top:10px;}'
  +'.skl.s2{width:40%;margin-top:7px;}'
  +'@keyframes qpulse{0%,100%{opacity:.55}50%{opacity:1}}'
  +'.sk{animation:qpulse 1.4s ease-in-out infinite;}'
  /* overlay chrome */
  +'.scrim{position:fixed;inset:0;background:var(--q-scrim);z-index:2147483646;opacity:0;transition:opacity .22s;}'
  +'.scrim.on{opacity:1;}'
  +'.panel{position:fixed;z-index:2147483647;background:var(--q-paper);color:var(--q-ink);font:14px/1.5 var(--q-font);display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;}'
  +'.panel.sheet{top:0;right:0;bottom:0;width:min(430px,100vw);box-shadow:-18px 0 50px rgba(0,0,0,.18);transform:translateX(100%);transition:transform .28s cubic-bezier(.32,.72,.32,1);}'
  +'.panel.sheet.on{transform:none;}'
  +'.panel.modal{top:50%;left:50%;transform:translate(-50%,-50%) scale(.97);width:min(860px,calc(100vw - 32px));max-height:min(640px,calc(100vh - 48px));border-radius:calc(var(--q-rad) + 4px);box-shadow:0 30px 80px rgba(0,0,0,.28);opacity:0;transition:opacity .2s,transform .2s;overflow:hidden;}'
  +'.panel.modal.on{opacity:1;transform:translate(-50%,-50%);}'
  +'@media (max-width:640px){.panel.modal{top:auto;bottom:0;left:0;transform:translateY(100%);width:100vw;max-height:88vh;border-radius:14px 14px 0 0;}.panel.modal.on{transform:none;}}'
  +'.phead{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--q-hair);}'
  +'.phead .t{font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;}'
  +'.pbody{flex:1;overflow:auto;overscroll-behavior:contain;}'
  +'.pfoot{padding:16px 22px 20px;border-top:1px solid var(--q-hair);}'
  /* product detail */
  +'.det{display:grid;grid-template-columns:1fr 1fr;min-height:0;height:100%;}'
  +'@media (max-width:640px){.det{grid-template-columns:1fr;}}'
  +'.det .dimg{background:var(--q-soft);min-height:260px;display:flex;flex-direction:column;}'
  +'.det .dmain{flex:1;min-height:220px;position:relative;}'
  +'.det .dmain img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}'
  +'.thumbs{display:flex;gap:8px;padding:10px 12px;}'
  +'.th{width:50px;height:50px;border-radius:calc(var(--q-rad));overflow:hidden;border:1px solid var(--q-hair);opacity:.55;transition:.15s;padding:0;flex:none;}'
  +'.th.on{opacity:1;border-color:var(--q-mut);}'
  +'.th img{width:100%;height:100%;object-fit:cover;display:block;}'
  +'.det .dtx{padding:30px 28px;overflow:auto;display:flex;flex-direction:column;gap:14px;}'
  +'.det h2{font-size:19px;font-weight:600;line-height:1.25;letter-spacing:-.01em;}'
  +'.det .dpr{font-size:15px;font-variant-numeric:tabular-nums;}'
  +'.det .dpr s{color:var(--q-faint);margin-left:8px;font-size:13px;}'
  +'.det .dd{font-size:13px;color:var(--q-mut);line-height:1.65;white-space:pre-line;}'
  +'.det .drow{margin-top:auto;display:flex;gap:12px;align-items:stretch;padding-top:10px;}'
  /* buttons + steppers */
  +'.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;background:var(--q-accent);color:var(--q-on-accent);font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;border-radius:var(--q-rad);transition:opacity .15s;white-space:nowrap;}'
  +'.btn:hover{opacity:.88;}'
  +'.btn[disabled]{opacity:.45;cursor:default;}'
  +'.btn.wide{width:100%;}'
  +'.ghost{background:none;color:var(--q-mut);font-size:12px;letter-spacing:.04em;text-decoration:underline;text-underline-offset:3px;}'
  +'.ghost:hover{color:var(--q-ink);}'
  +'.step{display:inline-flex;align-items:center;border:1px solid var(--q-hair);border-radius:var(--q-rad);}'
  +'.step button{width:32px;height:40px;font-size:15px;color:var(--q-mut);}'
  +'.step button:hover{color:var(--q-ink);}'
  +'.step .v{min-width:26px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums;}'
  /* cart */
  +'.item{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--q-hair);}'
  +'.item:last-child{border-bottom:0;}'
  +'.item .im{width:62px;height:62px;flex:none;border-radius:var(--q-rad);background:var(--q-soft);overflow:hidden;}'
  +'.item .im img{width:100%;height:100%;object-fit:cover;}'
  +'.item .mt{flex:1;min-width:0;}'
  +'.item .n{font-size:13px;font-weight:500;line-height:1.35;}'
  +'.item .u{font-size:11.5px;color:var(--q-mut);margin-top:2px;font-variant-numeric:tabular-nums;}'
  +'.item .lt{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;}'
  +'.mini{display:inline-flex;align-items:center;gap:8px;margin-top:8px;}'
  +'.mini button{width:24px;height:24px;border:1px solid var(--q-hair);border-radius:50%;font-size:12px;color:var(--q-mut);line-height:1;transition:.15s;}'
  +'.mini button:hover{color:var(--q-ink);border-color:var(--q-mut);}'
  +'.mini .v{font-size:12px;min-width:14px;text-align:center;font-variant-numeric:tabular-nums;}'
  +'.rm{margin-left:8px;font-size:10.5px;color:var(--q-faint);letter-spacing:.06em;text-transform:uppercase;}'
  +'.rm:hover{color:var(--q-ink);}'
  +'.hb{color:var(--q-mut);font-weight:500;margin-left:7px;letter-spacing:0;text-transform:none;font-size:12px;}'
  +'.fsm{margin:12px 0 4px;padding:12px 14px;border:1px solid var(--q-hair);border-radius:var(--q-rad);}'
  +'.fsm .l{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--q-mut);letter-spacing:.04em;margin-bottom:8px;}'
  +'.fsm.ok .l{margin-bottom:0;color:var(--q-ink);}'
  +'.fsm .b{height:3px;background:var(--q-soft);border-radius:2px;overflow:hidden;}'
  +'.fsm .f{height:100%;background:var(--q-accent);border-radius:2px;}'
  +'.sums{display:flex;flex-direction:column;gap:7px;margin-bottom:14px;}'
  +'.sum{display:flex;justify-content:space-between;font-size:12.5px;color:var(--q-mut);font-variant-numeric:tabular-nums;}'
  +'.sum.tt{color:var(--q-ink);font-weight:600;font-size:14px;padding-top:8px;border-top:1px solid var(--q-hair);}'
  +'.bagempty{padding:70px 20px;text-align:center;color:var(--q-mut);display:flex;flex-direction:column;align-items:center;gap:14px;font-size:13px;}'
  /* checkout form */
  +'.f{display:flex;flex-direction:column;gap:12px;padding:20px 22px;}'
  +'.fl{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--q-mut);margin:8px 0 -4px;}'
  +'.fi{width:100%;padding:11px 12px;border:1px solid var(--q-hair);border-radius:var(--q-rad);background:transparent;font-size:13px;outline:none;transition:border-color .15s;}'
  +'.fi:focus{border-color:var(--q-mut);}'
  +'.fi::placeholder{color:var(--q-faint);}'
  +'.f2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}'
  +'.err{color:#c0392b;font-size:12px;min-height:16px;}'
  +'.note{font-size:11.5px;color:var(--q-mut);line-height:1.6;}'
  /* success */
  +'.done{padding:56px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;}'
  +'.done .ok{width:52px;height:52px;border-radius:50%;background:var(--q-accent);color:var(--q-on-accent);display:flex;align-items:center;justify-content:center;}'
  +'.done h3{font-size:17px;font-weight:600;}'
  +'.done .ref{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--q-mut);}'
  +'@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;}}';

  /* ---------- svg icons ---------- */
  function svg(p,w){ return '<svg viewBox="0 0 24 24" width="'+(w||16)+'" height="'+(w||16)+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'; }
  var I = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.2-4.2"/>'),
    bag: svg('<path d="M6.2 8h11.6l-1 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6.2 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',17),
    bagBig: svg('<path d="M6.2 8h11.6l-1 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6.2 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',30),
    x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    xs: svg('<path d="M7 7l10 10M17 7L7 17"/>',12),
    back: svg('<path d="M14.5 6l-6 6 6 6"/>'),
    go: svg('<path d="M5 12h13M13 7l5 5-5 5"/>',14),
    check: svg('<path d="M5 13l4.2 4.2L19 7"/>',24)
  };

  /* ---------- state ---------- */
  var state = { products:[], settings:null, ownerId:'', q:'', loaded:false, searchOpen:false };
  var shadows=[]; var theme=null;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function fmt(v,cur){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:cur||cfg.currency}).format(Number(v||0)); }catch(e){ return (cur||cfg.currency)+' '+Number(v||0).toFixed(2); } }
  function imgsOf(p){
    if(!Array.isArray(p.images)) return [];
    return p.images.map(function(im){ return typeof im==='string'?im:(im&&im.url)||''; }).filter(Boolean);
  }
  function imgOf(p){ return imgsOf(p)[0]||''; }
  function soldOut(p){ return !!p.track_inventory && Number(p.inventory_count||0)<=0; }
  function invCap(p){ return p.track_inventory ? Math.max(0,Number(p.inventory_count||0)) : 999; }

  function readCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ return []; } }
  function writeCart(c){ try{ localStorage.setItem(CART_KEY, JSON.stringify(c)); }catch(e){} renderCount(); }
  function cartCurrency(){ var c=readCart(); return (c[0]&&c[0].currency)||cfg.currency; }
  function totals(sub){
    var s=state.settings||{};
    var ship = s.shipping_enabled ? ((s.shipping_free_over!=null && sub>=Number(s.shipping_free_over)) ? 0 : Number(s.shipping_flat_rate||0)) : null;
    var tax = s.tax_enabled ? (s.tax_inclusive ? 0 : +(sub*(Number(s.tax_rate||0)/100)).toFixed(2)) : null;
    var total = +(sub + (ship||0) + (tax||0)).toFixed(2);
    return { sub:sub, ship:ship, tax:tax, taxIncluded: !!(s.tax_enabled && s.tax_inclusive), taxRate:Number(s.tax_rate||0), total:total };
  }

  /* ---------- grid ---------- */
  var MINW = {1:'420px',2:'320px',3:'240px',4:'205px',5:'180px',6:'160px'};
  function renderRoot(host){
    theme = theme || themeOf(host);
    applyTokens(host, theme);
    host.style.setProperty('--q-min', MINW[cfg.columns]||'240px');
    var shadow = host.__q_shadow || host.attachShadow({mode:'open'});
    host.__q_shadow = shadow;
    var skel=''; for(var i=0;i<Math.min(8,cfg.limit);i++) skel+='<div class="sk"><div class="ph"></div><div class="skl"></div><div class="skl s2"></div></div>';
    shadow.innerHTML='<style>'+STYLE+'</style><div class="wrap">'
      +'<div class="bar"><div><span class="ttl q-ttl"></span><span class="cnt q-cnt"></span></div>'
      +'<div class="acts"><div class="sbox"><input class="sin" placeholder="Search" aria-label="Search products"/>'
      +'<button class="sclear" data-sc aria-label="Clear search">'+I.xs+'</button>'
      +'<button class="ibtn" data-s aria-label="Search">'+I.search+'</button></div>'
      +'<button class="ibtn" data-open-cart aria-label="Shopping bag">'+I.bag+'<span class="bagn q-n" hidden>0</span></button></div></div>'
      +'<div class="grid q-grid">'+skel+'</div></div>';
    return shadow;
  }

  function titleText(){ return cfg.title || (state.settings&&state.settings.store_name) || 'Shop'; }

  function renderGrid(){
    var q=state.q.trim().toLowerCase();
    var list = q ? state.products.filter(function(p){
      var hay=((p.name||'')+' '+(p.short_description||'')+' '+((p.tags||[]).join(' '))).toLowerCase();
      return hay.indexOf(q)>=0;
    }) : state.products;
    var html = list.length ? list.map(function(p,ci){
      var ims=imgsOf(p), im=ims[0]||'', so=soldOut(p);
      var sale = p.compare_at_price && Number(p.compare_at_price)>Number(p.price);
      /* second photo crossfades in on hover - the quiet tell of a real store */
      var hover = ims[1] ? '<img class="im2" loading="lazy" src="'+esc(ims[1])+'" alt=""/>' : '';
      return '<figure class="card" style="animation-delay:'+Math.min(ci*45,420)+'ms" data-p="'+esc(p.id)+'"><div class="ph'+(so?' soldph':'')+'">'
        +(im?'<img loading="lazy" src="'+esc(im)+'" alt="'+esc(p.name)+'"/>'+hover:'<div class="noimg">No image</div>')
        +(so?'<span class="chip">Sold out</span>':(sale?'<span class="chip">Sale</span>':''))
        +(so?'':'<button class="qadd" data-add="'+esc(p.id)+'">Add to bag</button>')
        +'</div><figcaption class="cap"><div class="nm">'+esc(p.name)+'</div>'
        +'<div class="pr'+(so?' sold':'')+'">'+esc(fmt(p.price,p.currency))
        +(sale?'<s>'+esc(fmt(p.compare_at_price,p.currency))+'</s>':'')
        +'</div></figcaption></figure>';
    }).join('') : '<div class="empty">'+(q?'Nothing matches \\u201c'+esc(state.q)+'\\u201d':'No products yet')+'</div>';
    shadows.forEach(function(sh){
      sh.querySelector('.q-grid').innerHTML=html;
      sh.querySelector('.q-ttl').textContent=titleText();
      sh.querySelector('.q-cnt').textContent = q ? (list.length+' result'+(list.length===1?'':'s')) : (state.products.length+' product'+(state.products.length===1?'':'s'));
    });
  }
  function renderCount(){
    var n=readCart().reduce(function(a,i){return a+(i.qty||0);},0);
    shadows.forEach(function(sh){ var el=sh.querySelector('.q-n'); if(el){ el.textContent=n; el.hidden=!n; } });
  }

  /* ---------- overlay (bag / detail / checkout share one shadow) ---------- */
  var ovHost=null, ovShadow=null, ovOpen=false, lastKind='';
  function overlay(kind, inner){
    if(!ovHost){
      ovHost=document.createElement('div'); ovHost.setAttribute('data-quooro-overlay','');
      document.body.appendChild(ovHost);
      ovShadow=ovHost.attachShadow({mode:'open'});
    }
    applyTokens(ovHost, theme||themeOf(document.body));
    lastKind=kind;
    ovShadow.innerHTML='<style>'+STYLE+'</style><div class="scrim" data-close></div>'
      +'<div class="panel '+kind+'" role="dialog" aria-modal="true">'+inner+'</div>';
    document.documentElement.style.overflow='hidden';
    ovOpen=true;
    requestAnimationFrame(function(){
      var sc=ovShadow.querySelector('.scrim'), pn=ovShadow.querySelector('.panel');
      if(sc) sc.classList.add('on'); if(pn) pn.classList.add('on');
    });
    return ovShadow;
  }
  function closeOverlay(){
    if(!ovOpen) return;
    ovOpen=false;
    document.documentElement.style.overflow='';
    if(ovShadow) ovShadow.innerHTML='';
  }
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && ovOpen) closeOverlay(); });

  /* ---------- product detail ---------- */
  function openDetail(id){
    var p=state.products.find(function(x){return x.id===id;}); if(!p) return;
    var ims=imgsOf(p), im=ims[0]||'', so=soldOut(p), cap=invCap(p);
    var sale=p.compare_at_price && Number(p.compare_at_price)>Number(p.price);
    var thumbs = ims.length>1
      ? '<div class="thumbs">'+ims.map(function(u,i){
          return '<button class="th'+(i===0?' on':'')+'" data-th="'+i+'" aria-label="Photo '+(i+1)+'"><img src="'+esc(u)+'" alt=""/></button>';
        }).join('')+'</div>'
      : '';
    var sh=overlay('modal',
      '<div class="det">'
      +'<div class="dimg"><div class="dmain">'
      +(im?'<img data-main src="'+esc(im)+'" alt="'+esc(p.name)+'"/>':'<div class="noimg" style="height:100%">No image</div>')
      +'</div>'+thumbs+'</div>'
      +'<div class="dtx"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
      +'<h2>'+esc(p.name)+'</h2><button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
      +'<div class="dpr">'+esc(fmt(p.price,p.currency))+(sale?'<s>'+esc(fmt(p.compare_at_price,p.currency))+'</s>':'')+'</div>'
      +((p.description||p.short_description)?'<div class="dd">'+esc(p.description||p.short_description)+'</div>':'')
      +'<div class="drow">'
      +(so?'<div class="note">Sold out</div>'
          :'<div class="step"><button data-m>\\u2212</button><span class="v" data-v>1</span><button data-pl>+</button></div>'
           +'<button class="btn" style="flex:1" data-buy>Add to bag</button>')
      +'</div></div></div>');
    var qty=1;
    sh.querySelector('.panel').addEventListener('click', function(e){
      var t=e.target.closest ? e.target.closest('button') : e.target;
      if(!t) return;
      if(t.hasAttribute('data-close')){ closeOverlay(); return; }
      if(t.hasAttribute('data-m')){ qty=Math.max(1,qty-1); sh.querySelector('[data-v]').textContent=qty; }
      if(t.hasAttribute('data-pl')){ qty=Math.min(cap,qty+1); sh.querySelector('[data-v]').textContent=qty; }
      if(t.hasAttribute('data-th')){
        var mi=sh.querySelector('[data-main]');
        if(mi){ mi.src=ims[parseInt(t.getAttribute('data-th'),10)]||im; }
        sh.querySelectorAll('.th').forEach(function(x){ x.classList.toggle('on', x===t); });
        return;
      }
      if(t.hasAttribute('data-buy')){ addToCart(p.id, qty); openCart(); }
    });
    sh.querySelector('.scrim').addEventListener('click', closeOverlay);
  }

  /* ---------- bag ---------- */
  function addToCart(id, qty){
    var p=state.products.find(function(x){return x.id===id;}); if(!p||soldOut(p)) return;
    var c=readCart(); var ex=c.find(function(x){return x.id===id;});
    var cap=invCap(p);
    if(ex) ex.qty=Math.min(cap, ex.qty+(qty||1));
    else c.push({id:p.id,name:p.name,price:p.price,currency:p.currency,image:imgOf(p),qty:Math.min(cap,qty||1)});
    writeCart(c);
    flashBag();
  }
  function flashBag(){
    shadows.forEach(function(sh){
      var b=sh.querySelector('[data-open-cart]'); if(!b) return;
      b.style.transition='transform .12s'; b.style.transform='scale(1.18)';
      setTimeout(function(){ b.style.transform=''; },140);
    });
  }

  function cartInner(){
    var cart=readCart();
    if(!cart.length){
      return '<div class="phead"><span class="t">Your bag</span><button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
        +'<div class="pbody"><div class="bagempty">'+I.bagBig+'<div>Your bag is empty</div>'
        +'<button class="ghost" data-close>Continue shopping</button></div></div>';
    }
    var sub=cart.reduce(function(a,i){return a+Number(i.price||0)*i.qty;},0);
    var t=totals(sub), cur=cartCurrency();
    var n=cart.reduce(function(a,i){return a+(i.qty||0);},0);
    var s=state.settings||{};
    /* the free-shipping meter: real numbers from the store's settings,
       or nothing at all - never an invented incentive */
    var meter='';
    if(s.shipping_enabled && s.shipping_free_over!=null){
      var free=Number(s.shipping_free_over);
      if(sub<free){
        var pct=Math.max(4,Math.min(100,Math.round(sub/free*100)));
        meter='<div class="fsm"><div class="l"><span>'+esc(fmt(free-sub,cur))+' away from free shipping</span><span>'+pct+'%</span></div>'
          +'<div class="b"><div class="f" style="width:'+pct+'%"></div></div></div>';
      } else {
        meter='<div class="fsm ok"><div class="l"><span>Free shipping unlocked</span><span>\\u2713</span></div></div>';
      }
    }
    var rows=cart.map(function(i){
      return '<div class="item"><div class="im">'+(i.image?'<img src="'+esc(i.image)+'" alt=""/>':'')+'</div>'
        +'<div class="mt"><div class="n">'+esc(i.name)+'</div><div class="u">'+esc(fmt(i.price,i.currency))+'</div>'
        +'<div class="mini"><button data-dec="'+esc(i.id)+'" aria-label="Less">\\u2212</button><span class="v">'+i.qty+'</span>'
        +'<button data-inc="'+esc(i.id)+'" aria-label="More">+</button>'
        +'<button class="rm" data-rm="'+esc(i.id)+'">Remove</button></div></div>'
        +'<div class="lt">'+esc(fmt(Number(i.price)*i.qty,i.currency))+'</div></div>';
    }).join('');
    var sums='<div class="sum"><span>Subtotal</span><span>'+esc(fmt(t.sub,cur))+'</span></div>'
      +(t.ship!=null?'<div class="sum"><span>Shipping</span><span>'+(t.ship===0?'Free':esc(fmt(t.ship,cur)))+'</span></div>':'')
      +(t.tax!=null&&t.tax>0?'<div class="sum"><span>Tax ('+t.taxRate+'%)</span><span>'+esc(fmt(t.tax,cur))+'</span></div>':'')
      +(t.taxIncluded?'<div class="sum"><span>Tax</span><span>Included</span></div>':'')
      +'<div class="sum tt"><span>Total</span><span>'+esc(fmt(t.total,cur))+'</span></div>';
    return '<div class="phead"><span class="t">Your bag<span class="hb">'+n+(n===1?' item':' items')+'</span></span>'
      +'<button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
      +'<div class="pbody" style="padding:2px 22px;">'+meter+rows+'</div>'
      +'<div class="pfoot"><div class="sums">'+sums+'</div>'
      +'<button class="btn wide" data-go-checkout>Checkout '+I.go+'</button></div>';
  }
  function openCart(){
    var sh=overlay('sheet', cartInner());
    bindCart(sh);
  }
  function bindCart(sh){
    var pn=sh.querySelector('.panel');
    pn.addEventListener('click', function(e){
      var t=e.target.closest?e.target.closest('button'):e.target; if(!t) return;
      if(t.hasAttribute('data-close')){ closeOverlay(); return; }
      if(t.hasAttribute('data-go-checkout')){ goCheckout(); return; }
      var id=t.getAttribute('data-inc')||t.getAttribute('data-dec')||t.getAttribute('data-rm');
      if(!id) return;
      var c=readCart(); var idx=c.findIndex(function(x){return x.id===id;}); if(idx<0) return;
      var p=state.products.find(function(x){return x.id===id;});
      if(t.hasAttribute('data-inc')) c[idx].qty=Math.min(p?invCap(p):999, c[idx].qty+1);
      else if(t.hasAttribute('data-dec')){ c[idx].qty--; if(c[idx].qty<=0) c.splice(idx,1); }
      else c.splice(idx,1);
      writeCart(c);
      /* Re-render INSIDE the panel. Replacing the panel itself via
         outerHTML throws when its parent is the shadow root, and the
         drawer silently froze on its first numbers - the steppers wrote
         the cart but the customer never saw it change. */
      pn.innerHTML=cartInner();
    });
    var sc=sh.querySelector('.scrim'); if(sc) sc.addEventListener('click', closeOverlay);
  }

  /* ---------- checkout ---------- */
  function goCheckout(){
    var cart=readCart(); if(!cart.length) return;
    if(cfg.checkoutUrl){
      /* External checkout page: hand the cart over in the URL, because
         localStorage never crosses origins. */
      var payload=cart.map(function(i){return {id:i.id,qty:i.qty};});
      var sep=cfg.checkoutUrl.indexOf('?')===-1?'?':'&';
      window.location.href=cfg.checkoutUrl+sep+'store='+encodeURIComponent(state.ownerId||cfg.userId||'')
        +'&cart='+encodeURIComponent(JSON.stringify(payload));
      return;
    }
    var s=state.settings||{};
    var needShip=!!s.shipping_enabled;
    var sub=cart.reduce(function(a,i){return a+Number(i.price||0)*i.qty;},0);
    var t=totals(sub), cur=cartCurrency();
    var sums='<div class="sum"><span>Subtotal</span><span>'+esc(fmt(t.sub,cur))+'</span></div>'
      +(t.ship!=null?'<div class="sum"><span>Shipping</span><span>'+(t.ship===0?'Free':esc(fmt(t.ship,cur)))+'</span></div>':'')
      +(t.tax!=null&&t.tax>0?'<div class="sum"><span>Tax ('+t.taxRate+'%)</span><span>'+esc(fmt(t.tax,cur))+'</span></div>':'')
      +(t.taxIncluded?'<div class="sum"><span>Tax</span><span>Included</span></div>':'')
      +'<div class="sum tt"><span>Total</span><span>'+esc(fmt(t.total,cur))+'</span></div>';
    var sh=overlay('sheet',
      '<div class="phead"><button class="ibtn" data-back aria-label="Back to bag">'+I.back+'</button>'
      +'<span class="t">Checkout</span><button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
      +'<div class="pbody"><div class="f">'
      +'<div class="fl">Contact</div>'
      +'<input class="fi" data-f="name" placeholder="Full name" autocomplete="name"/>'
      +'<input class="fi" data-f="email" type="email" placeholder="Email" autocomplete="email"/>'
      +'<input class="fi" data-f="phone" type="tel" placeholder="Phone (optional)" autocomplete="tel"/>'
      +(needShip
        ? '<div class="fl">Delivery address</div>'
          +'<input class="fi" data-f="line1" placeholder="Address line 1" autocomplete="address-line1"/>'
          +'<input class="fi" data-f="line2" placeholder="Address line 2 (optional)" autocomplete="address-line2"/>'
          +'<div class="f2"><input class="fi" data-f="city" placeholder="City" autocomplete="address-level2"/>'
          +'<input class="fi" data-f="postal_code" placeholder="Postcode" autocomplete="postal-code"/></div>'
          +'<input class="fi" data-f="country" placeholder="Country" autocomplete="country-name"/>'
        : '')
      +'<div class="err" data-err></div>'
      +'</div></div>'
      +'<div class="pfoot"><div class="sums">'+sums+'</div>'
      +'<button class="btn wide" data-place>Place order</button></div>');
    var pn=sh.querySelector('.panel');
    function val(k){ var el=pn.querySelector('[data-f="'+k+'"]'); return el?el.value.trim():''; }
    pn.addEventListener('click', function(e){
      var b=e.target.closest?e.target.closest('button'):e.target; if(!b) return;
      if(b.hasAttribute('data-close')){ closeOverlay(); return; }
      if(b.hasAttribute('data-back')){ openCart(); return; }
      if(!b.hasAttribute('data-place')) return;
      var err=pn.querySelector('[data-err]');
      var name=val('name'), email=val('email');
      if(!name){ err.textContent='Please enter your name.'; return; }
      if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ err.textContent='Please enter a valid email.'; return; }
      if(needShip && (!val('line1')||!val('city')||!val('postal_code')||!val('country'))){ err.textContent='Please complete the delivery address.'; return; }
      err.textContent='';
      b.disabled=true; b.textContent='Placing order\\u2026';
      /* the pay page brings the customer back here; strip any stale
         order params so the return reads clean */
      var returnUrl = location.origin + location.pathname + location.hash;
      var body={
        user_id: state.ownerId||cfg.userId,
        return_url: returnUrl,
        items: readCart().map(function(i){return {id:i.id,qty:i.qty};}),
        customer:{ email:email, name:name, phone:val('phone')||undefined,
          address: needShip? {line1:val('line1'),line2:val('line2')||undefined,city:val('city'),postal_code:val('postal_code'),country:val('country')} : undefined }
      };
      fetch(CK+'/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json();})
        .then(function(d){
          if(!d || d.error || !d.session_id) throw new Error((d&&d.error)||'Could not create the order');
          /* Hand over to the Quooro pay page: order summary, secure
             card payment when the store has Stripe, a clear receipt
             otherwise. The cart survives until the order is confirmed
             or paid - abandoning payment must not empty the bag. */
          if(d.pay_url){ window.location.href=d.pay_url; return null; }
          return fetch(CK+'/confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session_id:d.session_id})})
            .then(function(r){return r.json();})
            .then(function(c){ return {sid:d.session_id,total:d.total,cur:d.currency,redirect:(c&&c.redirect)||null}; });
        })
        .then(function(res){
          if(!res) return;
          writeCart([]);
          showSuccess(res, email);
        })
        .catch(function(ex){
          b.disabled=false; b.textContent='Place order';
          err.textContent=(ex&&ex.message)||'Something went wrong. Please try again.';
        });
    });
    sh.querySelector('.scrim').addEventListener('click', closeOverlay);
  }

  /* ---------- returning from the pay page ---------- */
  function handleReturn(){
    var m=location.search.match(/[?&]q_order=([a-zA-Z0-9-]+)/);
    if(!m) return;
    var oid=m[1];
    try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}
    fetch(CK+'/'+encodeURIComponent(oid))
      .then(function(r){return r.json();})
      .then(function(d){
        var o=d&&d.session; if(!o) return;
        if(o.payment_status==='paid'||o.status==='confirmed'||o.status==='paid'){
          writeCart([]);
          var paid=o.payment_status==='paid';
          var note=paid
            ? 'Payment received. A confirmation will be sent to '+esc(o.customer_email||'your email')+'.'
            : 'The store will email '+esc(o.customer_email||'you')+' to confirm your order and arrange payment.';
          var sh=overlay('sheet',
            '<div class="phead"><span class="t">'+(paid?'Payment received':'Order placed')+'</span>'
            +'<button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
            +'<div class="pbody"><div class="done"><div class="ok">'+I.check+'</div>'
            +'<h3>Thank you'+(o.customer_name?', '+esc(String(o.customer_name).split(' ')[0]):'')+'</h3>'
            +'<div class="ref">Order '+esc(String(o.id).slice(0,8))+'</div>'
            +'<div class="note">'+note+'</div>'
            +'<button class="ghost" data-close style="margin-top:8px">Continue shopping</button>'
            +'</div></div>');
          sh.querySelector('.panel').addEventListener('click', function(e){
            var b=e.target.closest?e.target.closest('button'):null;
            if(b && b.hasAttribute('data-close')) closeOverlay();
          });
          sh.querySelector('.scrim').addEventListener('click', closeOverlay);
        }
      })
      .catch(function(){ /* the pay page already told the customer; stay quiet */ });
  }

  function showSuccess(res, email){
    var note='The store will email '+esc(email)+' to confirm your order and arrange payment.';
    var sh=overlay('sheet',
      '<div class="phead"><span class="t">Order placed</span><button class="ibtn" data-close aria-label="Close">'+I.x+'</button></div>'
      +'<div class="pbody"><div class="done"><div class="ok">'+I.check+'</div>'
      +'<h3>Thank you</h3>'
      +'<div class="ref">Order '+esc(String(res.sid).slice(0,8))+'</div>'
      +'<div class="note">'+note+'</div>'
      +(res.redirect?'<a class="btn" style="text-decoration:none;margin-top:8px" href="'+esc(res.redirect)+'">Continue</a>'
                    :'<button class="ghost" data-close style="margin-top:8px">Continue shopping</button>')
      +'</div></div>');
    sh.querySelector('.panel').addEventListener('click', function(e){
      var b=e.target.closest?e.target.closest('button'):null;
      if(b && b.hasAttribute('data-close')) closeOverlay();
    });
    sh.querySelector('.scrim').addEventListener('click', closeOverlay);
  }

  /* ---------- wire the grid roots ---------- */
  targets.forEach(function(host){
    var sh=renderRoot(host);
    shadows.push(sh);
    var sbox=sh.querySelector('.sbox'), sin=sh.querySelector('.sin');
    sh.addEventListener('click', function(e){
      var t=e.target.closest?e.target.closest('[data-s],[data-sc],[data-add],[data-open-cart],.card'):e.target;
      if(!t) return;
      if(t.hasAttribute && t.hasAttribute('data-s')){
        if(sbox.classList.contains('open') && !sin.value){ sbox.classList.remove('open'); }
        else { sbox.classList.add('open'); sin.focus(); }
        return;
      }
      if(t.hasAttribute && t.hasAttribute('data-sc')){
        sin.value=''; state.q=''; sbox.classList.remove('has'); renderGrid(); sin.focus(); return;
      }
      if(t.hasAttribute && t.hasAttribute('data-add')){ e.stopPropagation(); addToCart(t.getAttribute('data-add'),1); return; }
      if(t.hasAttribute && t.hasAttribute('data-open-cart')){ openCart(); return; }
      if(t.classList && t.classList.contains('card')){ openDetail(t.getAttribute('data-p')); }
    });
    sin.addEventListener('input', function(){
      state.q=sin.value; sbox.classList.toggle('has', !!sin.value); renderGrid();
    });
    sin.addEventListener('keydown', function(e){ if(e.key==='Escape'){ sin.value=''; state.q=''; sbox.classList.remove('has'); renderGrid(); sbox.classList.remove('open'); } });
    sin.addEventListener('blur', function(){ if(!sin.value) sbox.classList.remove('open'); });
  });

  /* ---------- load ---------- */
  var qs=new URLSearchParams();
  if(cfg.userId) qs.set('user_id',cfg.userId);
  if(cfg.siteId) qs.set('site_id',cfg.siteId);
  qs.set('limit',String(cfg.limit));
  fetch(EP+'?'+qs.toString())
    .then(function(r){return r.json();})
    .then(function(d){
      state.products=(d&&d.products)||[];
      state.settings=(d&&d.settings)||null;
      state.ownerId=(d&&d.owner_id)||cfg.userId||'';
      state.loaded=true;
      /* settings may carry the merchant's accent - re-apply tokens */
      theme=null; targets.forEach(function(host){ theme=theme||themeOf(host); applyTokens(host,theme); });
      renderGrid(); renderCount();
      handleReturn();
    })
    .catch(function(){
      shadows.forEach(function(sh){ sh.querySelector('.q-grid').innerHTML='<div class="empty">Unable to load products</div>'; });
    });
})();
/*__WIDGET_END__*/`;
