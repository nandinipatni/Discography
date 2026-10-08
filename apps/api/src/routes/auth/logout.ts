import { FastifyPluginAsync } from 'fastify';

const logoutRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/logout', async (_request, reply) => {
    // Clear the auth cookie — path must match the path used in setCookie
    reply.clearCookie('token', { path: '/' });

    // Always succeeds regardless of whether the client was authenticated.
    // Mobile clients should discard their accessToken from SecureStore locally.
    return reply.status(200).send({ message: 'Logged out' });
  });
};

export default logoutRoute;
