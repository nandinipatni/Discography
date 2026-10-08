import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AppError';
import type { JwtPayload } from '../lib/jwt';

// Augment FastifyRequest with our own lightweight auth property.
// We use 'authUser' (not 'user') to avoid colliding with @fastify/jwt's
// own 'user' decorator which is typed as JwtPayload.
declare module 'fastify' {
  interface FastifyRequest {
    authUser?: { id: string };
  }
}

/**
 * Fastify preHandler hook that authenticates the request.
 *
 * Token resolution order:
 *   1. HttpOnly cookie named `token`  (used by web clients automatically)
 *   2. Authorization: Bearer <token>  (used by mobile clients via Expo SecureStore)
 *
 * On success, attaches `{ id: string }` to `request.authUser`.
 * On failure, throws `AppError(401, 'Unauthorized')`.
 *
 * Usage in a route:
 *   fastify.get('/me', { preHandler: [authenticate] }, handler);
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  let token: string | undefined;

  // 1. Try HttpOnly cookie first (web clients)
  token = request.cookies?.token;

  // 2. Fall back to Bearer header (mobile clients)
  if (!token) {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      token = auth.slice(7).trim();
    }
  }

  if (!token) {
    throw new AppError(401, 'Unauthorized');
  }

  try {
    const payload = request.server.jwt.verify<JwtPayload>(token);
    request.authUser = { id: payload.sub };
  } catch {
    throw new AppError(401, 'Unauthorized');
  }
}

