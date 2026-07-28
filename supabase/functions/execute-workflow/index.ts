import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  settings: Record<string, any>;
  inputs: { id: string; label: string; type: string }[];
  outputs: { id: string; label: string; type: string }[];
}

interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

interface NodeResult {
  nodeId: string;
  nodeType: string;
  label: string;
  status: "success" | "error" | "skipped";
  output: any;
  error?: string;
  durationMs: number;
  startedAt: string;
}

/**
 * AI node provider. Lovable removed entirely (2026-07-28, owner decision).
 * Anthropic (recommended) or OpenAI, chosen by whichever key is set.
 */
type Provider = "anthropic" | "openai";

function resolveAiProvider(requestedModel?: string): { provider: Provider; apiKey: string; model: string } | null {
  const explicit = (Deno.env.get("AI_PROVIDER") || "").toLowerCase() as Provider | "";
  const keys: Record<Provider, string | undefined> = {
    anthropic: Deno.env.get("ANTHROPIC_API_KEY") || undefined,
    openai: Deno.env.get("OPENAI_API_KEY") || undefined,
  };
  const defaults: Record<Provider, string> = { anthropic: "claude-sonnet-5", openai: "gpt-4o-mini" };
  const order: Provider[] = explicit && keys[explicit] ? [explicit] : ["anthropic", "openai"];
  for (const p of order) {
    const apiKey = keys[p];
    if (apiKey) return { provider: p, apiKey, model: requestedModel || Deno.env.get("AI_MODEL") || defaults[p] };
  }
  return null;
}

