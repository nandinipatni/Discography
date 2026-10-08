import { FastifyPluginAsync } from 'fastify';

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
};

export default healthRoute;
