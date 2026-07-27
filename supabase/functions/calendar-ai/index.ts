import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a calendar scheduling assistant. Parse natural language scheduling requests into structured JSON.

Current date: ${todayStr} (${dayOfWeek})
Current time: ${now.toTimeString().slice(0, 5)}

RULES:
- If no date specified, assume today or tomorrow (whichever makes more sense based on time)
- If no end time, assume 1 hour duration
- Use ISO 8601 format for dates/times with timezone offset
- "morning" = 9:00 AM, "afternoon" = 2:00 PM, "evening" = 6:00 PM
- "lunch" = 12:00 PM, "dinner" = 7:00 PM
- Parse attendee names but don't fabricate emails
- Detect recurrence patterns like "every Monday", "daily", "weekly"

You MUST respond using the provided tool.`,
            },
            { role: "user", content: message },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_event",
                description: "Create a calendar event from parsed natural language",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Event title" },
                    start_time: { type: "string", description: "ISO 8601 start datetime" },
                    end_time: { type: "string", description: "ISO 8601 end datetime" },
                    location: { type: "string", description: "Event location" },
                    is_all_day: { type: "boolean", description: "Whether it's an all-day event" },
                    attendees: {
                      type: "array",
                      items: { type: "string" },
                      description: "Attendee names",
                    },
                    recurrence: { type: "string", description: "Recurrence pattern description" },
                    reminder_minutes: { type: "number", description: "Minutes before to remind" },
                  },
                  required: ["title", "start_time", "end_time"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_event" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse event" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calendar-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