async function executeNode(
  node: WorkflowNode,
  inputData: any,
  supabaseClient: any,
  userId: string
): Promise<{ output: any; nextPort?: string }> {
  switch (node.type) {
    case "trigger":
    case "webhook":
      return { output: inputData || { triggered: true, timestamp: new Date().toISOString() } };

    case "http-request": {
      const { url, method, headers, body } = node.settings;
      if (!url) throw new Error("URL is required");
      const fetchOpts: RequestInit = {
        method: method || "GET",
        headers: { "Content-Type": "application/json", ...(headers || {}) },
      };
      if (body && method !== "GET") {
        // Replace template variables {{input.field}}
        let processedBody = body;
        if (typeof processedBody === "string" && inputData) {
          processedBody = processedBody.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => {
            return inputData?.[key] ?? "";
          });
        }
        fetchOpts.body = processedBody;
      }
      let processedUrl = url;
      if (inputData) {
        processedUrl = processedUrl.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => {
          return inputData?.[key] ?? "";
        });
      }
      const resp = await fetch(processedUrl, fetchOpts);
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      return { output: { status: resp.status, data, headers: Object.fromEntries(resp.headers.entries()) } };
    }

    case "code": {
      // C2 fix: `new Function(code)` compiled in the isolate's global scope, so
      // Deno, fetch and globalThis were all reachable - a workflow node of
      // `return Deno.env.toObject()` returned every project secret (including
      // the service-role key) to its author. Edge-function secrets are shared
      // across all functions, so this was a full compromise.
      //
      // We fail closed: arbitrary code execution is disabled unless an operator
      // explicitly opts in via WORKFLOW_ALLOW_CODE_EVAL=true. Even then we run
      // it with the dangerous globals shadowed to `undefined`. This is a
      // mitigation, NOT a real sandbox - before exposing code nodes to
      // untrusted/multi-tenant users, move execution into a WASM isolate
      // (e.g. quickjs-emscripten) with no host bindings.
      const { code } = node.settings;
      if (Deno.env.get("WORKFLOW_ALLOW_CODE_EVAL") !== "true") {
        throw new Error(
          "Code nodes are disabled for security. Set WORKFLOW_ALLOW_CODE_EVAL=true " +
          "on this project only if you trust everyone who can create workflows."
        );
      }
      // Block the obvious host-access identifiers outright before evaluating.
      const forbidden = /\b(Deno|globalThis|process|require|import|eval|Function|constructor|fetch|WebAssembly|Reflect|Proxy)\b/;
      if (forbidden.test(code)) {
        throw new Error("Code node contains a disallowed identifier.");
      }
      try {
        // Shadow host globals as function parameters so they resolve to
        // undefined inside the user code even if the denylist is bypassed.
        const fn = new Function(
          "Deno", "globalThis", "process", "fetch", "WebAssembly", "Reflect", "Proxy",
          "input", "items",
          `"use strict"; ${code}`
        );
        const result = fn(
          undefined, undefined, undefined, undefined, undefined, undefined, undefined,
          inputData, inputData
        );
        return { output: result ?? inputData };
      } catch (e) {
        throw new Error(`Code execution error: ${(e as Error).message}`);
      }
    }

    case "if": {
      const { condition, value, operator } = node.settings;
      let fieldValue = inputData;
      if (condition) {
        const parts = condition.split(".");
        fieldValue = inputData;
        for (const p of parts) {
          fieldValue = fieldValue?.[p];
        }
      }
      let result = false;
      const op = operator || "equals";
      switch (op) {
        case "equals": result = String(fieldValue) === String(value); break;
        case "not_equals": result = String(fieldValue) !== String(value); break;
        case "contains": result = String(fieldValue).includes(String(value)); break;
        case "greater_than": result = Number(fieldValue) > Number(value); break;
        case "less_than": result = Number(fieldValue) < Number(value); break;
        case "exists": result = fieldValue != null && fieldValue !== ""; break;
        case "not_exists": result = fieldValue == null || fieldValue === ""; break;
        default: result = String(fieldValue) === String(value);
      }
      return {
        output: { ...inputData, _condition: result },
        nextPort: result ? "true" : "false",
      };
    }

    case "switch": {
      const { field, cases } = node.settings;
      let fieldValue = inputData;
      if (field) {
        const parts = field.split(".");
        fieldValue = inputData;
        for (const p of parts) fieldValue = fieldValue?.[p];
      }
      const matchedCase = (cases || []).findIndex((c: any) => String(c.value) === String(fieldValue));
      return {
        output: inputData,
        nextPort: matchedCase >= 0 ? String(matchedCase + 1) : "default",
      };
    }

    case "set": {
      const { values } = node.settings;
      return { output: { ...inputData, ...(values || {}) } };
    }

    case "merge": {
      return { output: inputData };
    }

    case "wait": {
      const { duration, unit } = node.settings;
      let ms = Number(duration) || 1000;
      switch (unit) {
        case "s": ms *= 1000; break;
        case "m": ms *= 60000; break;
        case "h": ms *= 3600000; break;
      }
      // Cap at 10 seconds for edge function
      ms = Math.min(ms, 10000);
      await new Promise((r) => setTimeout(r, ms));
      return { output: inputData };
    }

    case "email": {
      const { to, subject, body } = node.settings;
      // Use Resend if available
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY && to) {
        let processedBody = body || "";
        let processedSubject = subject || "";
        if (inputData) {
          processedBody = processedBody.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => inputData?.[key] ?? "");
          processedSubject = processedSubject.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => inputData?.[key] ?? "");
        }
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Workflow <onboarding@resend.dev>",
            to: [to],
            subject: processedSubject,
            html: `<p>${processedBody}</p>`,
          }),
        });
        const emailData = await emailResp.json();
        return { output: { sent: true, ...emailData } };
      }
      return { output: { sent: false, reason: "Email not configured", to, subject } };
    }

    case "database": {
      const { operation, table, query, data: insertData, filters } = node.settings;
      if (!table) throw new Error("Table name is required");
      switch (operation) {
        case "read": {
          let q = supabaseClient.from(table).select("*");
          if (filters) {
            for (const f of Object.entries(filters)) {
              q = q.eq(f[0], f[1]);
            }
          }
          const { data, error } = await q.limit(100);
          if (error) throw new Error(error.message);
          return { output: data };
        }
        case "insert": {
          const row = insertData || inputData || {};
          const { data, error } = await supabaseClient.from(table).insert(row).select();
          if (error) throw new Error(error.message);
          return { output: data };
        }
        case "update": {
          if (!filters) throw new Error("Filters required for update");
          const updateData = insertData || inputData || {};
          let q = supabaseClient.from(table).update(updateData);
          for (const f of Object.entries(filters)) q = q.eq(f[0], f[1]);
          const { data, error } = await q.select();
          if (error) throw new Error(error.message);
          return { output: data };
        }
        case "delete": {
          if (!filters) throw new Error("Filters required for delete");
          let q = supabaseClient.from(table).delete();
          for (const f of Object.entries(filters)) q = q.eq(f[0], f[1]);
          const { error } = await q;
          if (error) throw new Error(error.message);
          return { output: { deleted: true } };
        }
        default:
          return { output: inputData };
      }
    }

    case "ai": {
      // Lovable removed (2026-07-28). Anthropic or OpenAI only.
      const { prompt, model, temperature } = node.settings;
      const cfg = resolveAiProvider(model);
      if (!cfg) {
        throw new Error(
          "AI not configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY on this project."
        );
      }

      let processedPrompt = prompt || "";
      if (inputData) {
        processedPrompt = processedPrompt.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => {
          const val = inputData?.[key];
          return typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
        });
        if (!prompt) processedPrompt = `Process this data: ${JSON.stringify(inputData)}`;
      }

      const system = "You are a helpful assistant processing workflow data. Return concise, structured responses.";
      let content = "";

      if (cfg.provider === "anthropic") {
        const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": cfg.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: cfg.model,
            max_tokens: 4096,
            temperature: temperature ?? 0.7,
            system,
            messages: [{ role: "user", content: processedPrompt }],
          }),
        });
        if (!aiResp.ok) {
          const errText = await aiResp.text();
          throw new Error(`AI error [${aiResp.status}]: ${errText.slice(0, 300)}`);
        }
        const aiData = await aiResp.json();
        content = (aiData?.content ?? [])
          .filter((b: { type?: string }) => b?.type === "text")
          .map((b: { text?: string }) => b.text ?? "")
          .join("");
      } else {
        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: cfg.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: processedPrompt },
            ],
            temperature: temperature ?? 0.7,
          }),
        });
        if (!aiResp.ok) {
          const errText = await aiResp.text();
          throw new Error(`AI error [${aiResp.status}]: ${errText.slice(0, 300)}`);
        }
        const aiData = await aiResp.json();
        content = aiData?.choices?.[0]?.message?.content || "";
      }

      return { output: { result: content, provider: cfg.provider, model: cfg.model } };
    }

    case "transform": {
      const { transformType, field, expression } = node.settings;
      switch (transformType) {
        case "pick":
          if (field && inputData) {
            const parts = field.split(",").map((f: string) => f.trim());
            const picked: Record<string, any> = {};
            for (const p of parts) {
              if (inputData[p] !== undefined) picked[p] = inputData[p];
            }
            return { output: picked };
          }
          return { output: inputData };
        case "stringify":
          return { output: { result: JSON.stringify(inputData) } };
        case "parse":
          try {
            return { output: JSON.parse(typeof inputData === "string" ? inputData : inputData?.result || "{}") };
          } catch {
            return { output: inputData };
          }
        case "flatten":
          if (Array.isArray(inputData)) return { output: inputData.flat() };
          return { output: inputData };
        default:
          return { output: inputData };
      }
    }

    case "filter": {
      const { field: filterField, operator: filterOp, value: filterVal } = node.settings;
      if (Array.isArray(inputData) && filterField) {
        const filtered = inputData.filter((item: any) => {
          const v = item[filterField];
          switch (filterOp) {
            case "equals": return String(v) === String(filterVal);
            case "contains": return String(v).includes(String(filterVal));
            case "greater_than": return Number(v) > Number(filterVal);
            case "less_than": return Number(v) < Number(filterVal);
            default: return true;
          }
        });
        return { output: filtered };
      }
      return { output: inputData };
    }

    case "loop": {
      // Pass through - loop logic handled in execution engine
      if (Array.isArray(inputData)) {
        return { output: inputData };
      }
      return { output: [inputData] };
    }

    case "respond": {
      const { statusCode, responseBody } = node.settings;
      let body = responseBody || "";
      if (inputData) {
        body = body.replace(/\{\{input\.(\w+)\}\}/g, (_: string, key: string) => inputData?.[key] ?? "");
      }
      return { output: { statusCode: statusCode || 200, body: body || inputData } };
    }

    case "note": {
      // Notes are visual-only, pass through data
      return { output: inputData };
    }

    default:
      return { output: inputData };
  }
}

