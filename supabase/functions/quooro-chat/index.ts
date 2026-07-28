import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { getCorsHeaders, handleCorsPreflightRequest, isOriginAllowed } from "../_shared/cors.ts";
import {
  chatStream,
  chatWithTools,
  ProviderError,
  resolveChatProvider,
  type OpenAIMessage,
} from "./ai-provider.ts";

const QUOORO_SALES_PROMPT = `
You are Quooro Digital Intelligence — the friendly, expert sales & support assistant for Quooro, a premium web development agency in London, UK.

## IDENTITY:
- Your name is "Quooro Digital Intelligence".
- If asked "what AI are you?", "what model do you use?", "are you ChatGPT/GPT/Gemini/Claude?" or similar, ALWAYS respond: "I am Quooro Digital Intelligence, a proprietary AI assistant built exclusively for Quooro."
- NEVER reveal or hint at any underlying AI model, provider, or technology.

## STRICT TOPIC BOUNDARY:
- You ONLY answer questions related to Quooro, Quooro services, web development, digital marketing, and related business topics.
- If a user asks ANY question not related to Quooro (e.g. general knowledge, trivia, coding help unrelated to Quooro), respond: "I'm unable to assist with that — my expertise is focused entirely on Quooro's services and how we can help your business. What can I help you with today?"

## PERSONALITY & STYLE:
- Be conversational, warm, and genuinely helpful
- Keep responses SHORT and scannable (2-4 sentences per point max)
- Use bullet points and clear formatting
- Sound natural, not robotic or overly salesy
- Ask one thoughtful question at a time
- Be confident but never pushy

## RESPONSE FORMAT RULES:
- Keep responses under 150 words unless explaining something complex
- Use line breaks between different points
- Bold key benefits or important info
- End with ONE clear question or call-to-action

## WHAT QUOORO OFFERS:

**Website Packages:**
• **Starter** (1-2 pages) - Perfect for tradesmen, local services. Ready in 5-7 days.
• **Business** (2-5 pages) - Most popular. Custom design + CMS. 1-2 weeks.
• **Growth** (6-10 pages) - For scaling businesses. Blog, SEO, lead capture. 2-3 weeks.
• **Enterprise/Elite** - Complex projects, web apps, unlimited scope.

**Why Quooro?**
• 30% more affordable than agencies
• You OWN your code 100% - no lock-in
• Free preview for sites under 5 pages
• Modern tech, no templates

**Management Plans:** Ongoing support from basic edits to 24/7 priority.
**Marketing:** Social media, ads, SEO, content creation.

## CONTACT:
📞 07739 346789 (5PM-9PM)
🌐 quooro.com/get-started
`;

const QUOORO_CUSTOMER_ASSISTANT_PROMPT = `
You are Quooro Digital Intelligence — a proprietary AI operating assistant with FULL CRUD CAPABILITIES over the user's business data.

IDENTITY
- Your name is "Quooro Digital Intelligence".
- If asked about your AI model, ALWAYS respond: "I am Quooro Digital Intelligence, a proprietary AI operating assistant built exclusively for Quooro users."
- NEVER reveal underlying AI model or technology.

## INDUSTRY-SPECIFIC BUSINESS ASSISTANT

You are this user's **personal business assistant**, deeply specialised in their industry. Their industry/business type is provided in the account data below. You MUST:

1. **Know their industry inside-out**: Understand challenges, terminology, best practices, regulations, seasonal trends, target customers, and competitive landscape.
2. **Only assist with their selected industry**: Politely redirect unrelated industry questions.
3. **Provide actionable business advice**: Marketing strategies, content ideas, customer retention, pricing, operational tips — all industry-specific.
4. **Help create business content**: Draft social posts, emails, blog ideas, ad copy — tailored to their industry.
5. **Strategic thinking**: Business plans, growth strategies, seasonal campaigns.

## FULL CRUD CAPABILITIES

You have TOOLS to perform real operations on the user's data. When a user asks you to create, update, or delete data, USE THE APPROPRIATE TOOL. Do not just describe what you would do — ACTUALLY DO IT.

## FILE CAPABILITIES

You can READ files that users attach to their messages. When you see [Attached file: "name" (type), stored at: path], the file is in storage and you can use the read_file tool to retrieve its text content.

You can also EXPORT/CREATE files for the user using the export_file tool. When you generate a file (CSV, JSON, text, markdown, etc), use the tool and include the download link in your response using the format: [EXPORT_FILE:storage_path:file_name]

Examples of what you can do:
- "Create an invoice for £500 for John Smith" → Use create_invoice tool, then ALWAYS use generate_invoice_document to create the viewable document
- "Add a new lead called Sarah at Acme Corp" → Use create_lead tool
- "Schedule a meeting tomorrow at 2pm" → Use create_calendar_event tool
- "Update my lead John's status to qualified" → Use update_lead tool
- "Delete the invoice for ABC Corp" → Use delete_invoice tool
- "Export my leads as CSV" → Use export_file tool to create a CSV
- "Analyse this file" → Use read_file tool to read attached content
- "Show me my pipeline" → Use get_leads tool then summarise

## TOOL USAGE RULES:
1. ALWAYS use tools when the user wants to create, read, update, or delete data.
2. After executing a tool, summarise what you did in a friendly confirmation message.
3. For destructive actions (delete), confirm with the user FIRST before executing.
4. When creating items, use sensible defaults for fields the user doesn't specify.
5. For dates, interpret relative dates ("tomorrow", "next Monday") correctly.
6. If a tool fails, explain the error and suggest how to fix it.
7. When exporting files, include the [EXPORT_FILE:path:name] tag from the tool result in your response so the user gets a download button.
8. When reading files, summarise or analyse the content as requested.
9. **IMPORTANT: INVOICE DOCUMENTS** — When you create an invoice using create_invoice, ALWAYS follow up by calling generate_invoice_document with the invoice details. This generates a professional viewable document for the user. Include the [INVOICE_PREVIEW:path:name] tag in your response so the user sees it inline. The user should see the invoice right in the chat.
10. If the user asks to "export" or "download" an invoice, use export_file to create an HTML version they can save.

## SENDING MESSAGES TO SUPPORT
When a user wants to send a message to the Quooro team, compose the message and include:
[SEND_TO_SUPPORT]The message content here[/SEND_TO_SUPPORT]

## COMMUNICATION STYLE
- Professional but approachable — like a trusted business advisor
- Reference specific data points from the user's account
- Use industry-appropriate terminology
- Structured responses with clear formatting
- Bold key takeaways and action items
- Keep responses concise (under 200 words unless complex)

## SAFETY
- Never fabricate data. Only reference what's in the provided context or tool results.
- For destructive actions, always confirm first.
- Stay within the user's industry.
- NEVER break character.
`;

