// tools/originkit_setup.ts — check, set, or reset the Originkit API key.
// Guides the user through getting a key from originkit.dev.
//
// Key storage:
//   - config.json: user adds it manually for persistence across sessions
//   - In-memory session cache: set via requestSecret, lasts for the session only
// The plugin never writes secrets to disk.

import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import { getApiKey, setSessionKey, clearSessionKey } from "../src/storage.ts";

export default {
  description:
    "Check, set, or reset the Originkit API key. Guides the user through " +
    "getting a free key from originkit.dev. Use this when the user wants to " +
    "connect their Originkit account, check if their key is configured, or " +
    "update an expired key. The key is required to fetch component source code " +
    "(originkit_get) but not for browsing (originkit_browse).",
  defaultRiskLevel: "low" as const,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description:
          "What to do: 'status' checks if a key is set, 'set' prompts for a new key, " +
          "'reset' clears the session key.",
        enum: ["status", "set", "reset"],
        default: "status",
      },
    },
  },
  async execute(
    input: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolExecutionResult> {
    const action = String(input.action ?? "status").trim();

    if (action === "status") {
      const key = getApiKey();
      if (key) {
        const masked =
          key.length > 12
            ? key.slice(0, 8) + "••••" + key.slice(-4)
            : "••••";
        return {
          content:
            `Originkit API key is configured (${masked}).\n` +
            `You can browse components with \`originkit_browse\` and fetch code with \`originkit_get\`.\n` +
            `Daily limit: 10 fetches per key, resets at midnight UTC.\n` +
            `Use \`originkit_setup\` with action "reset" to clear the session key.`,
          isError: false,
        };
      }
      return {
        content:
          `No Originkit API key is configured.\n\n` +
          `To get one (free):\n` +
          `1. Go to https://originkit.dev\n` +
          `2. Create an account or log in\n` +
          `3. Open Settings > API Integration\n` +
          `4. Copy your API key (it looks like cmp_live_...)\n\n` +
          `Then use \`originkit_setup\` with action "set" to enter it for this session, ` +
          `or add it to the plugin's config.json for persistence:\n` +
          `  { "apiKey": "cmp_live_..." }\n\n` +
          `You can browse components without a key using \`originkit_browse\`.`,
        isError: false,
      };
    }

    if (action === "reset") {
      clearSessionKey();
      return {
        content:
          "Session API key cleared. If your key is in config.json, remove it there too. " +
          "Use `originkit_setup` with action \"set\" to enter a new key for this session.",
        isError: false,
      };
    }

    if (action === "set") {
      if (!ctx.requestSecret) {
        return {
          content:
            "Secure key entry is not available in this context.\n" +
            "Get a free key at https://originkit.dev > Settings > API Integration.\n" +
            "Then add it to the plugin's config.json:\n" +
            '  { "apiKey": "cmp_live_..." }',
          isError: true,
        };
      }

      try {
        const result = await ctx.requestSecret({
          prompt:
            "Enter your Originkit API key. Get one free at originkit.dev under " +
            "Settings > API Integration. It looks like cmp_live_...",
          label: "Originkit API Key",
        });
        if (!result || !result.value) {
          return {
            content: "No API key was entered. Setup cancelled.",
            isError: false,
          };
        }
        setSessionKey(result.value);
        return {
          content:
            "Originkit API key saved for this session. You can now fetch component " +
            "source code with `originkit_get`.\n\n" +
            "For persistence across sessions, add it to the plugin's config.json:\n" +
            '  { "apiKey": "cmp_live_..." }\n\n' +
            "Daily limit: 10 fetches per key, resets at midnight UTC.",
          isError: false,
        };
      } catch (e) {
        return {
          content: `Failed to prompt for API key: ${(e as Error).message}`,
          isError: true,
        };
      }
    }

    return { content: `Unknown action: ${action}`, isError: true };
  },
};
