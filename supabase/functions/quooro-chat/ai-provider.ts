/**
 * Provider layer for quooro-chat.
 *
 * Lovable has been removed entirely (2026-07-28, owner decision): no
 * LOVABLE_API_KEY, no ai.gateway.lovable.dev, not even as a fallback.
 *
 * Resolution order (first key present wins):
 *   1. ANTHROPIC_API_KEY -> api.anthropic.com     (recommended)
 *   2. OPENAI_API_KEY    -> api.openai.com
 *
 * Override with QUOORO_CHAT_PROVIDER = anthropic | openai and the model with
 * QUOORO_CHAT_MODEL. With neither key set the caller returns 503.
 *
 * ---------------------------------------------------------------------------
 * Why this module exists rather than a URL swap
 * ---------------------------------------------------------------------------
 * Three browser clients (ChatBot.tsx, LoungeAI.tsx, LoungeAIIntelligence.tsx)
 * read the stream as OpenAI-shaped SSE frames - `choices[0].delta.content`.
 * Anthropic's Messages API streams a structurally different event set
 * (`content_block_delta` carrying a `text_delta`), so pointing the old fetch at
 * api.anthropic.com would have produced a silent, permanently blank chat.
 *
 * So the OpenAI wire shape is kept as this function's *internal* format:
 *   - the tool-calling loop keeps working with `choices[0].message.tool_calls`
 *   - the streamed response keeps emitting `choices[0].delta.content`
 * and everything Anthropic-specific is translated in here. The Anthropic path
 * is a real translation in both directions; the OpenAI path is a pass-through.
 *
 * Note on extended thinking: it is deliberately NOT enabled. The tool loop
 * round-trips assistant turns through the OpenAI shape, which has nowhere to
 * carry a thinking block, and Anthropic requires thinking blocks to be
 * preserved verbatim when tool results are sent back. Enabling it would break
 * multi-round tool use, so it stays off.
 */

export type Provider = 'anthropic' | 'openai';

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-opus-5',
  openai: 'gpt-4o-mini',
};

const ANTHROPIC_VERSION = '2023-06-01';

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
}

/** OpenAI-shaped message, the internal format used throughout quooro-chat. */
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

/** OpenAI-shaped tool definition, as CRUD_TOOLS is written. */
export interface OpenAITool {
  type: 'function';
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}

/** Thrown for upstream failures so the caller can map status codes. */
export class ProviderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function resolveChatProvider(): ProviderConfig | null {
  const explicit = (Deno.env.get('QUOORO_CHAT_PROVIDER') || '').toLowerCase() as Provider | '';
  const keys: Record<Provider, string | undefined> = {
    anthropic: Deno.env.get('ANTHROPIC_API_KEY') || undefined,
    openai: Deno.env.get('OPENAI_API_KEY') || undefined,
  };

  const order: Provider[] = explicit && keys[explicit] ? [explicit] : ['anthropic', 'openai'];

  for (const p of order) {
    const apiKey = keys[p];
    if (apiKey) {
      return { provider: p, apiKey, model: Deno.env.get('QUOORO_CHAT_MODEL') || DEFAULT_MODELS[p] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// OpenAI shape -> Anthropic shape
// ---------------------------------------------------------------------------

type AnthropicBlock = Record<string, unknown>;
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: AnthropicBlock[];
}

/**
 * Splits the conversation into Anthropic's top-level `system` string and its
 * `messages` array.
 *
 * Three shape differences are handled here:
 *   - `system` is a top-level field, not a message role
 *   - a `tool` result is an ordinary *user* turn carrying a `tool_result` block
 *   - turns must alternate, so same-role neighbours are merged (this is also
 *     what groups a round's tool results into one user turn)
 */
function toAnthropic(messages: OpenAIMessage[]): { system: string; messages: AnthropicMessage[] } {
  const systemParts: string[] = [];
  const converted: AnthropicMessage[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      if (m.content) systemParts.push(String(m.content));
      continue;
    }

    if (m.role === 'tool') {
      converted.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: m.tool_call_id,
          content: String(m.content ?? ''),
        }],
      });
      continue;
    }

    const blocks: AnthropicBlock[] = [];
    const text = String(m.content ?? '').trim();
    if (text) blocks.push({ type: 'text', text });

    for (const tc of m.tool_calls ?? []) {
      let input: unknown = {};
      try {
        input = typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments || '{}')
          : tc.function.arguments;
      } catch {
        input = {};
      }
      blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
    }

    // Anthropic rejects a message with no content blocks.
    if (blocks.length === 0) continue;
    converted.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: blocks });
  }

  // A conversation must open on a user turn.
  while (converted.length > 0 && converted[0].role !== 'user') converted.shift();

  const merged: AnthropicMessage[] = [];
  for (const msg of converted) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) prev.content.push(...msg.content);
    else merged.push({ role: msg.role, content: [...msg.content] });
  }

  return { system: systemParts.join('\n\n'), messages: merged };
}

