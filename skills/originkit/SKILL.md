---
name: originkit
description: >-
  Browse and import animated UI components from Originkit, a free library of
  50 animated components for modern websites. Use when the user wants to find
  animated components, add animations to their project, explore Originkit's
  library, or fetch component source code.
metadata:
  emoji: "✨"
  vellum:
    display-name: "Originkit"
    activation-hints:
      - "User wants to browse or find animated components"
      - "User mentions Originkit"
      - "User wants to add animations to their website or app"
      - "User asks for animated UI components (text effects, image galleries, backgrounds, particles)"
      - "User wants to fetch a specific Originkit component's code"
    avoid-when:
      - "User asks for animations unrelated to web UI components"
      - "User wants to build animations from scratch without a library"
---

Browse and import animated components from Originkit's free library of 50 components.

## What Originkit is

Originkit (originkit.dev) is a free animated component library for modern websites. It offers 50 animated React components across 6 categories: interactive elements, image galleries, text effects, animations, background animations, and buttons. Components can be used in Framer, React, Next.js, or Vite projects, with CSS, Tailwind, or CSS Modules styling.

## Setup: getting an API key

Browsing the library does **not** require an API key. Fetching component source code does.

To get a free API key:

1. Go to https://originkit.dev
2. Create an account or log in
3. Open **Settings > API Integration**
4. Copy your API key (it looks like `cmp_live_...`)

Then call `originkit_setup` with action `"set"` to store the key, or simply call `originkit_get` for any component and the user will be prompted automatically.

**Daily limit:** 10 component fetches per API key per day, resets at midnight UTC. This limit is shared between MCP and website copies.

## Workflow

### Browse the library

Call `originkit_browse` to list or search components. It works without an API key.

- Pass `query` to search across names, descriptions, and tags (e.g. "particle", "text hover", "gallery").
- Pass `category` to filter by one of: `interactive-elements`, `image-gallery`, `text`, `animation`, `background-animation`, `button`.
- No arguments returns all 50 components grouped by category.

Present results in a readable format. Each component shows its display name, kebab-case identifier (needed for fetching), category, dependencies, and a one-line description.

### Fetch a component

Once the user picks a component, call `originkit_get` with:

- `name` (required): the kebab-case component name from browse results.
- `stack` (optional, default `react`): `framer`, `react`, `nextjs`, or `vite`.
- `styling` (optional, default `css`): `css`, `tailwind`, or `cssmodules`.
- `typescript` (optional, default `true`): TypeScript or JavaScript output.

If no API key is stored, the user is prompted to enter one via a secure field. The key is saved for future use.

The returned content includes the component source code and any CSS or config files. Some components depend on `framer-motion` — mention this when relevant.

### Manage the API key

- `originkit_setup` with action `"status"`: check if a key is configured.
- `originkit_setup` with action `"set"`: prompt for a new key.
- `originkit_setup` with action `"reset"`: clear the stored key.

## Tips

- Always browse first when the user is exploring. It is free and instant.
- When the user names a component they found on the Originkit website, fetch it directly with `originkit_get`.
- If a fetch fails with a daily limit message, let the user know they can try again after midnight UTC.
- If a fetch fails with an auth error, suggest resetting the key via `originkit_setup`.
- Components are React-based. For non-React projects, the `framer` stack variant may be more appropriate.
