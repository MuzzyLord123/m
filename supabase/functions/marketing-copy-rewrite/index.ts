const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Lovable has been removed entirely (2026-07-28, owner decision): no
 * LOVABLE_API_KEY, no ai.gateway.lovable.dev. Providers are Anthropic or
 * OpenAI only. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY.
 * AI_PROVIDER / AI_MODEL override the choice.
 *
 * This function also previously imported corsHeaders from
 * 'npm:@supabase/supabase-js@2/cors', which is not a real export - it could
 * never bundle.
 */
type Provider = 'anthropic' | 'openai';

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o-mini',
};

interface ProviderConfig { provider: Provider; apiKey: string; model: string; }

function resolveProvider(): ProviderConfig | null {
  const explicit = (Deno.env.get('AI_PROVIDER') || '').toLowerCase() as Provider | '';
  const keys: Record<Provider, string | undefined> = {
    anthropic: Deno.env.get('ANTHROPIC_API_KEY') || undefined,
    openai: Deno.env.get('OPENAI_API_KEY') || undefined,
  };
  const order: Provider[] = explicit && keys[explicit] ? [explicit] : ['anthropic', 'openai'];
  for (const p of order) {
    const apiKey = keys[p];
    if (apiKey) return { provider: p, apiKey, model: Deno.env.get('AI_MODEL') || DEFAULT_MODELS[p] };
  }
  return null;
}

interface Body { text: string; tone: string; field?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const cfg = resolveProvider();
    if (!cfg) {
      return new Response(JSON.stringify({
        error: 'No AI provider configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY on this project.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as Body;
    if (!body?.text || !body?.tone) {
      return new Response(JSON.stringify({ error: 'text and tone are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `You are an elite marketing copywriter for Quooro, a premium UK Digital Operations Platform. Rewrite the provided ${body.field ?? 'marketing copy'} in a "${body.tone}" tone. Keep roughly the same length unless the tone is "Shorter". Return ONLY the rewritten copy - no quotes, no preamble, no explanation.`;

    let text = '';
    let upstreamStatus: number | undefined;

    if (cfg.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 2048,
          system,
          messages: [{ role: 'user', content: body.text }],
        }),
      });
      if (!res.ok) {
        upstreamStatus = res.status;
        console.error('Anthropic error:', res.status, (await res.text()).slice(0, 400));
      } else {
        const data = await res.json();
        text = (data?.content ?? [])
          .filter((b: { type?: string }) => b?.type === 'text')
          .map((b: { text?: string }) => b.text ?? '')
          .join('')
          .trim();
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: body.text },
          ],
        }),
      });
      if (!res.ok) {
        upstreamStatus = res.status;
        console.error('OpenAI error:', res.status, (await res.text()).slice(0, 400));
      } else {
        const data = await res.json();
        text = (data?.choices?.[0]?.message?.content ?? '').trim();
      }
    }

    if (upstreamStatus) {
      const status = upstreamStatus === 429 || upstreamStatus === 402 ? upstreamStatus : 502;
      return new Response(JSON.stringify({
        error: upstreamStatus === 429
          ? 'Rate limit exceeded. Please try again in a moment.'
          : upstreamStatus === 402
          ? 'AI credits exhausted. Please add credits.'
          : 'AI provider error',
      }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ text, provider: cfg.provider, model: cfg.model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
