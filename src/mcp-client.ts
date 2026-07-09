// src/mcp-client.ts — minimal JSON-RPC 2.0 client for the Originkit MCP endpoint.
// The Originkit MCP server speaks standard MCP over HTTP POST with bearer auth.
//
// Two tools are available:
//   - list_components: returns the full component catalog
//   - get_component:   fetches a single component's source code
//
// Daily limit: 10 get_component calls per API key, resets at 00:00 UTC.

const MCP_ENDPOINT = "https://mcp.originkit.dev/mcp";

export interface ComponentMeta {
  name: string;
  displayName: string;
  category: string;
  description: string;
  tags: string[];
  variants: string[];
  dependencies: string[];
}

export interface ComponentIndex {
  count: number;
  components: ComponentMeta[];
}

export interface GetComponentResult {
  /** Raw text content returned by the MCP server (component code + metadata). */
  content: string;
  /** True when the server reported the daily limit was reached. */
  dailyLimitReached: boolean;
}

/**
 * Call a tool on the Originkit MCP server via JSON-RPC 2.0.
 * Returns the parsed result content.
 */
async function callMcpTool(
  apiKey: string,
  toolName: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  });

  const resp = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body,
    signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Originkit MCP returned HTTP ${resp.status}: ${text.slice(0, 200)}`,
    );
  }

  // The server may respond with JSON or SSE. Parse accordingly.
  const contentType = resp.headers.get("content-type") ?? "";
  let raw: string;

  if (contentType.includes("text/event-stream")) {
    // SSE: read the full stream and extract the data payload
    raw = await resp.text();
    // grab the last data: line
    const dataLines = raw
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    const lastData = dataLines[dataLines.length - 1];
    if (!lastData) throw new Error("Originkit MCP: empty SSE stream");
    return JSON.parse(lastData);
  }

  raw = await resp.text();
  return JSON.parse(raw);
}

/**
 * List all available components from the Originkit MCP server.
 */
export async function listComponents(
  apiKey: string,
  signal?: AbortSignal,
): Promise<ComponentIndex> {
  const result = await callMcpTool(apiKey, "list_components", {}, signal);
  const typed = result as {
    result?: { content?: Array<{ type: string; text: string }> };
    error?: { message: string };
  };

  if (typed.error) {
    throw new Error(`Originkit MCP error: ${typed.error.message}`);
  }

  const textParts = (typed.result?.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text);
  const fullText = textParts.join("\n");

  try {
    const parsed = JSON.parse(fullText);
    // The response may be { count, components } or just an array
    if (Array.isArray(parsed)) {
      return { count: parsed.length, components: parsed };
    }
    return parsed as ComponentIndex;
  } catch {
    throw new Error(
      `Originkit MCP: could not parse list_components response: ${fullText.slice(0, 200)}`,
    );
  }
}

/**
 * Fetch a single component's source code from the Originkit MCP server.
 */
export async function getComponent(
  apiKey: string,
  name: string,
  options: {
    stack?: "framer" | "react" | "nextjs" | "vite";
    styling?: "css" | "tailwind" | "cssmodules";
    typescript?: boolean;
  },
  signal?: AbortSignal,
): Promise<GetComponentResult> {
  const args: Record<string, unknown> = {
    name,
    stack: options.stack ?? "react",
    styling: options.styling ?? "css",
    typescript: options.typescript ?? true,
  };

  const result = await callMcpTool(apiKey, "get_component", args, signal);
  const typed = result as {
    result?: { content?: Array<{ type: string; text: string }> };
    error?: { message: string };
  };

  if (typed.error) {
    const msg = typed.error.message;
    if (msg.toLowerCase().includes("daily limit")) {
      return { content: msg, dailyLimitReached: true };
    }
    throw new Error(`Originkit MCP error: ${msg}`);
  }

  const textParts = (typed.result?.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text);
  const fullText = textParts.join("\n");

  const dailyLimitReached = fullText.toLowerCase().includes("daily limit reached");

  return { content: fullText, dailyLimitReached };
}
