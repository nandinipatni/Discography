import { FastifyPluginAsync } from 'fastify';
import { RegisterSchema } from '@discography/shared';
import { hashPassword } from '../../lib/password';
import { AppError } from '../../errors/AppError';
import { config } from '../../config';

const registerRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request, reply) => {
    // ── Validate request body with shared Zod schema ──────────────────────
    const result = RegisterSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, result.error.errors.map((e) => e.message).join('; '));
    }

    const { name, email, password } = result.data;

    // ── Check email uniqueness ────────────────────────────────────────────
    const existing = await fastify.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(409, 'An account with this email already exists');
    }

    // ── Persist new user ──────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);
    const user = await fastify.prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // ── Issue JWT ─────────────────────────────────────────────────────────
    const accessToken = fastify.jwt.sign({ sub: user.id });

    // ── Set HttpOnly cookie (web) ─────────────────────────────────────────
    reply.setCookie('token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,   // false on localhost HTTP, true on HTTPS
      path: '/',
    });

    // ── Return user + token (mobile uses the accessToken via SecureStore) ─
    return reply.status(201).send({ user, accessToken });
  });
};

export default registerRoute;