/** OpenAI `function` tools -> Anthropic `input_schema` tools. */
function toAnthropicTools(tools: OpenAITool[]) {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description ?? '',
    input_schema: t.function.parameters,
  }));
}

async function readProviderError(res: Response, label: string): Promise<ProviderError> {
  const body = await res.text().catch(() => '');
  console.error(`${label} error ${res.status}:`, body.slice(0, 500));

  if (res.status === 429) return new ProviderError('Rate limit exceeded. Please try again shortly.', 429);
  if (res.status === 402) return new ProviderError('Usage limit reached. Please add credits.', 402);
  if (res.status === 401 || res.status === 403) {
    return new ProviderError('AI provider rejected the configured API key.', 502);
  }
  return new ProviderError(`${label} error ${res.status}`, 502);
}

// ---------------------------------------------------------------------------
// Non-streaming completion with tools (the CRUD tool-calling rounds)
// ---------------------------------------------------------------------------

export interface ChatChoice {
  message: OpenAIMessage;
  finish_reason: string;
}

/**
 * Runs one round of the tool loop and returns an OpenAI-shaped choice, so the
 * caller's `lastChoice.message` can be appended straight back onto the
 * conversation regardless of which provider answered.
 */
export async function chatWithTools(
  cfg: ProviderConfig,
  messages: OpenAIMessage[],
  tools: OpenAITool[],
  opts: { maxTokens: number; temperature: number },
): Promise<ChatChoice> {
  if (cfg.provider === 'anthropic') {
    const { system, messages: anthropicMessages } = toAnthropic(messages);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': cfg.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        system,
        messages: anthropicMessages,
        tools: toAnthropicTools(tools),
      }),
    });

    if (!res.ok) throw await readProviderError(res, 'Anthropic');

    const data = await res.json();
    const blocks: Array<Record<string, any>> = data?.content ?? [];

    const text = blocks
      .filter((b) => b?.type === 'text')
      .map((b) => b.text ?? '')
      .join('');

    const toolCalls = blocks
      .filter((b) => b?.type === 'tool_use')
      .map((b) => ({
        id: String(b.id),
        type: 'function' as const,
        function: { name: String(b.name), arguments: JSON.stringify(b.input ?? {}) },
      }));

    return {
      message: {
        role: 'assistant',
        content: text,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      },
      finish_reason: data?.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
    };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      tools,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) throw await readProviderError(res, 'OpenAI');

  const data = await res.json();
  const choice = data?.choices?.[0];
  return {
    message: choice?.message ?? { role: 'assistant', content: '' },
    finish_reason: choice?.finish_reason ?? 'stop',
  };
}

// ---------------------------------------------------------------------------
// Streaming completion
// ---------------------------------------------------------------------------

function sseFrame(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n`;
}

/**
 * Translates Anthropic's event stream into the OpenAI-shaped SSE frames the
 * browser clients already parse. Only `text_delta` is forwarded; every other
 * event type (message_start, content_block_start, ping, usage deltas) carries
 * nothing the UI renders.
 */
function anthropicStreamToOpenAISSE(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.getReader();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line; keep any partial tail.
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed?.type === 'content_block_delta' && parsed?.delta?.type === 'text_delta') {
              const text = parsed.delta.text;
              if (typeof text === 'string' && text.length > 0) {
                controller.enqueue(encoder.encode(sseFrame(text)));
              }
            } else if (parsed?.type === 'error') {
              console.error('Anthropic stream error event:', parsed?.error);
            }
          } catch {
            // A malformed frame should not tear down a live chat.
          }
        }
      }
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => {});
    },
  });
}

/**
 * Returns a body that always speaks OpenAI-shaped SSE: translated for
 * Anthropic, passed straight through for OpenAI.
 */
export async function chatStream(
  cfg: ProviderConfig,
  messages: OpenAIMessage[],
  opts: { maxTokens: number; temperature: number },
): Promise<ReadableStream<Uint8Array>> {
  if (cfg.provider === 'anthropic') {
    const { system, messages: anthropicMessages } = toAnthropic(messages);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': cfg.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        system,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!res.ok) throw await readProviderError(res, 'Anthropic');
    if (!res.body) throw new ProviderError('Anthropic returned an empty stream', 502);

    return anthropicStreamToOpenAISSE(res.body);
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      stream: true,
    }),
  });

  if (!res.ok) throw await readProviderError(res, 'OpenAI');
  if (!res.body) throw new ProviderError('OpenAI returned an empty stream', 502);

  return res.body;
}
