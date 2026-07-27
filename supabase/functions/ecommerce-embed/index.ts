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

    // ---- Products JSON feed ----
    if (action === 'products') {
      const userId = url.searchParams.get('user_id');
      const siteId = url.searchParams.get('site_id');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '48', 10) || 48, 200);
      if (!userId && !siteId) return json({ error: 'user_id or site_id required' }, 400);

      let q = supabase
        .from('products')
        .select('id,name,slug,short_description,description,price,compare_at_price,currency,images,status,is_featured,inventory_count,track_inventory,tags')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .limit(limit);
      if (siteId) q = q.eq('site_id', siteId);
      else if (userId) q = q.eq('user_id', userId);

      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ products: data ?? [] });
    }

    // ---- Widget JS (default) ----
    if (action === '' || action === 'ecommerce-embed' || action === 'widget.js' || action === 'embed.js') {
      const endpoint = `${SUPA_URL}/functions/v1/ecommerce-embed/products`;
      const script = buildWidgetScript(endpoint);
      return js(script);
    }

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function buildWidgetScript(endpoint: string): string {
  // Self-contained IIFE. Reads config from the <script data-*> tag,
  // renders a shadow-DOM widget into every [data-quooro-shop] target
  // (or after the script tag). Inherits colors/fonts from host page.
  return `(function(){
  var THIS = document.currentScript;
  if(!THIS){ var all=document.querySelectorAll('script[data-quooro]'); THIS=all[all.length-1]; }
  var cfg = {
    userId: THIS && THIS.getAttribute('data-user-id') || '',
    siteId: THIS && THIS.getAttribute('data-site-id') || '',
    columns: parseInt(THIS && THIS.getAttribute('data-columns') || '3', 10),
    limit: parseInt(THIS && THIS.getAttribute('data-limit') || '24', 10),
    currency: (THIS && THIS.getAttribute('data-currency')) || 'GBP',
    accent: (THIS && THIS.getAttribute('data-accent')) || '',
  };
  var targets = document.querySelectorAll('[data-quooro-shop]');
  if(!targets.length){
    var mount = document.createElement('div'); mount.setAttribute('data-quooro-shop','');
    THIS && THIS.parentNode && THIS.parentNode.insertBefore(mount, THIS.nextSibling);
    targets = [mount];
  }
  var CART_KEY = 'quooro_cart_v1';
  function readCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ return []; } }
  function writeCart(c){ try{ localStorage.setItem(CART_KEY, JSON.stringify(c)); }catch(e){} renderCartAll(); }
  function fmt(v, cur){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:cur||cfg.currency}).format(Number(v||0)); }catch(e){ return (cur||cfg.currency)+' '+Number(v||0).toFixed(2); } }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  var STYLE = [
    ':host{all:initial;display:block;font-family:inherit;color:inherit;}',
    '*,*::before,*::after{box-sizing:border-box;}',
    '.wrap{font:14px/1.45 var(--q-font, inherit);color:inherit;}',
    '.toolbar{display:flex;gap:8px;align-items:center;margin:0 0 16px;flex-wrap:wrap;}',
    '.toolbar input{flex:1;min-width:160px;padding:8px 10px;border:1px solid rgba(0,0,0,.12);border-radius:8px;font:inherit;background:transparent;color:inherit;}',
    '.cart-btn{padding:8px 14px;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;}',
    '.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));}',
    '.card{border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.02);display:flex;flex-direction:column;}',
    '.thumb{aspect-ratio:1/1;background:rgba(0,0,0,.04);background-size:cover;background-position:center;}',
    '.body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;}',
    '.name{font-weight:600;font-size:14px;line-height:1.3;}',
    '.desc{opacity:.7;font-size:12px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.row{display:flex;align-items:center;justify-content:space-between;margin-top:6px;}',
    '.price{font-weight:600;}',
    '.compare{opacity:.5;text-decoration:line-through;font-size:12px;margin-left:6px;}',
    '.add{padding:6px 10px;border-radius:8px;border:0;background:var(--q-accent,#111);color:#fff;cursor:pointer;font:inherit;font-size:12px;font-weight:600;}',
    '.add:hover{opacity:.9;}',
    '.empty{padding:40px;text-align:center;opacity:.6;}',
    '.drawer-bg{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2147483646;}',
    '.drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:#fff;color:#111;z-index:2147483647;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.15);}',
    '.drawer h3{margin:0;padding:16px 18px;border-bottom:1px solid rgba(0,0,0,.08);font-size:15px;}',
    '.drawer .items{flex:1;overflow:auto;padding:8px 18px;}',
    '.item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.06);}',
    '.item img{width:52px;height:52px;object-fit:cover;border-radius:8px;background:#f2f2f2;}',
    '.item .meta{flex:1;min-width:0;}',
    '.item .n{font-weight:600;font-size:13px;}',
    '.qty{display:inline-flex;align-items:center;gap:6px;margin-top:4px;}',
    '.qty button{width:22px;height:22px;border:1px solid rgba(0,0,0,.15);background:#fff;border-radius:6px;cursor:pointer;}',
    '.foot{padding:14px 18px;border-top:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;gap:10px;}',
    '.foot .total{display:flex;justify-content:space-between;font-weight:600;}',
    '.checkout{padding:10px;border-radius:8px;background:var(--q-accent,#111);color:#fff;border:0;cursor:pointer;font-weight:600;}',
  ].join('');

  function renderRoot(host){
    var shadow = host.__q_shadow || host.attachShadow({mode:'open'});
    host.__q_shadow = shadow;
    shadow.innerHTML = '<style>'+STYLE+'</style><div class="wrap">'
      +'<div class="toolbar"><input class="q-search" placeholder="Search products…" />'
      +'<button class="cart-btn" data-open-cart>Cart (<span class="q-cart-count">0</span>)</button></div>'
      +'<div class="q-grid grid"></div></div>';
    if(cfg.accent){ shadow.host.style.setProperty('--q-accent', cfg.accent); }
    return shadow;
  }

  var state = { products: [], q: '' };
  var shadows = [];

  function renderGrid(){
    var q = state.q.trim().toLowerCase();
    var list = q ? state.products.filter(function(p){ return (p.name||'').toLowerCase().indexOf(q)>=0 || (p.short_description||'').toLowerCase().indexOf(q)>=0; }) : state.products;
    var html = list.length ? list.map(function(p){
      var img = Array.isArray(p.images) && p.images[0] ? (typeof p.images[0]==='string'? p.images[0] : (p.images[0].url||'')) : '';
      var cmp = p.compare_at_price && Number(p.compare_at_price) > Number(p.price) ? '<span class="compare">'+esc(fmt(p.compare_at_price,p.currency))+'</span>' : '';
      return '<div class="card"><div class="thumb" style="background-image:url('+JSON.stringify(img||'').slice(1,-1)+')"></div>'
        +'<div class="body"><div class="name">'+esc(p.name)+'</div>'
        +(p.short_description?'<div class="desc">'+esc(p.short_description)+'</div>':'')
        +'<div class="row"><div><span class="price">'+esc(fmt(p.price,p.currency))+'</span>'+cmp+'</div>'
        +'<button class="add" data-add="'+esc(p.id)+'">Add</button></div></div></div>';
    }).join('') : '<div class="empty">No products found</div>';
    shadows.forEach(function(sh){ sh.querySelector('.q-grid').innerHTML = html; });
  }

  function renderCartAll(){
    var cart = readCart();
    var count = cart.reduce(function(a,i){return a+(i.qty||0);},0);
    shadows.forEach(function(sh){
      var el = sh.querySelector('.q-cart-count'); if(el) el.textContent = count;
    });
  }

  function openCart(){
    var cart = readCart();
    var bg = document.createElement('div'); bg.className='';
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="q-bg" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2147483646;"></div>'
      +'<div class="q-dr" style="position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:#fff;color:#111;z-index:2147483647;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.15);font:14px/1.4 system-ui,sans-serif;">'
      +'<div style="padding:16px 18px;border-bottom:1px solid rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center;"><strong>Your cart</strong><button class="q-close" style="border:0;background:transparent;font-size:20px;cursor:pointer;">×</button></div>'
      +'<div class="q-items" style="flex:1;overflow:auto;padding:8px 18px;"></div>'
      +'<div style="padding:14px 18px;border-top:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;gap:10px;">'
      +'<div class="q-total" style="display:flex;justify-content:space-between;font-weight:600;"></div>'
      +'<button class="q-checkout" style="padding:10px;border-radius:8px;background:#111;color:#fff;border:0;cursor:pointer;font-weight:600;">Checkout</button></div></div>';
    document.body.appendChild(wrap);
    function refresh(){
      cart = readCart();
      var items = wrap.querySelector('.q-items');
      if(!cart.length){ items.innerHTML='<div style="padding:40px;text-align:center;opacity:.6">Cart is empty</div>'; }
      else items.innerHTML = cart.map(function(i){
        return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.06);"><img src="'+esc(i.image||'')+'" style="width:52px;height:52px;object-fit:cover;border-radius:8px;background:#f2f2f2"/><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">'+esc(i.name)+'</div><div style="opacity:.6;font-size:12px">'+esc(fmt(i.price,i.currency))+'</div><div style="margin-top:4px"><button data-dec="'+esc(i.id)+'" style="width:22px;height:22px;border:1px solid rgba(0,0,0,.15);background:#fff;border-radius:6px;cursor:pointer">−</button> <span>'+i.qty+'</span> <button data-inc="'+esc(i.id)+'" style="width:22px;height:22px;border:1px solid rgba(0,0,0,.15);background:#fff;border-radius:6px;cursor:pointer">+</button> <button data-rm="'+esc(i.id)+'" style="margin-left:8px;border:0;background:transparent;color:#a00;cursor:pointer">Remove</button></div></div><div style="font-weight:600">'+esc(fmt(Number(i.price)*i.qty,i.currency))+'</div></div>';
      }).join('');
      var total = cart.reduce(function(a,i){ return a + Number(i.price||0)*i.qty; }, 0);
      wrap.querySelector('.q-total').innerHTML = '<span>Total</span><span>'+esc(fmt(total))+'</span>';
    }
    refresh();
    wrap.addEventListener('click', function(e){
      var t = e.target;
      if(t.matches('.q-close, .q-bg')){ wrap.remove(); return; }
      var id = t.getAttribute('data-inc')||t.getAttribute('data-dec')||t.getAttribute('data-rm');
      if(!id) return;
      var c = readCart();
      var idx = c.findIndex(function(x){return x.id===id;});
      if(idx<0) return;
      if(t.hasAttribute('data-inc')) c[idx].qty++;
      else if(t.hasAttribute('data-dec')){ c[idx].qty--; if(c[idx].qty<=0) c.splice(idx,1); }
      else c.splice(idx,1);
      writeCart(c); refresh();
    });
    wrap.querySelector('.q-checkout').addEventListener('click', function(){
      var base = (THIS && THIS.getAttribute('data-checkout-url')) || 'https://id-preview--6fbf2a38-8cc4-4a7b-8250-344a8f1b0fb1.lovable.app/checkout';
      var sep = base.indexOf('?') === -1 ? '?' : '&';
      window.location.href = base + sep + 'store=' + encodeURIComponent(cfg.userId || '');
    });
  }

  function addToCart(id){
    var p = state.products.find(function(x){return x.id===id;});
    if(!p) return;
    var c = readCart();
    var ex = c.find(function(x){return x.id===id;});
    if(ex) ex.qty++;
    else c.push({ id:p.id, name:p.name, price:p.price, currency:p.currency, image:(p.images&&p.images[0])?(typeof p.images[0]==='string'?p.images[0]:p.images[0].url||''):'', qty:1 });
    writeCart(c);
  }

  targets.forEach(function(host){
    var sh = renderRoot(host);
    shadows.push(sh);
    sh.addEventListener('input', function(e){ if(e.target.matches('.q-search')){ state.q=e.target.value; renderGrid(); }});
    sh.addEventListener('click', function(e){
      var t = e.target;
      if(t.hasAttribute && t.hasAttribute('data-add')) addToCart(t.getAttribute('data-add'));
      if(t.hasAttribute && t.hasAttribute('data-open-cart')) openCart();
    });
  });

  var qs = new URLSearchParams();
  if(cfg.userId) qs.set('user_id', cfg.userId);
  if(cfg.siteId) qs.set('site_id', cfg.siteId);
  qs.set('limit', String(cfg.limit));
  fetch(${JSON.stringify(endpoint)}+'?'+qs.toString()).then(function(r){return r.json();}).then(function(d){
    state.products = (d && d.products) || [];
    renderGrid(); renderCartAll();
  }).catch(function(){
    shadows.forEach(function(sh){ sh.querySelector('.q-grid').innerHTML='<div class="empty">Unable to load products</div>'; });
  });
})();`;
}
