import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('POST /api/auth/register', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up all users created during this test
    await app.prisma.user.deleteMany();
  });

  const validPayload = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('returns 201 with user and accessToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: validPayload,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ user: Record<string, unknown>; accessToken: string }>();
    expect(body.user).toMatchObject({ name: 'Test User', email: 'test@example.com' });
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  it('sets an HttpOnly cookie named token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: validPayload,
    });

    const setCookie = res.headers['set-cookie'] as string | string[];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('cookie token matches the returned accessToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: validPayload,
    });

    const { accessToken } = res.json<{ accessToken: string }>();
    const setCookie = res.headers['set-cookie'] as string | string[];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    // Extract token value from cookie string
    const tokenMatch = cookieStr?.match(/token=([^;]+)/);
    expect(tokenMatch?.[1]).toBe(accessToken);
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'test@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'Test', email: 'not-an-email', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'Test', email: 'test@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    // First registration succeeds
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: validPayload,
    });

    // Second registration with same email
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { ...validPayload, name: 'Another User' },
    });
    expect(res.statusCode).toBe(409);
  });
});
