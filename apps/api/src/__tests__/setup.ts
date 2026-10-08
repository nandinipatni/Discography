/**
 * Test environment setup — runs before any test module is imported.
 *
 * Loads .env.test so process.env is fully populated before config.ts
 * is evaluated (config.ts reads process.env at import time).
 * `override: true` ensures test values win over any system env vars.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({
  path: resolve(__dirname, '../../.env.test'),
  override: true,
});
