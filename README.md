# Originkit Plugin

Browse and import animated UI components from [Originkit](https://originkit.dev), a free library of 50 animated components for modern websites.

## What it does

- **Browse** the full Originkit library (50 components) by name, category, or search term. No API key required.
- **Fetch** any component's source code in your preferred stack (React, Next.js, Vite, Framer) and styling (CSS, Tailwind, CSS Modules). Requires a free API key.
- **Setup guide** that walks users through getting an Originkit API key and stores it securely.

## Components

50 animated components across 6 categories:

| Category | Examples |
|---|---|
| Interactive Elements | Black Hole, Fluid Trail, SVG Particles, Kinetic Grid |
| Image Gallery | Spiral Images, Coverflow Carousel, Swipe Stack, Infinity Canvas |
| Text | Smoky Text, Text Morph, Scramble Text, Weight Hover |
| Animation | Pixel Reveal, Star Burst, Particle Tunnel, Glitter Wrap |
| Background Animation | Snow Fall, Blinking Squares, Character Waves |
| Button | Emoji Burst, Link Preview |

## Setup

1. Install the plugin: `assistant plugins install originkit`
2. Browse components: ask your assistant to "browse Originkit components" or "search Originkit for particle effects"
3. When you fetch a component for the first time, you will be prompted for your Originkit API key
4. Get a free key at [originkit.dev](https://originkit.dev) under Settings > API Integration

For persistence across sessions, add the key to the plugin's `config.json`:

```json
{ "apiKey": "cmp_live_..." }
```

## API key

- Free, from [originkit.dev](https://originkit.dev) > Settings > API Integration
- For persistence across sessions, add it to the plugin's `config.json`: `{ "apiKey": "cmp_live_..." }`
- For the current session only, use `originkit_setup` with action `"set"` or just fetch a component and you'll be prompted
- The plugin never writes secrets to disk
- Daily limit: 10 component fetches per key, resets at midnight UTC
- Use `originkit_setup` with action `"reset"` to clear the session key

## How to use

### Browse components

Browse without a key. Ask your assistant:

> "Browse Originkit components"
> "Search Originkit for particle effects"
> "Show me Originkit's text animation components"

You can also filter by category: `interactive-elements`, `image-gallery`, `text`, `animation`, `background-animation`, `button`.

### Fetch a component

Once you find one you like, ask your assistant to fetch it:

> "Get the smokytext component from Originkit"
> "Fetch the blackhole component for Vite with Tailwind"

Specify your stack (`react`, `nextjs`, `vite`, `framer`), styling (`css`, `tailwind`, `cssmodules`), and TypeScript preference. Defaults are React + CSS + TypeScript.

If you have not set up an API key yet, you will be prompted to enter one. The key is saved automatically for future fetches.

### Set up your API key

Get a free key from [originkit.dev](https://originkit.dev):

1. Create an account or log in
2. Go to **Settings > API Integration**
3. Copy your API key (it looks like `cmp_live_...`)

Then ask your assistant:

> "Set up my Originkit API key"

### Manage your key

> "Check my Originkit API key status"
> "Reset my Originkit API key"

### Daily limit

Each API key allows 10 component fetches per day, shared with website copies. The limit resets at midnight UTC. Browsing the catalog is unlimited and does not count against the fetch limit.

## Tools

| Tool | Purpose | API key |
|---|---|---|
| `originkit_browse` | List and search the component library | Not required |
| `originkit_get` | Fetch a component's source code | Required |
| `originkit_setup` | Check, set, or reset the API key | N/A |

## How it works

The plugin talks to Originkit's MCP server (`https://mcp.originkit.dev/vellumai`) using JSON-RPC 2.0 with bearer token auth. The component catalog (metadata only, no source code) is bundled with the plugin so browsing is instant and key-free. Source code is fetched on demand from the MCP server.

## Credit

Components are created by [Originkit](https://originkit.dev). Visit their site for live demos and the full component gallery.
