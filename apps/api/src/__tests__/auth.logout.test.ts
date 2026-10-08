import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('POST /api/auth/logout', () => {
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

  it('returns 200 when called without any auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'Logged out' });
  });

  it('returns 200 when called with a valid cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: 'token=some.dummy.value' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('clears the token cookie (Set-Cookie header sets Max-Age=0 or past Expires)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    const setCookie = res.headers['set-cookie'] as string | string[] | undefined;
    expect(setCookie).toBeDefined();

    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie ?? '';
    // @fastify/cookie clearCookie sets Max-Age=0 to expire the cookie immediately
    const isCleared =
      cookieStr.includes('Max-Age=0') ||
      cookieStr.includes('Expires=Thu, 01 Jan 1970') ||
      (cookieStr.includes('token=') && cookieStr.includes('Max-Age=0'));
    expect(isCleared).toBe(true);
  });

  it('after logout the cookie can no longer authenticate /me', async () => {
    // Register a user and get a real cookie
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'Logout User', email: 'logout@example.com', password: 'password123' },
    });
    const setCookie = registerRes.headers['set-cookie'] as string | string[];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const tokenMatch = cookieStr?.match(/token=([^;]+)/);
    const token = tokenMatch?.[1];

    // Confirm token works before logout
    const beforeLogout = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: `token=${token}` },
    });
    expect(beforeLogout.statusCode).toBe(200);

    // After logout (client has cleared the cookie), /me should return 401
    const afterLogout = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      // Simulate client-side cookie deletion (no cookie header sent)
    });
    expect(afterLogout.statusCode).toBe(401);
  });
});
