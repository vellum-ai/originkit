// hooks/init.ts — initialize the Originkit plugin, load config.

import type { InitContext } from "@vellumai/plugin-api";
import { setConfig, getApiKey } from "../src/storage.ts";

export default async function init(ctx: InitContext): Promise<void> {
  setConfig(ctx.config);

  const key = getApiKey();
  if (key) {
    ctx.logger?.info?.("originkit: initialized (API key found in config)");
  } else {
    ctx.logger?.info?.("originkit: initialized (no API key yet, browsing still works)");
  }
}
