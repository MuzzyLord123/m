import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
      continue: `Continue writing from where the following text ends. Match the style, tone, and context. Write 2-3 more sentences. Return ONLY the continuation (do not repeat the original text):\n\n${text}`,
    };

    const prompt = prompts[action];
    if (!prompt) throw new Error(`Unknown action: ${action}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a writing assistant. Follow instructions precisely. Return only the requested output with no extra commentary." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
