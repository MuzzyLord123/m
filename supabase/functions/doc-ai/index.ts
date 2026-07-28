import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Provider selection.
 *
 * Lovable has been removed entirely (2026-07-28, owner decision): no
 * LOVABLE_API_KEY, no ai.gateway.lovable.dev, not even as a fallback.
 *
 * Resolution order (first key present wins):
 *   1. ANTHROPIC_API_KEY  -> api.anthropic.com   (recommended)
 *   2. OPENAI_API_KEY     -> api.openai.com
 *
 * Override explicitly with DOC_AI_PROVIDER = anthropic | openai, and the model
 * with DOC_AI_MODEL. With neither key set the function returns 503 with an
 * actionable message rather than silently failing.
 */
type Provider = "anthropic" | "openai";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
};

interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
}

function resolveProvider(): ProviderConfig | null {
  const explicit = (Deno.env.get("DOC_AI_PROVIDER") || "").toLowerCase() as Provider | "";
  const keys: Record<Provider, string | undefined> = {
    anthropic: Deno.env.get("ANTHROPIC_API_KEY") || undefined,
    openai: Deno.env.get("OPENAI_API_KEY") || undefined,
  };

  const order: Provider[] = explicit && keys[explicit]
    ? [explicit]
    : ["anthropic", "openai"];

  for (const p of order) {
    const apiKey = keys[p];
    if (apiKey) {
      return { provider: p, apiKey, model: Deno.env.get("DOC_AI_MODEL") || DEFAULT_MODELS[p] };
    }
  }
  return null;
}

const SYSTEM_PROMPT =
  "You are a writing assistant. Follow instructions precisely. Return only the requested output with no extra commentary.";

/** Normalises upstream failures so the client sees a consistent status. */
async function providerError(res: Response, label: string): Promise<Error & { status?: number }> {
  const body = await res.text();
  console.error(`${label} error:`, res.status, body);
  const err = new Error(
    res.status === 429
      ? "Rate limit exceeded. Please try again in a moment."
      : res.status === 402
      ? "AI credits exhausted. Please add credits."
      : `${label} error`,
  ) as Error & { status?: number };
  err.status = res.status === 429 || res.status === 402 ? res.status : 502;
  return err;
}

/** Calls the chosen provider and returns the assistant's text. */
async function complete(cfg: ProviderConfig, userPrompt: string): Promise<string> {
  if (cfg.provider === "anthropic") {
    // Anthropic Messages API: `system` is a top-level field rather than a
    // message role, and the reply is a content-block array, not choices[].
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) throw await providerError(res, "Anthropic");
    const data = await res.json();
    return (data?.content ?? [])
      .filter((b: { type?: string }) => b?.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("")
      .trim();
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw await providerError(res, "OpenAI");
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, action } = await req.json();

    const cfg = resolveProvider();
    if (!cfg) {
      return new Response(
        JSON.stringify({
          error:
            "No AI provider configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY on this project.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompts: Record<string, string> = {
      summarize: `Summarize the following text concisely in 2-3 sentences. Return ONLY the summary, no preamble:\n\n${text}`,
      expand: `Expand the following text with more detail, examples, and depth. Keep the same tone and style. Return ONLY the expanded text:\n\n${text}`,
      rewrite: `Rewrite the following text to be clearer and more professional. Keep the same meaning. Return ONLY the rewritten text:\n\n${text}`,
      shorten: `Make the following text more concise while keeping the key points. Return ONLY the shortened text:\n\n${text}`,
      fix_grammar: `Fix all grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text:\n\n${text}`,
      formal: `Rewrite the following text in a formal, professional tone. Return ONLY the rewritten text:\n\n${text}`,
      casual: `Rewrite the following text in a casual, conversational tone. Return ONLY the rewritten text:\n\n${text}`,
      translate_es: `Translate the following text to Spanish. Return ONLY the translation:\n\n${text}`,
      translate_fr: `Translate the following text to French. Return ONLY the translation:\n\n${text}`,
      translate_de: `Translate the following text to German. Return ONLY the translation:\n\n${text}`,
      translate_zh: `Translate the following text to Chinese (Simplified). Return ONLY the translation:\n\n${text}`,
      translate_ja: `Translate the following text to Japanese. Return ONLY the translation:\n\n${text}`,
      translate_ko: `Translate the following text to Korean. Return ONLY the translation:\n\n${text}`,
      translate_pt: `Translate the following text to Portuguese. Return ONLY the translation:\n\n${text}`,
      translate_ar: `Translate the following text to Arabic. Return ONLY the translation:\n\n${text}`,
      continue: `Continue writing from where the following text ends. Match the style, tone, and context. Write 2-3 more sentences. Return ONLY the continuation (do not repeat the original text):\n\n${text}`,
    };

    const prompt = prompts[action];
    if (!prompt) throw new Error(`Unknown action: ${action}`);

    const result = await complete(cfg, prompt);

    return new Response(JSON.stringify({ result, provider: cfg.provider, model: cfg.model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    console.error("doc-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
