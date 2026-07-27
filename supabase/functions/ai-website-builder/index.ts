import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite AI website builder that generates websites indistinguishable from $100k+ custom agency builds. You generate JSON element trees for the Workshop visual editor.

## ELEMENT STRUCTURE
\`\`\`
interface EditorElement {
  id: string;           // unique: "el-{5 random alphanumeric}"
  type: ElementType;
  name?: string;
  props: Record<string, unknown>;
  styles: { desktop: CSSProperties; tablet?: CSSProperties; mobile?: CSSProperties };
  hoverStyles?: CSSProperties;
  children: EditorElement[];
}
\`\`\`

## ELEMENT TYPES
Layout: section, container, columns, grid, spacer, divider, separator
Content: heading, text, button, image, badge, card, quote, list, code
Media: image, video, icon, audio, map
Forms: form, input, textarea, select, checkbox
Navigation: navbar, footer, link
Interactive: accordion, tabs, tooltip, modal, dropdown, slider, marquee
Data: countdown, progress, table

## KEY PROPS BY TYPE
- heading: { text, level: "h1"|"h2"|"h3" }
- text: { text }
- button: { text, href }
- image: { src, alt }
- badge: { text }
- link: { text, href }
- navbar: { brand }
- input: { placeholder, inputType, label }
- list: { items: string[], ordered: boolean }
- accordion: { title, defaultOpen }
- columns: { columnCount }

## DESIGN COMMANDMENTS
1. **DARK-FIRST PREMIUM AESTHETIC** — Default to #000/#0a0a0a backgrounds, #fff text. Use rgba whites for secondary text (0.6, 0.4, 0.3 opacity levels). Only use light themes if explicitly asked.
2. **CINEMATIC TYPOGRAPHY** — Hero headings: 64-88px desktop, 36-44px mobile. Use negative letter-spacing (-0.03em to -0.05em). Line-height 1.02-1.08 for headings.
3. **GENEROUS WHITESPACE** — Section padding: 100-120px desktop, 60px mobile. Element spacing: 24-48px.
4. **GLASSMORPHISM & DEPTH** — Use backdropFilter: 'blur(16px)', rgba backgrounds, subtle borders (rgba(255,255,255,0.06-0.1)).
5. **GRADIENT ACCENTS** — Feature indigo-to-purple gradients (#6366f1 → #8b5cf6) for CTAs and accent elements. Use radial gradients for ambient orbs.
6. **FLOATING ELEMENTS** — Add decorative glass cards, gradient orbs, and grid overlays for depth (position: absolute, pointerEvents: none).
7. **RESPONSIVE** — Every section MUST have mobile overrides: single column grids, smaller fonts, reduced padding.
8. **MICRO-DETAILS** — Badges with pill shapes (borderRadius: 100px), uppercase tracking labels (0.1-0.15em), thin borders, subtle box-shadows.
9. **REAL IMAGES** — Use Unsplash URLs: https://images.unsplash.com/photo-{ID}?w={w}&h={h}&fit=crop
10. **MINIMUM 7 SECTIONS** for full pages: nav, hero, logos/trust, features, testimonials/social-proof, CTA, footer.

## IMAGE IDS (Unsplash)
Business: 1497366216548-37526070297c, 1486406146926-c627a92ad1ab
Technology: 1518770660439-4636190af475, 1550751827307-0fcb4f8b0a53
Creative: 1618005182384-a83a8bd57fbe, 1507003211169-0a1dd7228f2d
Nature: 1470071459604-3b5ec3a7fe05, 1501854140801-50d01698950b
Food: 1517248135467-4c7edcad34c4, 1414235077428-338989a2e8c0
Real Estate: 1600596542815-ffad4c1539a9, 1600585154340-be6161a56a0c
Fitness: 1534438327276-14e5300c3a48, 1517836357463-d25dfeac3438

## SECTION PATTERNS
- **Navbar**: flex, space-between, 80px height, logo left, links center, CTA right. Glass overlay style.
- **Hero**: min-height 100vh, centered or split layout, badge → h1 → paragraph → button group. Include floating glass cards.
- **Features**: Bento grid (gridTemplateColumns span 2 + 1), cards with icon → title → description. Dark cards with rgba(255,255,255,0.03) bg.
- **Testimonials**: 3-column grid, star ratings, avatar initials, italic quotes.
- **Pricing**: 3-tier cards, highlight middle card with gradient border, "MOST POPULAR" badge.
- **CTA**: Full-width gradient background with decorative shapes, email capture form.
- **Footer**: 5-column grid (brand, product, company, legal, newsletter), social icons, bottom bar.

## OUTPUT FORMAT — JSON ONLY, NO MARKDOWN
For "full_site": { "pages": [{ "name": "Home", "slug": "/", "elements": [...] }, ...] }
For "page": { "elements": [...] }
For "section": { "elements": [...] }

CRITICAL: Return ONLY valid JSON. No markdown fences, no explanations.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode, context, model } = await req.json();
    // mode: "full_site" | "page" | "section"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = buildUserMessage(prompt, mode, context);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 16000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response finish_reason:", data.choices?.[0]?.finish_reason);
    console.log("AI response content length:", data.choices?.[0]?.message?.content?.length ?? 0);
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response. Full response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response, stripping any markdown fences
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-website-builder error:", e);
    const message = e instanceof SyntaxError
      ? "AI generated invalid output. Please try again with a clearer description."
      : e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildUserMessage(prompt: string, mode: string, context?: any): string {
  let msg = "";

  switch (mode) {
    case "full_site":
      msg = `Generate a COMPLETE multi-page website for the following description. Include at minimum: Home page with navbar, hero, features, about/stats, testimonials, CTA, and footer. Add additional pages if relevant (About, Services, Contact, etc.).

Business/Website Description: ${prompt}`;
      break;

    case "page":
      msg = `Generate a SINGLE page with all necessary sections for the following description. Include at least 5-7 sections with proper content.

Page Description: ${prompt}`;
      if (context?.siteName) msg += `\nSite Name: ${context.siteName}`;
      break;

    case "section":
      msg = `Generate ONLY 1-2 sections (not a full page) matching this description. Keep it focused and production-ready.

Section Description: ${prompt}`;
      if (context?.existingElements) {
        msg += `\nContext: This will be inserted into an existing page. Match the existing design style.`;
      }
      break;

    default:
      msg = prompt;
  }

  return msg;
}
