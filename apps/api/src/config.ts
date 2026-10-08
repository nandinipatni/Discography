/**
 * Typed environment configuration.
 *
 * This module reads process.env directly — it does NOT call dotenv itself.
 * - Production: dotenv is loaded by index.ts before this module is imported.
 * - Tests:      dotenv is loaded by src/__tests__/setup.ts via Vitest setupFiles,
 *               which runs before any test module (including this one) is evaluated.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Make sure you have a .env file in apps/api/ (see .env.example).`,
    );
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  /** Derived flag — true only when NODE_ENV === 'production'. */
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
} as const;
