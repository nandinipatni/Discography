// Load environment variables BEFORE importing config or app
// In CommonJS (our tsconfig target), require() statements execute in order,
// so dotenv is guaranteed to populate process.env before config.ts is evaluated.
import 'dotenv/config';

import { buildApp } from './app';
import { config } from './config';

async function main(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
