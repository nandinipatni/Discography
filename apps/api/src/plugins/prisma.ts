import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

// Augment FastifyInstance so fastify.prisma is typed everywhere
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

/**
 * Prisma singleton plugin.
 *
 * Wrapped with fastify-plugin so the `fastify.prisma` decorator is available
 * outside this plugin's encapsulation scope (i.e., the whole app).
 * Disconnects cleanly when the Fastify server shuts down.
 */
const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

export default prismaPlugin;
