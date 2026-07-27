import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body { text: string; tone: string; field?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.text || !body?.tone) {
      return new Response(JSON.stringify({ error: 'text and tone are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `You are an elite marketing copywriter for Quooro, a premium UK Digital Operations Platform. Rewrite the provided ${body.field ?? 'marketing copy'} in a "${body.tone}" tone. Keep roughly the same length unless the tone is "Shorter". Return ONLY the rewritten copy — no quotes, no preamble, no explanation.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: body.text },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: 'AI gateway error', detail: errText }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim?.() ?? '';
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
