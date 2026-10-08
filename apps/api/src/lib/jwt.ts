/**
 * JWT payload type and @fastify/jwt module augmentation.
 *
 * Imported as a side-effect in app.ts (`import './lib/jwt'`) so the
 * FastifyJWT interface is augmented globally before any route handlers run.
 * This makes fastify.jwt.sign() and fastify.jwt.verify() properly typed
 * throughout the application without repeating generics at every call site.
 */

/** The shape of the JWT payload we sign and verify. */
export interface JwtPayload {
  /** Subject — the authenticated user's UUID. */
  sub: string;
  /** Issued at (added automatically by @fastify/jwt). */
  iat?: number;
  /** Expiration timestamp (added automatically when sign.expiresIn is configured). */
  exp?: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
