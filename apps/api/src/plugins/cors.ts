import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { config } from '../config';

/**
 * CORS plugin.
 *
 * `credentials: true` is required for the browser to include cookies in
 * cross-origin requests (web → API during local development).
 */
const corsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});

export default corsPlugin;
