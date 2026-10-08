import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { AppError } from '../../errors/AppError';

const meRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      // authenticate hook guarantees request.authUser is set
      const userId = request.authUser!.id;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      if (!user) {
        // Token is valid but the account was deleted — treat as unauthorized
        throw new AppError(401, 'Unauthorized');
      }

      return reply.status(200).send({ user });
    },
  );
};

export default meRoute;
