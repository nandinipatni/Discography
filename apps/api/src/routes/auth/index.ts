import { FastifyPluginAsync } from 'fastify';
import registerRoute from './register';
import loginRoute from './login';
import logoutRoute from './logout';
import meRoute from './me';

/**
 * Auth route bundle.
 *
 * Registered in app.ts with prefix `/api/auth`, so final paths are:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */
const authRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(registerRoute);
  await fastify.register(loginRoute);
  await fastify.register(logoutRoute);
  await fastify.register(meRoute);
};

export default authRoutes;
