import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Provider selection.
 *
 * This function used to be hard-wired to Lovable's AI gateway on
 * LOVABLE_API_KEY. That is a dependency on the platform this project is
 * migrating off, so the writing assistant would have died the moment that key
 * was revoked. It now talks to whichever provider is configured, and the
 * Lovable gateway is only a last-resort fallback so nothing breaks mid-move.
 *
 * Resolution order (first key present wins):
 *   1. ANTHROPIC_API_KEY  -> api.anthropic.com          (recommended)
 *   2. OPENAI_API_KEY     -> api.openai.com
 *   3. LOVABLE_API_KEY    -> ai.gateway.lovable.dev     (legacy)
 *
 * Override explicitly with DOC_AI_PROVIDER = anthropic | openai | lovable.
 * Override the model with DOC_AI_MODEL. To cut the Lovable dependency for
 * good, set ANTHROPIC_API_KEY and unset LOVABLE_API_KEY.
 */
type Provider = "anthropic" | "openai" | "lovable";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
  lovable: "google/gemini-3-flash-preview",
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
    lovable: Deno.env.get("LOVABLE_API_KEY") || undefined,
  };

  const order: Provider[] = explicit && keys[explicit]
    ? [explicit]
    : ["anthropic", "openai", "lovable"];

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

  // OpenAI and the Lovable gateway both speak the chat/completions shape.
  const endpoint = cfg.provider === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : "https://ai.gateway.lovable.dev/v1/chat/completions";

  const res = await fetch(endpoint, {
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
  if (!res.ok) throw await providerError(res, cfg.provider === "openai" ? "OpenAI" : "AI gateway");
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
            "No AI provider configured. Set ANTHROPIC_API_KEY (recommended), OPENAI_API_KEY, or LOVABLE_API_KEY on this project.",
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
