import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('GET /api/auth/me', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await app.prisma.user.deleteMany();
  });

  /** Helper: register a user and return the response body. */
  async function registerUser(
    email = 'me@example.com',
    password = 'password123',
  ) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'Me User', email, password },
    });
    return res.json<{ user: Record<string, unknown>; accessToken: string }>();
  }

  /** Extract the raw token= value from a Set-Cookie header string. */
  function extractCookieToken(setCookieHeader: string | string[]): string {
    const str = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    const match = str?.match(/token=([^;]+)/);
    if (!match?.[1]) throw new Error('No token cookie found in Set-Cookie header');
    return match[1];
  }

  it('returns 200 with user data using cookie authentication', async () => {
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'Me User', email: 'me@example.com', password: 'password123' },
    });
    const cookieToken = extractCookieToken(
      registerRes.headers['set-cookie'] as string | string[],
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: `token=${cookieToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: Record<string, unknown> }>();
    expect(body.user.email).toBe('me@example.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 200 with user data using Bearer token authentication', async () => {
    const { accessToken } = await registerUser();

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: Record<string, unknown> }>();
    expect(body.user.email).toBe('me@example.com');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when Bearer token is invalid (tampered signature)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalidsig' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when cookie token is invalid', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: 'token=not.a.valid.jwt' },
    });
    expect(res.statusCode).toBe(401);
  });
});