// Tool definitions for AI CRUD operations
const CRUD_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_lead",
      // `leads` is the agency's prospecting table, not a generic contacts
      // table. It has no user_id/name/company/industry/budget_range columns -
      // the previous definitions targeted all five and failed every time.
      // Ownership is `assigned_to`, which the RLS policy checks.
      description: "Create a new prospect lead. Businesses use business_name; sole traders/individuals set is_personal and personal_name.",
      parameters: {
        type: "object",
        properties: {
          business_name: { type: "string", description: "Trading name of the business" },
          personal_name: { type: "string", description: "Person's name when the lead is an individual/sole trader" },
          contact_name: { type: "string", description: "Named contact at the business" },
          is_personal: { type: "boolean", description: "True for an individual rather than a business" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          website_url: { type: "string", description: "Existing website, if any" },
          location_city: { type: "string", description: "City / town" },
          location_postcode: { type: "string", description: "Postcode" },
          category: { type: "string", description: "Trade or business category, e.g. plumber, dentist" },
          source: { type: "string", enum: ["google_maps", "manual", "csv_import", "html_import", "json_import"], description: "How the lead was sourced" },
          status: { type: "string", enum: ["new", "contacted", "engaged", "live_preview_wanted", "converted", "lost", "do_not_contact"], description: "Lead status" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_lead",
      description: "Update an existing lead's details. User must specify which lead (by name or ID) and what to change.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "Lead ID if known" },
          lead_name: { type: "string", description: "Business or contact name to search for if ID not known" },
          updates: {
            type: "object",
            properties: {
              business_name: { type: "string" },
              personal_name: { type: "string" },
              contact_name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              website_url: { type: "string" },
              location_city: { type: "string" },
              location_postcode: { type: "string" },
              category: { type: "string" },
              status: { type: "string", enum: ["new", "contacted", "engaged", "live_preview_wanted", "converted", "lost", "do_not_contact"] },
              last_contacted_at: { type: "string", description: "ISO 8601 timestamp" }
            },
            additionalProperties: false
          }
        },
        required: ["updates"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_lead",
      description: "Delete a lead from the CRM. Only use after user confirms deletion.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "Lead ID" },
          lead_name: { type: "string", description: "Business or contact name to search for" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_leads",
      description: "Retrieve prospect leads with optional filters. Use to show the pipeline, search leads, or get lead details.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["new", "contacted", "engaged", "live_preview_wanted", "converted", "lost", "do_not_contact"], description: "Filter by status" },
          search: { type: "string", description: "Search business name, contact name or email" },
          limit: { type: "number", description: "Max results (default 20)" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_deal",
      description: "Create a new deal in the CRM pipeline.",
      parameters: {
        type: "object",
        properties: {
          deal_name: { type: "string", description: "Name of the deal" },
          deal_value: { type: "number", description: "Value in GBP" },
          stage: { type: "string", enum: ["discovery", "proposal", "negotiation", "closed_won", "closed_lost"], description: "Pipeline stage" },
          contact_name: { type: "string", description: "Contact name" },
          company_name: { type: "string", description: "Company name" },
          expected_close_date: { type: "string", description: "Expected close date (YYYY-MM-DD)" },
          probability: { type: "number", description: "Win probability 0-100" },
          notes: { type: "string", description: "Deal notes" },
          lead_id: { type: "string", description: "Associated lead ID" }
        },
        required: ["deal_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_deal",
      description: "Update an existing deal.",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "string", description: "Deal ID" },
          deal_name: { type: "string", description: "Deal name to search for" },
          updates: {
            type: "object",
            properties: {
              deal_name: { type: "string" },
              deal_value: { type: "number" },
              stage: { type: "string" },
              probability: { type: "number" },
              notes: { type: "string" },
              expected_close_date: { type: "string" },
              contact_name: { type: "string" },
              company_name: { type: "string" }
            },
            additionalProperties: false
          }
        },
        required: ["updates"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_deals",
      description: "Retrieve deals from the pipeline.",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", description: "Filter by stage" },
          search: { type: "string", description: "Search by name" },
          limit: { type: "number", description: "Max results" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "Create a new invoice for a client team.",
      parameters: {
        type: "object",
        properties: {
          team_id: { type: "string", description: "Client team ID" },
          team_name: { type: "string", description: "Client/team name to search for" },
          amount: { type: "number", description: "Invoice amount in GBP" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                total: { type: "number" }
              },
              additionalProperties: false
            },
            description: "Line items"
          },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
          notes: { type: "string", description: "Invoice notes" },
          tax_amount: { type: "number", description: "Tax amount" }
        },
        required: ["amount"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_invoices",
      description: "Retrieve invoices.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status (draft, sent, paid, overdue)" },
          limit: { type: "number", description: "Max results" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_invoice",
      description: "Update an existing invoice.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "Invoice ID" },
          invoice_number: { type: "string", description: "Invoice number to search for" },
          updates: {
            type: "object",
            properties: {
              // client_invoices_status_check allows 'pending', not
              // 'awaiting_payment'; the old value could never be written.
              status: { type: "string", enum: ["draft", "pending", "sent", "paid", "overdue", "cancelled"] },
              amount: { type: "number" },
              notes: { type: "string" },
              due_date: { type: "string" },
              paid_at: { type: "string" }
            },
            additionalProperties: false
          }
        },
        required: ["updates"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a new calendar event. Interpret relative dates like 'tomorrow', 'next Monday' etc.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start_time: { type: "string", description: "Start time ISO 8601 format" },
          end_time: { type: "string", description: "End time ISO 8601 format" },
          location: { type: "string", description: "Location" },
          description: { type: "string", description: "Event description" },
          is_all_day: { type: "boolean", description: "Whether all-day event" },
          color: { type: "string", description: "Event color hex" }
        },
        required: ["title", "start_time", "end_time"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_calendar_events",
      description: "Retrieve calendar events for a date range.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          limit: { type: "number", description: "Max results" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description: "Update an existing calendar event.",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "Event ID" },
          event_title: { type: "string", description: "Event title to search for" },
          updates: {
            type: "object",
            properties: {
              title: { type: "string" },
              start_time: { type: "string" },
              end_time: { type: "string" },
              location: { type: "string" },
              description: { type: "string" },
              color: { type: "string" }
            },
            additionalProperties: false
          }
        },
        required: ["updates"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Delete a calendar event.",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "Event ID" },
          event_title: { type: "string", description: "Event title to search for" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_content_request",
      description: "Create a new content request (blog post, social post, ad copy, etc).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Request title" },
          // Must match content_requests_request_type_check exactly. The old
          // list ("blog_post", "email_campaign", "video_script", ...) shared
          // only two values with the constraint, so most AI-created content
          // requests failed with a check violation.
          request_type: { type: "string", enum: ["blog", "social_post", "ad_copy", "website_section"], description: "Type of content" },
          description: { type: "string", description: "Detailed description/brief" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Priority level" },
          scheduled_date: { type: "string", description: "Target date (YYYY-MM-DD)" }
        },
        required: ["title", "request_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_content_requests",
      description: "Retrieve content requests.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          request_type: { type: "string", description: "Filter by type" },
          limit: { type: "number", description: "Max results" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_content_request",
      description: "Update a content request.",
      parameters: {
        type: "object",
        properties: {
          request_id: { type: "string", description: "Request ID" },
          request_title: { type: "string", description: "Title to search for" },
          updates: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "string" },
              priority: { type: "string" },
              description: { type: "string" },
              scheduled_date: { type: "string" }
            },
            additionalProperties: false
          }
        },
        required: ["updates"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project.",
      parameters: {
        type: "object",
        properties: {
          project_name: { type: "string", description: "Project name" },
          project_type: { type: "string", description: "Type (website, app, marketing, etc)" },
          description: { type: "string", description: "Project description" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          target_completion_date: { type: "string", description: "Target completion (YYYY-MM-DD)" }
        },
        required: ["project_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Retrieve projects.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Max results" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ad_campaign",
      description: "Create a new ad campaign.",
      parameters: {
        type: "object",
        properties: {
          campaign_name: { type: "string", description: "Campaign name" },
          platform: { type: "string", enum: ["meta", "google", "tiktok", "linkedin", "twitter"], description: "Ad platform" },
          // Constrained by ad_campaigns_objective_check.
          objective: { type: "string", enum: ["leads", "traffic", "sales", "awareness", "engagement"], description: "Campaign objective" },
          monthly_budget: { type: "number", description: "Monthly budget in GBP" },
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          notes: { type: "string", description: "Campaign notes" }
        },
        required: ["campaign_name", "platform"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_business_summary",
      description: "Get a comprehensive summary of the user's business data including leads, deals, invoices, projects, and upcoming events.",
      parameters: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: { type: "string", enum: ["leads", "deals", "invoices", "projects", "events", "campaigns", "content"] },
            description: "Which sections to include"
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_automation",
      description: "Trigger a business automation. Available automations: send_overdue_reminders, generate_weekly_report, auto_qualify_leads, create_onboarding_checklist, send_welcome_email, escalate_stale_deals.",
      parameters: {
        type: "object",
        properties: {
          automation_type: {
            type: "string",
            enum: ["send_overdue_reminders", "generate_weekly_report", "auto_qualify_leads", "create_onboarding_checklist", "send_welcome_email", "escalate_stale_deals"],
            description: "Type of automation to run"
          },
          params: {
            type: "object",
            description: "Additional parameters for the automation"
          }
        },
        required: ["automation_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the text content of a file that the user has attached/uploaded. Use the storage path provided in the attachment info.",
      parameters: {
        type: "object",
        properties: {
          storage_path: { type: "string", description: "The storage path of the file (from attachment info)" },
          file_name: { type: "string", description: "Original file name for context" }
        },
        required: ["storage_path"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "export_file",
      description: "Create and export a file (CSV, JSON, TXT, MD, HTML) for the user to download. Use when user asks to export data, generate reports, create documents, etc.",
      parameters: {
        type: "object",
        properties: {
          file_name: { type: "string", description: "Name of the file to create (e.g. leads-export.csv)" },
          content: { type: "string", description: "The full text content of the file" },
          content_type: { type: "string", description: "MIME type (text/csv, application/json, text/plain, text/markdown, text/html)" }
        },
        required: ["file_name", "content"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_invoice_document",
      description: "Generate a professional, viewable HTML invoice document from invoice data. Use this AFTER creating an invoice with create_invoice, or when the user asks to generate/view an invoice document. The result will be displayed inline in the chat as a preview.",
      parameters: {
        type: "object",
        properties: {
          invoice_number: { type: "string", description: "Invoice number (e.g. INV-2026-00001)" },
          company_name: { type: "string", description: "The issuing company name (default: Quooro Ltd)" },
          client_name: { type: "string", description: "Client/recipient name" },
          client_email: { type: "string", description: "Client email" },
          client_company: { type: "string", description: "Client company name" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                total: { type: "number" }
              },
              additionalProperties: false
            },
            description: "Line items on the invoice"
          },
          subtotal: { type: "number", description: "Subtotal before tax" },
          tax_amount: { type: "number", description: "Tax/VAT amount" },
          total_amount: { type: "number", description: "Total amount due" },
          currency: { type: "string", description: "Currency symbol (default: £)" },
          due_date: { type: "string", description: "Due date" },
          issue_date: { type: "string", description: "Issue date" },
          notes: { type: "string", description: "Additional notes" },
          status: { type: "string", description: "Invoice status" }
        },
        required: ["invoice_number", "items", "total_amount"],
        additionalProperties: false
      }
    }
  },
];

// Message validation constants
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONVERSATION_HISTORY = 20;

interface ChatMessage {
  role: string;
  content: string;
}

function validateAndSanitizeMessages(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;

  const validatedMessages = messages
    .filter((m): m is { role: string; content: unknown } =>
      typeof m === 'object' && m !== null && 'role' in m &&
      (m.role === 'user' || m.role === 'assistant')
    )
    .slice(-MAX_CONVERSATION_HISTORY)
    .map((m): ChatMessage => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, MAX_MESSAGE_LENGTH),
    }));

  return validatedMessages.length === 0 ? null : validatedMessages;
}

/**
 * Execute a tool call against the database
 */
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  supabase: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (toolName) {
      // === LEADS ===
      // `leads` is the prospecting table: ownership is `assigned_to`, and there
      // is no user_id/name/company column. Every one of these previously used
      // columns that do not exist.
      case "create_lead": {
        if (!args.business_name && !args.personal_name && !args.contact_name) {
          return { success: false, error: "A business_name, personal_name or contact_name is required." };
        }
        const { data, error } = await supabase.from("leads").insert({
          assigned_to: userId,
          business_name: args.business_name || null,
          personal_name: args.personal_name || null,
          contact_name: args.contact_name || null,
          is_personal: args.is_personal ?? false,
          email: args.email || null,
          phone: args.phone || null,
          website_url: args.website_url || null,
          location_city: args.location_city || null,
          location_postcode: args.location_postcode || null,
          category: args.category || null,
          source: args.source || "manual",
          status: args.status || "new",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "update_lead": {
        let leadId = args.lead_id;
        if (!leadId && args.lead_name) {
          const { data: found } = await supabase.from("leads")
            .select("id").eq("assigned_to", userId)
            .or(`business_name.ilike.%${args.lead_name}%,contact_name.ilike.%${args.lead_name}%,personal_name.ilike.%${args.lead_name}%`)
            .limit(1).maybeSingle();
          leadId = found?.id;
        }
        if (!leadId) return { success: false, error: "Lead not found" };
        const { data, error } = await supabase.from("leads")
          .update(args.updates).eq("id", leadId).eq("assigned_to", userId).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "delete_lead": {
        let leadId = args.lead_id;
        if (!leadId && args.lead_name) {
          const { data: found } = await supabase.from("leads")
            .select("id").eq("assigned_to", userId)
            .or(`business_name.ilike.%${args.lead_name}%,contact_name.ilike.%${args.lead_name}%,personal_name.ilike.%${args.lead_name}%`)
            .limit(1).maybeSingle();
          leadId = found?.id;
        }
        if (!leadId) return { success: false, error: "Lead not found" };
        const { error } = await supabase.from("leads").delete().eq("id", leadId).eq("assigned_to", userId);
        if (error) throw new Error(error.message);
        return { success: true, data: { deleted: true } };
      }

      case "get_leads": {
        let q = supabase.from("leads").select("*").eq("assigned_to", userId)
          .order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.status) q = q.eq("status", args.status);
        if (args.search) {
          q = q.or(`business_name.ilike.%${args.search}%,contact_name.ilike.%${args.search}%,personal_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        }
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === DEALS ===
      case "create_deal": {
        const { data, error } = await supabase.from("crm_deals").insert({
          user_id: userId,
          deal_name: args.deal_name,
          deal_value: args.deal_value || 0,
          stage: args.stage || "discovery",
          contact_name: args.contact_name || null,
          company_name: args.company_name || null,
          expected_close_date: args.expected_close_date || null,
          probability: args.probability || 50,
          notes: args.notes || null,
          lead_id: args.lead_id || null,
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "update_deal": {
        let dealId = args.deal_id;
        if (!dealId && args.deal_name) {
          const { data: found } = await supabase.from("crm_deals")
            .select("id").eq("user_id", userId)
            .ilike("deal_name", `%${args.deal_name}%`).limit(1).single();
          dealId = found?.id;
        }
        if (!dealId) return { success: false, error: "Deal not found" };
        const { data, error } = await supabase.from("crm_deals")
          .update(args.updates).eq("id", dealId).eq("user_id", userId).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "get_deals": {
        let q = supabase.from("crm_deals").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.stage) q = q.eq("stage", args.stage);
        if (args.search) q = q.ilike("deal_name", `%${args.search}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === INVOICES ===
      case "create_invoice": {
        let teamId = args.team_id;
        if (!teamId && args.team_name) {
          const { data: found } = await supabase.from("client_teams")
            .select("id").ilike("team_name", `%${args.team_name}%`).limit(1).single();
          teamId = found?.id;
        }
        // Generate invoice number
        const { data: invNum } = await supabase.rpc("generate_invoice_number");
        const totalAmount = args.amount + (args.tax_amount || 0);
        
        // If no team found, use first available team or create without
        if (!teamId) {
          const { data: teams } = await supabase.from("client_teams").select("id").limit(1);
          teamId = teams?.[0]?.id;
        }
        if (!teamId) return { success: false, error: "No client team found. Please specify a valid client." };

        const { data, error } = await supabase.from("client_invoices").insert({
          team_id: teamId,
          created_by: userId,
          invoice_number: invNum || `INV-${Date.now()}`,
          amount: args.amount,
          total_amount: totalAmount,
          tax_amount: args.tax_amount || 0,
          items: args.items || [{ description: "Services", quantity: 1, unit_price: args.amount, total: args.amount }],
          due_date: args.due_date || null,
          notes: args.notes || null,
          status: "draft",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "get_invoices": {
        let q = supabase.from("client_invoices").select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "update_invoice": {
        let invoiceId = args.invoice_id;
        if (!invoiceId && args.invoice_number) {
          const { data: found } = await supabase.from("client_invoices")
            .select("id").eq("created_by", userId)
            .eq("invoice_number", args.invoice_number).limit(1).single();
          invoiceId = found?.id;
        }
        if (!invoiceId) return { success: false, error: "Invoice not found" };
        const updates: any = { ...args.updates };
        if (updates.amount) {
          updates.total_amount = updates.amount + (updates.tax_amount || 0);
        }
        const { data, error } = await supabase.from("client_invoices")
          .update(updates).eq("id", invoiceId).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === CALENDAR ===
      case "create_calendar_event": {
        const { data, error } = await supabase.from("calendar_events").insert({
          user_id: userId,
          title: args.title,
          start_time: args.start_time,
          end_time: args.end_time,
          location: args.location || null,
          description: args.description || null,
          is_all_day: args.is_all_day || false,
          color: args.color || "#3b82f6",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "get_calendar_events": {
        let q = supabase.from("calendar_events").select("*").eq("user_id", userId)
          .order("start_time", { ascending: true }).limit(args.limit || 20);
        if (args.start_date) q = q.gte("start_time", args.start_date);
        if (args.end_date) q = q.lte("end_time", args.end_date + "T23:59:59");
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "update_calendar_event": {
        let eventId = args.event_id;
        if (!eventId && args.event_title) {
          const { data: found } = await supabase.from("calendar_events")
            .select("id").eq("user_id", userId)
            .ilike("title", `%${args.event_title}%`)
            .order("start_time", { ascending: false }).limit(1).single();
          eventId = found?.id;
        }
        if (!eventId) return { success: false, error: "Event not found" };
        const { data, error } = await supabase.from("calendar_events")
          .update(args.updates).eq("id", eventId).eq("user_id", userId).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "delete_calendar_event": {
        let eventId = args.event_id;
        if (!eventId && args.event_title) {
          const { data: found } = await supabase.from("calendar_events")
            .select("id").eq("user_id", userId)
            .ilike("title", `%${args.event_title}%`).limit(1).single();
          eventId = found?.id;
        }
        if (!eventId) return { success: false, error: "Event not found" };
        const { error } = await supabase.from("calendar_events").delete()
          .eq("id", eventId).eq("user_id", userId);
        if (error) throw new Error(error.message);
        return { success: true, data: { deleted: true } };
      }

      // === CONTENT REQUESTS ===
      case "create_content_request": {
        const { data, error } = await supabase.from("content_requests").insert({
          user_id: userId,
          title: args.title,
          request_type: args.request_type,
          description: args.description || null,
          priority: args.priority || "medium",
          scheduled_date: args.scheduled_date || null,
          status: "pending",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "get_content_requests": {
        let q = supabase.from("content_requests").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.status) q = q.eq("status", args.status);
        if (args.request_type) q = q.eq("request_type", args.request_type);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "update_content_request": {
        let reqId = args.request_id;
        if (!reqId && args.request_title) {
          const { data: found } = await supabase.from("content_requests")
            .select("id").eq("user_id", userId)
            .ilike("title", `%${args.request_title}%`).limit(1).single();
          reqId = found?.id;
        }
        if (!reqId) return { success: false, error: "Content request not found" };
        const { data, error } = await supabase.from("content_requests")
          .update(args.updates).eq("id", reqId).eq("user_id", userId).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === PROJECTS ===
      case "create_project": {
        const { data, error } = await supabase.from("app_projects").insert({
          user_id: userId,
          project_name: args.project_name,
          project_type: args.project_type || "website",
          description: args.description || null,
          priority: args.priority || "medium",
          start_date: args.start_date || new Date().toISOString().split("T")[0],
          target_completion_date: args.target_completion_date || null,
          status: "planning",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      case "get_projects": {
        let q = supabase.from("app_projects").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === AD CAMPAIGNS ===
      case "create_ad_campaign": {
        const { data, error } = await supabase.from("ad_campaigns").insert({
          user_id: userId,
          campaign_name: args.campaign_name,
          platform: args.platform,
          objective: args.objective || null,
          monthly_budget: args.monthly_budget || null,
          start_date: args.start_date || null,
          notes: args.notes || null,
          // ad_campaigns_status_check allows running/paused/completed/scheduled.
          // "draft" is not one of them, so every AI-created campaign failed.
          status: "paused",
        }).select().single();
        if (error) throw new Error(error.message);
        return { success: true, data };
      }

      // === BUSINESS SUMMARY ===
      case "get_business_summary": {
        const sections = args.sections || ["leads", "deals", "invoices", "projects", "events"];
        const summary: Record<string, any> = {};

        if (sections.includes("leads")) {
          const { data } = await supabase.from("leads")
            .select("id, business_name, personal_name, contact_name, status, created_at")
            .eq("assigned_to", userId).order("created_at", { ascending: false }).limit(10);
          const { count } = await supabase.from("leads")
            .select("id", { count: "exact", head: true }).eq("assigned_to", userId);
          summary.leads = { total: count || 0, recent: data || [] };
        }
        if (sections.includes("deals")) {
          const { data } = await supabase.from("crm_deals").select("id, deal_name, deal_value, stage, probability")
            .eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
          const totalValue = (data || []).reduce((sum: number, d: any) => sum + (d.deal_value || 0), 0);
          summary.deals = { total: data?.length || 0, pipeline_value: totalValue, deals: data || [] };
        }
        if (sections.includes("invoices")) {
          const { data } = await supabase.from("client_invoices").select("id, invoice_number, amount, status, due_date")
            .eq("created_by", userId).order("created_at", { ascending: false }).limit(10);
          summary.invoices = { total: data?.length || 0, invoices: data || [] };
        }
        if (sections.includes("projects")) {
          const { data } = await supabase.from("app_projects").select("id, project_name, status, priority")
            .eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
          summary.projects = { total: data?.length || 0, projects: data || [] };
        }
        if (sections.includes("events")) {
          const now = new Date().toISOString();
          const { data } = await supabase.from("calendar_events").select("id, title, start_time, end_time, location")
            .eq("user_id", userId).gte("start_time", now)
            .order("start_time", { ascending: true }).limit(5);
          summary.events = { upcoming: data || [] };
        }
        if (sections.includes("campaigns")) {
          const { data } = await supabase.from("ad_campaigns").select("id, campaign_name, platform, status, monthly_budget")
            .eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
          summary.campaigns = { total: data?.length || 0, campaigns: data || [] };
        }
        if (sections.includes("content")) {
          const { data } = await supabase.from("content_requests").select("id, title, request_type, status, priority")
            .eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
          summary.content = { total: data?.length || 0, requests: data || [] };
        }

        return { success: true, data: summary };
      }

      // === FILE OPERATIONS ===
      case "read_file": {
        const { data: fileData, error: dlError } = await supabase.storage
          .from('customer-uploads')
          .download(args.storage_path);
        if (dlError) throw new Error(`Could not read file: ${dlError.message}`);
        const text = await fileData.text();
        // Truncate if very large
        const truncated = text.length > 15000 ? text.slice(0, 15000) + "\n\n... [truncated, file too large to show in full]" : text;
        return { success: true, data: { content: truncated, size: text.length, name: args.file_name || args.storage_path } };
      }

      case "export_file": {
        const fileName = args.file_name || "export.txt";
        const contentType = args.content_type || "text/plain";
        const path = `chat-exports/${userId}/${Date.now()}-${fileName}`;
        const blob = new Blob([args.content], { type: contentType });
        const { error: upError } = await supabase.storage
          .from('customer-uploads')
          .upload(path, blob, { contentType });
        if (upError) throw new Error(`Export failed: ${upError.message}`);
        return { success: true, data: { storage_path: path, file_name: fileName, message: `File exported: [EXPORT_FILE:${path}:${fileName}]` } };
      }

      // === GENERATE INVOICE DOCUMENT ===
      case "generate_invoice_document": {
        const currency = args.currency || "£";
        const issueDate = args.issue_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const dueDate = args.due_date || "Upon receipt";
        const companyName = args.company_name || "Quooro Ltd";
        const items = args.items || [{ description: "Services", quantity: 1, unit_price: args.total_amount, total: args.total_amount }];
        const subtotal = args.subtotal || items.reduce((s: number, i: any) => s + (i.total || i.unit_price * i.quantity), 0);
        const taxAmount = args.tax_amount || 0;
        const totalAmount = args.total_amount;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${args.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 3px solid #6366f1; padding-bottom: 24px; }
  .logo { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
  .logo span { color: #a5b4fc; }
  .invoice-badge { background: #6366f1; color: white; padding: 8px 20px; border-radius: 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
  .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 12px; font-weight: 600; }
  .meta-section p { font-size: 14px; line-height: 1.8; color: #334155; }
  .meta-section .value { font-weight: 600; color: #1a1a2e; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  .items-table th { background: #f8fafc; padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  .items-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
  .items-table .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .items-table th.amount { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { min-width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; }
  .totals-row.total { border-top: 2px solid #6366f1; border-bottom: none; padding-top: 16px; margin-top: 8px; font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .notes { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
  .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
  .notes p { font-size: 13px; color: #64748b; line-height: 1.6; }
  .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .status-draft { background: #fef3c7; color: #92400e; }
  .status-sent { background: #dbeafe; color: #1e40af; }
  .status-paid { background: #d1fae5; color: #065f46; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${companyName.replace(' ', '<span>') + '</span>'}</div>
      <p style="font-size:12px;color:#94a3b8;margin-top:4px;">Professional Services</p>
    </div>
    <div class="invoice-badge">Invoice</div>
  </div>

  <div class="meta-grid">
    <div class="meta-section">
      <h3>Invoice Details</h3>
      <p><span class="value">Number:</span> ${args.invoice_number}</p>
      <p><span class="value">Date:</span> ${issueDate}</p>
      <p><span class="value">Due:</span> ${dueDate}</p>
      ${args.status ? `<p><span class="value">Status:</span> <span class="status-badge status-${args.status}">${args.status}</span></p>` : ''}
    </div>
    <div class="meta-section">
      <h3>Bill To</h3>
      ${args.client_name ? `<p class="value">${args.client_name}</p>` : ''}
      ${args.client_company ? `<p>${args.client_company}</p>` : ''}
      ${args.client_email ? `<p>${args.client_email}</p>` : ''}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Qty</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
      <tr>
        <td>${item.description || 'Services'}</td>
        <td class="amount">${item.quantity || 1}</td>
        <td class="amount">${currency}${(item.unit_price || 0).toFixed(2)}</td>
        <td class="amount">${currency}${(item.total || (item.unit_price * item.quantity) || 0).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${currency}${subtotal.toFixed(2)}</span></div>
      ${taxAmount > 0 ? `<div class="totals-row"><span>VAT/Tax</span><span>${currency}${taxAmount.toFixed(2)}</span></div>` : ''}
      <div class="totals-row total"><span>Total Due</span><span>${currency}${totalAmount.toFixed(2)}</span></div>
    </div>
  </div>

  ${args.notes ? `<div class="notes"><h4>Notes</h4><p>${args.notes}</p></div>` : ''}

  <div class="footer">
    <p>${companyName} — Thank you for your business</p>
  </div>
</body>
</html>`;

        const fileName = `invoice-${args.invoice_number}.html`;
        const path = `chat-exports/${userId}/${Date.now()}-${fileName}`;
        const blob = new Blob([html], { type: 'text/html' });
        const { error: upError } = await supabase.storage
          .from('customer-uploads')
          .upload(path, blob, { contentType: 'text/html' });
        if (upError) throw new Error(`Document generation failed: ${upError.message}`);
        return { success: true, data: { storage_path: path, file_name: fileName, message: `Invoice document generated: [INVOICE_PREVIEW:${path}:${fileName}]` } };
      }

      // === AUTOMATIONS ===
      case "run_automation": {
        return await executeAutomation(args.automation_type, args.params || {}, userId, supabase);
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`Tool ${toolName} error:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Execute business automations
 */
async function executeAutomation(
  type: string,
  params: Record<string, any>,
  userId: string,
  supabase: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  switch (type) {
    case "send_overdue_reminders": {
      const { data: overdue } = await supabase.from("client_invoices")
        .select("id, invoice_number, amount, due_date, team_id")
        // "awaiting_payment" is not an allowed status, so this filter could
        // never match and the automation always reported zero overdue invoices.
        .eq("created_by", userId).in("status", ["sent", "pending"])
        .lt("due_date", new Date().toISOString().split("T")[0]);
      
      if (!overdue || overdue.length === 0) {
        return { success: true, data: { message: "No overdue invoices found.", count: 0 } };
      }
      
      // Mark them as overdue
      for (const inv of overdue) {
        await supabase.from("client_invoices").update({ status: "overdue" }).eq("id", inv.id);
      }
      
      return { success: true, data: { 
        message: `Found ${overdue.length} overdue invoice(s) and updated their status.`, 
        count: overdue.length, 
        invoices: overdue.map((i: any) => ({ number: i.invoice_number, amount: i.amount, due: i.due_date }))
      }};
    }

    case "auto_qualify_leads": {
      // Promote leads that have sat in "contacted" for 7+ days. Ownership is
      // assigned_to, and lead_status has no "qualified" member - the next stage
      // after "contacted" is "engaged", so the old value could never be written.
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: leads } = await supabase.from("leads")
        .select("id, business_name, personal_name, contact_name")
        .eq("assigned_to", userId).eq("status", "contacted")
        .lt("created_at", sevenDaysAgo);

      if (!leads || leads.length === 0) {
        return { success: true, data: { message: "No leads ready for auto-qualification.", count: 0 } };
      }

      for (const lead of leads) {
        await supabase.from("leads").update({ status: "engaged" }).eq("id", lead.id);
      }

      return { success: true, data: {
        message: `Moved ${leads.length} lead(s) to engaged after 7+ days in contacted.`,
        count: leads.length,
        leads: leads.map((l: any) => l.business_name || l.personal_name || l.contact_name)
      }};
    }

    case "escalate_stale_deals": {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: stale } = await supabase.from("crm_deals")
        .select("id, deal_name, deal_value, stage, updated_at")
        .eq("user_id", userId)
        .in("stage", ["discovery", "proposal", "negotiation"])
        .lt("updated_at", thirtyDaysAgo);
      
      if (!stale || stale.length === 0) {
        return { success: true, data: { message: "No stale deals found.", count: 0 } };
      }
      
      // Log activities for stale deals
      for (const deal of stale) {
        await supabase.from("crm_deal_activities").insert({
          deal_id: deal.id,
          user_id: userId,
          activity_type: "system_alert",
          description: `Deal stale for 30+ days (last updated: ${deal.updated_at}). Needs attention.`,
        });
      }
      
      return { success: true, data: { 
        message: `Found ${stale.length} stale deal(s) and flagged them for review.`, 
        count: stale.length, 
        deals: stale.map((d: any) => ({ name: d.deal_name, value: d.deal_value, stage: d.stage }))
      }};
    }

    case "generate_weekly_report": {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [leadsRes, dealsRes, invoicesRes, eventsRes] = await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact" }).eq("assigned_to", userId).gte("created_at", oneWeekAgo),
        supabase.from("crm_deals").select("id, deal_value, stage").eq("user_id", userId).gte("created_at", oneWeekAgo),
        supabase.from("client_invoices").select("id, amount, status").eq("created_by", userId).gte("created_at", oneWeekAgo),
        supabase.from("calendar_events").select("id").eq("user_id", userId).gte("start_time", oneWeekAgo),
      ]);
      
      const newLeads = leadsRes.data?.length || 0;
      const newDeals = dealsRes.data?.length || 0;
      const dealValue = (dealsRes.data || []).reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
      const newInvoices = invoicesRes.data?.length || 0;
      const invoiceTotal = (invoicesRes.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const eventCount = eventsRes.data?.length || 0;
      
      return { success: true, data: { 
        period: "Last 7 days",
        new_leads: newLeads,
        new_deals: newDeals,
        pipeline_added: dealValue,
        invoices_created: newInvoices,
        invoice_total: invoiceTotal,
        events_scheduled: eventCount,
      }};
    }

    case "create_onboarding_checklist": {
      const clientName = params.client_name || "New Client";
      const { data, error } = await supabase.from("client_onboarding").insert({
        user_id: userId,
        client_name: clientName,
        client_email: params.client_email || null,
        company_name: params.company_name || null,
        status: "not_started",
        checklist_items: [
          { label: "Send welcome email", done: false },
          { label: "Request brand assets", done: false },
          { label: "Set up client portal", done: false },
          { label: "Schedule discovery call", done: false },
          { label: "Create project timeline", done: false },
          { label: "Share information checklist", done: false },
        ]
      }).select().single();
      if (error) throw new Error(error.message);
      return { success: true, data: { message: `Onboarding checklist created for ${clientName}`, onboarding: data } };
    }

    default:
      return { success: false, error: `Unknown automation: ${type}` };
  }
}

/**
 * Fetch user's account data for AI context
 */
async function fetchUserContext(userId: string, supabase: any): Promise<string> {
  const sections: string[] = [];
  try {
    const { data: profile } = await supabase.from('profiles')
      .select('full_name, email, company, plan, domain_name, website_status, customer_id, phone, hosting_provider, ssl_status, page_count, preview_url, industry')
      .eq('user_id', userId).single();

    if (profile) {
      sections.push(`## Account Profile
- Name: ${profile.full_name || 'Not set'}
- Email: ${profile.email || 'Not set'}
- Company: ${profile.company || 'Not set'}
- Industry: ${profile.industry || 'Not specified'}
- Customer ID: ${profile.customer_id || 'Not assigned'}
- Plan: ${profile.plan || 'No active plan'}
- Domain: ${profile.domain_name || 'Not configured'}
- Website Status: ${profile.website_status || 'N/A'}
- Current date/time: ${new Date().toISOString()}`);
    }

    // Quick stats
    const [leadsCount, dealsCount, projectsCount] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_to', userId),
      supabase.from('crm_deals').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('app_projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    sections.push(`## Quick Stats
- Total Leads: ${leadsCount.count || 0}
- Total Deals: ${dealsCount.count || 0}
- Total Projects: ${projectsCount.count || 0}`);

  } catch (error) {
    console.error('Error fetching user context:', error);
    sections.push('## Error\nSome account data could not be retrieved.');
  }

  return sections.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  if (!isOriginAllowed(req)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body !== 'object' || body === null || !('messages' in body)) {
      return new Response(
        JSON.stringify({ error: 'Missing messages field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedMessages = validateAndSanitizeMessages((body as { messages: unknown }).messages);
    if (!validatedMessages) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const context = (body as { context?: string }).context;
    let systemPrompt: string;

    // Lovable is gone, so the provider is resolved from the project's own keys.
    // Failing here with an actionable 503 is better than a generic 500 later.
    const aiProvider = resolveChatProvider();
    if (!aiProvider) {
      return new Response(
        JSON.stringify({
          error: 'No AI provider configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY on this project.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // C1 fix: identity comes from a verified JWT, never from the request body.
    // The lounge path reads and writes a user's own CRM data under the service
    // role, so the caller MUST prove who they are. A body-supplied user_id let
    // anyone dump or delete any account's data. The marketing path (context !==
    // 'lounge') needs no identity and no privileged client.
    let userId: string | null = null;
    if (context === 'lounge') {
      const authHeader = req.headers.get('Authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.slice(7));
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    }

    if (context === 'lounge' && userId) {
      const userContext = await fetchUserContext(userId, supabaseAdmin);
      systemPrompt = `${QUOORO_CUSTOMER_ASSISTANT_PROMPT}\n\n---\n# USER ACCOUNT DATA\n${userContext}\n---`;

      // === MULTI-ROUND TOOL-CALLING LOOP ===
      // Keep calling the AI until it stops requesting tools (max 5 rounds)
      let conversationMessages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...validatedMessages,
      ];
      const MAX_TOOL_ROUNDS = 5;
      let toolRound = 0;
      let lastChoice: any = null;

      while (toolRound < MAX_TOOL_ROUNDS) {
        lastChoice = await chatWithTools(aiProvider, conversationMessages, CRUD_TOOLS, {
          maxTokens: 1200,
          temperature: 0.7,
        });

        // If no tool calls, we're done — break out to stream the final response
        if (!lastChoice?.message?.tool_calls || lastChoice.message.tool_calls.length === 0) {
          break;
        }

        // Execute all tool calls in this round
        const toolCalls = lastChoice.message.tool_calls;
        const toolResults: any[] = [];

        for (const tc of toolCalls) {
          let args: Record<string, any> = {};
          try {
            args = typeof tc.function.arguments === 'string' 
              ? JSON.parse(tc.function.arguments) 
              : tc.function.arguments;
          } catch { args = {}; }

          console.log(`[TOOL R${toolRound}] Executing ${tc.function.name}`, args);
          const result = await executeTool(tc.function.name, args, userId, supabaseAdmin);
          console.log(`[TOOL R${toolRound}] Result:`, result.success ? 'success' : result.error);

          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }

        // Append assistant message + tool results to conversation for next round
        conversationMessages = [
          ...conversationMessages,
          lastChoice.message,
          ...toolResults,
        ];
        toolRound++;
      }

      // Final streaming response (with all tool context accumulated)
      const finalStream = await chatStream(aiProvider, conversationMessages, {
        maxTokens: 1200,
        temperature: 0.7,
      });

      return new Response(finalStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });




    } else {
      // Sales context — no tools, just streaming
      systemPrompt = QUOORO_SALES_PROMPT;

      const salesStream = await chatStream(
        aiProvider,
        [
          { role: 'system', content: systemPrompt },
          ...validatedMessages,
        ],
        { maxTokens: 800, temperature: 0.7 },
      );

      return new Response(salesStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error) {
    console.error('Chat function error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // Rate limits and exhausted credits used to be handled inline at each call
    // site; now they surface as ProviderError so the clients keep seeing the
    // same 429/402 they were written against.
    if (error instanceof ProviderError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
