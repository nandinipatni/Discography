import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { hashPassword } from '../lib/password';

describe('POST /api/auth/login', () => {
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

  /** Helper: create a user directly in the DB (bypasses route layer). */
  async function createUser(
    email = 'login@example.com',
    password = 'password123',
  ) {
    return app.prisma.user.create({
      data: {
        name: 'Login User',
        email,
        passwordHash: await hashPassword(password),
      },
    });
  }

  it('returns 200 with user and accessToken on valid credentials', async () => {
    await createUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'login@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: Record<string, unknown>; accessToken: string }>();
    expect(body.user.email).toBe('login@example.com');
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  it('sets an HttpOnly cookie on successful login', async () => {
    await createUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'login@example.com', password: 'password123' },
    });

    const setCookie = res.headers['set-cookie'] as string | string[];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('returns 401 on wrong password', async () => {
    await createUser();

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'login@example.com', password: 'wrong_password' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'nobody@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns the same 401 error message for wrong password and unknown email (prevents enumeration)', async () => {
    await createUser();

    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'login@example.com', password: 'wrong' },
    });

    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'nobody@example.com', password: 'password123' },
    });

    expect(wrongPassword.json().error).toBe(unknownEmail.json().error);
  });

  it('returns 400 on missing email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });
});
