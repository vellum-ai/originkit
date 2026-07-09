// tools/originkit_browse.ts — browse and search the Originkit component library.
// Uses the bundled component index (50 components) so browsing works without
// an API key. The user only needs a key to fetch component source code.

import * as fs from "node:fs";
import * as path from "node:path";
import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import type { ComponentMeta, ComponentIndex } from "../src/mcp-client.ts";

let _cachedIndex: ComponentIndex | null = null;

function loadIndex(): ComponentIndex {
  if (_cachedIndex) return _cachedIndex;
  const indexPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "src",
    "component-index.json",
  );
  const raw = fs.readFileSync(indexPath, "utf-8");
  _cachedIndex = JSON.parse(raw) as ComponentIndex;
  return _cachedIndex;
}

const CATEGORY_EMOJI: Record<string, string> = {
  "interactive-elements": "🖱️",
  "image-gallery": "🖼️",
  text: "✍️",
  animation: "✨",
  "background-animation": "🌌",
  button: "🔘",
};

function formatComponent(c: ComponentMeta): string {
  const emoji = CATEGORY_EMOJI[c.category] ?? "📦";
  const deps =
    c.dependencies.length > 0 ? ` [deps: ${c.dependencies.join(", ")}]` : "";
  return `${emoji} ${c.displayName} (\`${c.name}\`) — ${c.category}${deps}\n   ${c.description}`;
}

export default {
  description:
    "Browse and search Originkit's library of 50 free animated components. " +
    "Returns component names, descriptions, categories, and tags. " +
    "No API key needed for browsing. Use this when the user wants to explore " +
    "animated UI components, find animation ideas, or see what Originkit offers. " +
    "Pass a search query to filter, or a category to browse a specific group.",
  defaultRiskLevel: "low" as const,
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Optional search term. Matches against component name, display name, " +
          "description, and tags. Case-insensitive.",
      },
      category: {
        type: "string",
        description:
          "Optional category filter. One of: interactive-elements, " +
          "image-gallery, text, animation, background-animation, button.",
        enum: [
          "interactive-elements",
          "image-gallery",
          "text",
          "animation",
          "background-animation",
          "button",
        ],
      },
    },
  },
  async execute(
    input: Record<string, unknown>,
    _ctx: ToolContext,
  ): Promise<ToolExecutionResult> {
    const query = String(input.query ?? "").trim().toLowerCase();
    const category = String(input.category ?? "").trim().toLowerCase();

    let index: ComponentIndex;
    try {
      index = loadIndex();
    } catch (e) {
      return {
        content: `Error loading component index: ${(e as Error).message}`,
        isError: true,
      };
    }

    let components = index.components;

    if (category) {
      components = components.filter(
        (c) => c.category.toLowerCase() === category,
      );
    }

    if (query) {
      components = components.filter((c) => {
        const haystack = [
          c.name,
          c.displayName,
          c.description,
          c.category,
          ...c.tags,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    if (components.length === 0) {
      const filterDesc = [query && `query "${query}"`, category && `category "${category}"`]
        .filter(Boolean)
        .join(", ");
      return {
        content:
          `No components matched ${filterDesc || "your filter"}. ` +
          `Originkit has ${index.count} components across 6 categories. ` +
          `Try browsing without a filter to see everything.`,
        isError: false,
      };
    }

    const lines: string[] = [];
    lines.push(`Originkit — ${components.length} component${components.length === 1 ? "" : "s"}`);
    if (query) lines.push(`Search: "${query}"`);
    if (category) lines.push(`Category: ${category}`);
    lines.push("");
    lines.push(
      `To fetch a component's code, use \`originkit_get\` with its name. ` +
        `Requires an API key (get one free at originkit.dev).`,
    );
    lines.push("");

    // group by category for readability
    const byCategory = new Map<string, ComponentMeta[]>();
    for (const c of components) {
      const arr = byCategory.get(c.category) ?? [];
      arr.push(c);
      byCategory.set(c.category, arr);
    }

    const sortedCategories = [...byCategory.keys()].sort();
    for (const cat of sortedCategories) {
      const items = byCategory.get(cat)!;
      lines.push(`### ${cat} (${items.length})`);
      lines.push("");
      for (const c of items) {
        lines.push(formatComponent(c));
      }
      lines.push("");
    }

    return { content: lines.join("\n"), isError: false };
  },
};
