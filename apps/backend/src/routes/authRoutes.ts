import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService, verifyToken } from '../services/authService.js';
import { logger } from '../lib/logger.js';

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      email: string;
    };
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
  
  request.user = {
    id: parseInt(decoded.sub),
    email: decoded.email,
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({ error: 'Invalid email format' });
      }
      
      const result = await authService.register(email, password);
      
      return {
        success: true,
        token: result.token,
        user: {
          id: result.user.id.toString(),
          email: result.user.email,
        },
      };
    } catch (error: unknown) {
      // Better error logging - capture the actual error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error({ 
        error: errorMessage,
        stack: errorStack,
        type: error?.constructor?.name 
      }, 'Registration failed');
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });
  
  /**
   * Login
   * POST /api/auth/login
   */
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }
      
      const result = await authService.login(email, password);
      
      return {
        success: true,
        token: result.token,
        user: {
          id: result.user.id.toString(),
          email: result.user.email,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Login failed');
      
      if (error instanceof Error) {
        // Don't reveal whether email exists
        if (error.message.includes('Invalid')) {
          return reply.status(401).send({ error: 'Invalid email or password' });
        }
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Login failed' });
    }
  });
  
  /**
   * Logout (client-side token removal, but we can log it)
   * POST /api/auth/logout
   */
  fastify.post('/logout', async (request, reply) => {
    // In a production app, you might want to blacklist the token
    // For now, we just acknowledge the logout
    logger.info('User logged out');
    return { success: true, message: 'Logged out successfully' };
  });
  
  /**
   * Get current user
   * GET /api/auth/me
   */
  fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }
      
      const user = await authService.getUserById(request.user.id);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return {
        id: user.id.toString(),
        email: user.email,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get current user');
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });
}
