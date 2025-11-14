import Fastify from 'fastify';

const fastify = Fastify({ logger: true });


fastify.get('/hello', async (request, reply) => {
  return { message: 'Hello World' };
});


await fastify.listen({ port: 3000 });