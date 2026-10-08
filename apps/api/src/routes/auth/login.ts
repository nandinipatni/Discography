import { FastifyPluginAsync } from 'fastify';
import { LoginSchema } from '@discography/shared';
import { comparePassword } from '../../lib/password';
import { AppError } from '../../errors/AppError';
import { config } from '../../config';

const loginRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    // ── Validate request body ─────────────────────────────────────────────
    const result = LoginSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, result.error.errors.map((e) => e.message).join('; '));
    }

    const { email, password } = result.data;

    // ── Look up user (email normalised to lowercase by LoginSchema) ───────
    const user = await fastify.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, createdAt: true, passwordHash: true },
    });

    // ── Validate credentials — same error for unknown email or wrong password
    //    to prevent email enumeration ───────────────────────────────────────
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // ── Issue JWT ─────────────────────────────────────────────────────────
    const accessToken = fastify.jwt.sign({ sub: user.id });

    // ── Set HttpOnly cookie (web) ─────────────────────────────────────────
    reply.setCookie('token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,   // false on localhost HTTP, true on HTTPS
      path: '/',
    });

    // ── Return user + token (passwordHash excluded) ───────────────────────
    const { passwordHash: _omit, ...publicUser } = user;
    return reply.status(200).send({ user: publicUser, accessToken });
  });
};

export default loginRoute;
