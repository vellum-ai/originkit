// tools/originkit_get.ts — fetch a single component's source code from Originkit.
// Requires an API key. Calls the Originkit MCP server via JSON-RPC 2.0.
// Daily limit: 10 fetches per key, resets at 00:00 UTC.

import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import { getComponent } from "../src/mcp-client.ts";
import { getApiKey, saveApiKey } from "../src/storage.ts";

export default {
  description:
    "Fetch a component's full source code from Originkit. " +
    "Requires an Originkit API key (free, get one at originkit.dev under Settings > API Integration). " +
    "If no key is stored, the user will be prompted to enter one. " +
    "Returns the component code in the requested stack and styling format. " +
    "Daily limit: 10 fetches per API key, resets at midnight UTC.",
  defaultRiskLevel: "low" as const,
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description:
          "Component name (kebab-case, e.g. 'blackhole', 'smokytext', 'pixelreveal'). " +
          "Use originkit_browse to find available names.",
      },
      stack: {
        type: "string",
        description: "Target framework stack.",
        enum: ["framer", "react", "nextjs", "vite"],
        default: "react",
      },
      styling: {
        type: "string",
        description: "CSS approach for the component.",
        enum: ["css", "tailwind", "cssmodules"],
        default: "css",
      },
      typescript: {
        type: "boolean",
        description: "Whether to return TypeScript or JavaScript.",
        default: true,
      },
    },
    required: ["name"],
  },
  async execute(
    input: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolExecutionResult> {
    const name = String(input.name ?? "").trim();
    if (!name) {
      return { content: "Error: component name is required.", isError: true };
    }

    const stack = (input.stack as "framer" | "react" | "nextjs" | "vite") ?? "react";
    const styling = (input.styling as "css" | "tailwind" | "cssmodules") ?? "css";
    const typescript = input.typescript !== false;

    // Resolve the API key
    let apiKey = getApiKey();

    if (!apiKey) {
      // Prompt the user for their key via the native secure field UI
      if (!ctx.requestSecret) {
        return {
          content:
            "No Originkit API key is configured and secure prompting is not available.\n" +
            "Get a free key at https://originkit.dev under Settings > API Integration, " +
            "then use `originkit_setup` to store it.",
          isError: true,
        };
      }

      try {
        const result = await ctx.requestSecret({
          prompt:
            "Enter your Originkit API key (free at originkit.dev > Settings > API Integration). " +
            "It looks like cmp_live_...",
          label: "Originkit API Key",
        });
        if (!result || !result.value) {
          return {
            content:
              "No API key provided. Get a free key at https://originkit.dev " +
              "under Settings > API Integration, then try again.",
            isError: true,
          };
        }
        apiKey = result.value;
        saveApiKey(apiKey);
      } catch (e) {
        return {
          content: `Failed to prompt for API key: ${(e as Error).message}`,
          isError: true,
        };
      }
    }

    // Call the MCP server
    try {
      const result = await getComponent(
        apiKey,
        name,
        { stack, styling, typescript },
        ctx.signal,
      );

      if (result.dailyLimitReached) {
        return {
          content:
            `Daily limit reached for this API key (10 fetches per day, resets at midnight UTC). ` +
            `Try again after 00:00 UTC.`,
          isError: true,
        };
      }

      const header = [
        `Component: ${name}`,
        `Stack: ${stack} | Styling: ${styling} | TypeScript: ${typescript}`,
        "",
      ].join("\n");

      return { content: header + result.content, isError: false };
    } catch (e) {
      const msg = (e as Error).message;
      // If the key might be invalid, hint at re-setup
      if (msg.includes("401") || msg.includes("unauthorized")) {
        return {
          content:
            `Authentication failed. Your API key may be invalid or expired. ` +
            `Get a fresh key at https://originkit.dev > Settings > API Integration ` +
            `and use \`originkit_setup\` to update it.`,
          isError: true,
        };
      }
      return { content: `Error fetching component: ${msg}`, isError: true };
    }
  },
};
