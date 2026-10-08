import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyCookie from '@fastify/cookie';

/**
 * Cookie plugin.
 *
 * Registers @fastify/cookie so handlers can use:
 *   request.cookies.<name>   — read a cookie
 *   reply.setCookie(...)     — set a cookie
 *   reply.clearCookie(...)   — clear a cookie
 *
 * No `secret` is provided because we are using plain (unsigned) cookies.
 * The auth cookie is protected by HttpOnly and SameSite, not by signing.
 */
const cookiesPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(fastifyCookie);
});

export default cookiesPlugin;
