// src/storage.ts — credential and state helpers for the Originkit plugin.
// The API key is stored in the plugin's config.json (preserved across upgrades)
// and optionally in the plugin's data directory as a fallback.

import * as fs from "node:fs";
import * as path from "node:path";

let _dataDir: string | null = null;
let _config: unknown = null;

const KEY_FILE = "originkit-key.json";

export function setDataDir(dir: string): void {
  _dataDir = dir;
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // directory may already exist
  }
}

export function setConfig(config: unknown): void {
  _config = config;
}

/**
 * Read the stored API key. Checks config.json first, then the data dir fallback.
 */
export function getApiKey(): string | null {
  // config.json path
  if (_config && typeof _config === "object") {
    const cfg = _config as Record<string, unknown>;
    if (typeof cfg.apiKey === "string" && cfg.apiKey.length > 0) {
      return cfg.apiKey;
    }
  }
  // data dir fallback
  if (_dataDir) {
    const keyPath = path.join(_dataDir, KEY_FILE);
    try {
      const raw = fs.readFileSync(keyPath, "utf-8");
      const parsed = JSON.parse(raw) as { apiKey?: string };
      if (typeof parsed.apiKey === "string" && parsed.apiKey.length > 0) {
        return parsed.apiKey;
      }
    } catch {
      // not stored yet
    }
  }
  return null;
}

/**
 * Persist the API key to the plugin's data directory.
 */
export function saveApiKey(key: string): void {
  if (!_dataDir) return;
  const keyPath = path.join(_dataDir, KEY_FILE);
  try {
    fs.writeFileSync(keyPath, JSON.stringify({ apiKey: key }, null, 2), "utf-8");
  } catch {
    // best effort
  }
}

/**
 * Clear the stored API key.
 */
export function clearApiKey(): void {
  if (_dataDir) {
    const keyPath = path.join(_dataDir, KEY_FILE);
    try {
      fs.unlinkSync(keyPath);
    } catch {
      // already gone
    }
  }
}

export function getDataDir(): string | null {
  return _dataDir;
}
