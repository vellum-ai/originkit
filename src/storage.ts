// src/storage.ts — credential and state helpers for the Originkit plugin.
//
// The API key is NEVER written to disk by the plugin. It is read from:
//   1. config.json (user-editable, preserved across upgrades) via ctx.config
//   2. In-memory cache (session-scoped, set via requestSecret prompt)
//
// The user adds their key to config.json themselves if they want persistence:
//   { "apiKey": "cmp_live_..." }
//
// This avoids writing plaintext secrets to the plugin data directory.

let _config: unknown = null;
let _sessionKey: string | null = null;

export function setConfig(config: unknown): void {
  _config = config;
}

/**
 * Read the stored API key. Checks config.json first, then the in-memory cache.
 */
export function getApiKey(): string | null {
  // config.json path (user-editable, standard plugin config mechanism)
  if (_config && typeof _config === "object") {
    const cfg = _config as Record<string, unknown>;
    if (typeof cfg.apiKey === "string" && cfg.apiKey.length > 0) {
      return cfg.apiKey;
    }
  }
  // in-memory cache (session-scoped, from requestSecret prompt)
  if (_sessionKey) {
    return _sessionKey;
  }
  return null;
}

/**
 * Cache an API key in memory for the current session only.
 * Does NOT persist to disk.
 */
export function setSessionKey(key: string): void {
  _sessionKey = key;
}

/**
 * Clear the in-memory session key.
 */
export function clearSessionKey(): void {
  _sessionKey = null;
}
