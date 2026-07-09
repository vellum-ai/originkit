// hooks/init.ts — initialize the Originkit plugin, set up storage paths.

import type { InitContext } from "@vellumai/plugin-api";
import { setDataDir, setConfig, getApiKey } from "../src/storage.ts";

export default async function init(ctx: InitContext): Promise<void> {
  setDataDir(ctx.pluginStorageDir);
  setConfig(ctx.config);

  const key = getApiKey();
  if (key) {
    ctx.logger?.info?.("originkit: initialized (API key configured)");
  } else {
    ctx.logger?.info?.("originkit: initialized (no API key yet, browsing still works)");
  }
}
