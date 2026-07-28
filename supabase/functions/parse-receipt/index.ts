import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Lovable removed entirely (2026-07-28, owner decision). Vision-capable
 * providers only: Anthropic (recommended) or OpenAI. Both take the receipt as
 * a base64 image, but the request shapes differ - Anthropic uses an
 * image content block with a `source` object, OpenAI uses an image_url with a
 * data: URI.
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

const PROMPT = `You are a receipt parser. Analyze this receipt image and extract the following information. Be precise with amounts. If you cannot determine a field, use null.

Return ONLY a valid JSON object with these exact fields:
{
  "title": "Brief description of the purchase (e.g. 'Lunch at Cafe Roma', 'Office supplies from Staples')",
  "amount": 0.00,
  "currency": "GBP or USD or EUR (detect from receipt, default to GBP)",
  "vendor": "Store/restaurant/business name",
  "date": "YYYY-MM-DD format if visible, otherwise null",
  "category": "One of: Travel, Software, Meals, Office, Marketing, Other",
  "notes": "Any additional relevant info like payment method, tax amount, individual items etc."
}

Do NOT include any markdown formatting, code blocks, or explanation. Return ONLY the JSON object.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cfg = resolveProvider();
    if (!cfg) {
      return new Response(JSON.stringify({
        error: 'No AI provider configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY on this project.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mediaType = mimeType || 'image/jpeg';
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
          max_tokens: 1024,
          temperature: 0,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
              { type: 'text', text: PROMPT },
            ],
          }],
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
          .join('');
      }
    } else {
      const dataUrl = `data:${mediaType};base64,${imageBase64}`;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          }],
          max_tokens: 1024,
          temperature: 0,
        }),
      });
      if (!res.ok) {
        upstreamStatus = res.status;
        console.error('OpenAI error:', res.status, (await res.text()).slice(0, 400));
      } else {
        const data = await res.json();
        text = data?.choices?.[0]?.message?.content ?? '';
      }
    }

    if (upstreamStatus) {
      const status = upstreamStatus === 429 || upstreamStatus === 402 ? upstreamStatus : 502;
      return new Response(JSON.stringify({
        error: upstreamStatus === 429
          ? 'Rate limit exceeded. Please try again in a moment.'
          : upstreamStatus === 402
          ? 'AI credits exhausted. Please add credits.'
          : `AI processing failed [${upstreamStatus}]`,
      }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Could not parse receipt data', raw: text }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, data: parsed, provider: cfg.provider }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Parse receipt error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