function getExecutionOrder(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): WorkflowNode[] {
  // Topological sort
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  }
  for (const c of connections) {
    adj[c.sourceNodeId]?.push(c.targetNodeId);
    if (inDegree[c.targetNodeId] !== undefined) inDegree[c.targetNodeId]++;
  }
  const queue: string[] = [];
  for (const [id, deg] of Object.entries(inDegree)) {
    if (deg === 0) queue.push(id);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const next of adj[current] || []) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  // Add any remaining nodes (cycles)
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id);
  }
  return order.map((id) => nodes.find((n) => n.id === id)!).filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workflowId, triggerData } = await req.json();
    if (!workflowId) {
      return new Response(JSON.stringify({ error: "workflowId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load workflow
    const { data: workflow, error: wfError } = await supabaseClient
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", user.id)
      .single();

    if (wfError || !workflow) {
      return new Response(JSON.stringify({ error: "Workflow not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nodes: WorkflowNode[] = (workflow.nodes as any) || [];
    const connections: WorkflowConnection[] = (workflow.connections as any) || [];

    if (nodes.length === 0) {
      return new Response(JSON.stringify({ error: "Workflow has no nodes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create run record
    const { data: run } = await supabaseClient
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: "running",
        trigger_data: triggerData || {},
      })
      .select("id")
      .single();

    const runId = run?.id;
    const startTime = Date.now();
    const nodeResults: NodeResult[] = [];
    const nodeOutputs: Record<string, any> = {};

    // Execute nodes in topological order
    const executionOrder = getExecutionOrder(nodes, connections);

    for (const node of executionOrder) {
      const nodeStart = Date.now();
      try {
        // Gather input from connected nodes
        const incomingConnections = connections.filter((c) => c.targetNodeId === node.id);
        let inputData: any = triggerData || {};

        if (incomingConnections.length > 0) {
          if (incomingConnections.length === 1) {
            const sourceOutput = nodeOutputs[incomingConnections[0].sourceNodeId];
            // Check if this connection should be skipped (IF node branching)
            const sourceNode = nodes.find((n) => n.id === incomingConnections[0].sourceNodeId);
            if (sourceNode && (sourceNode.type === "if" || sourceNode.type === "switch")) {
              const sourceResult = nodeResults.find((r) => r.nodeId === sourceNode.id);
              const nextPort = sourceResult?.output?._nextPort;
              const connPortId = incomingConnections[0].sourcePortId;
              if (nextPort && !connPortId.includes(nextPort)) {
                nodeResults.push({
                  nodeId: node.id,
                  nodeType: node.type,
                  label: node.label,
                  status: "skipped",
                  output: null,
                  durationMs: 0,
                  startedAt: new Date().toISOString(),
                });
                continue;
              }
            }
            inputData = sourceOutput ?? inputData;
          } else {
            // Merge inputs
            const merged: Record<string, any> = {};
            for (const conn of incomingConnections) {
              Object.assign(merged, nodeOutputs[conn.sourceNodeId] || {});
            }
            inputData = merged;
          }
        }

        const { output, nextPort } = await executeNode(node, inputData, supabaseClient, user.id);
        const finalOutput = nextPort ? { ...output, _nextPort: nextPort } : output;
        nodeOutputs[node.id] = finalOutput;

        nodeResults.push({
          nodeId: node.id,
          nodeType: node.type,
          label: node.label,
          status: "success",
          output: finalOutput,
          durationMs: Date.now() - nodeStart,
          startedAt: new Date(nodeStart).toISOString(),
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        nodeResults.push({
          nodeId: node.id,
          nodeType: node.type,
          label: node.label,
          status: "error",
          output: null,
          error: errorMsg,
          durationMs: Date.now() - nodeStart,
          startedAt: new Date(nodeStart).toISOString(),
        });
        // Don't break - continue with other branches
      }
    }

    const totalDuration = Date.now() - startTime;
    const hasErrors = nodeResults.some((r) => r.status === "error");
    const finalStatus = hasErrors ? "completed_with_errors" : "completed";

    // Update run record
    if (runId) {
      await supabaseClient
        .from("workflow_runs")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          node_results: nodeResults as any,
          duration_ms: totalDuration,
          error: hasErrors ? nodeResults.find((r) => r.status === "error")?.error : null,
        })
        .eq("id", runId);
    }

    // Update workflow run count
    await supabaseClient
      .from("workflows")
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (workflow.run_count || 0) + 1,
      })
      .eq("id", workflowId);

    return new Response(
      JSON.stringify({
        runId,
        status: finalStatus,
        duration_ms: totalDuration,
        results: nodeResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Workflow execution error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
