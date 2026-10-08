import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

import { config } from './config';
import prismaPlugin from './plugins/prisma';
import corsPlugin from './plugins/cors';
import cookiesPlugin from './plugins/cookies';
import healthRoute from './routes/health';
import authRoutes from './routes/auth';
import { AppError } from './errors/AppError';

// Apply @fastify/jwt type augmentation (side-effect import)
import './lib/jwt';

export interface BuildAppOptions {
  /** Set to false to suppress logging (useful in tests). Defaults to pino with pino-pretty in dev. */
  logger?: boolean | object;
}

export async function buildApp(
  opts: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const defaultLogger =
    opts.logger === false
      ? false
      : {
          level: config.nodeEnv === 'production' ? 'info' : 'debug',
          ...(config.isProduction
            ? {}
            : {
                transport: {
                  target: 'pino-pretty',
                  options: { colorize: true },
                },
              }),
        };

  const app = Fastify({
    logger: opts.logger !== undefined ? opts.logger : defaultLogger,
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cookiesPlugin);
  await app.register(corsPlugin);
  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  });
  await app.register(prismaPlugin);

  // ── Global error handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.message,
      });
    }

    // Fastify/Zod validation errors propagated as 400
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      error.statusCode === 400
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'message' in error ? String(error.message) : 'Bad Request',
      });
    }

    // Unexpected error — log full detail, never leak stack to client
    request.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
    });
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(healthRoute);
  await app.register(authRoutes, { prefix: '/api/auth' });

  return app;
}