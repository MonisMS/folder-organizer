import { createHash, randomBytes, timingSafeEqual, pbkdf2 } from 'crypto';
import { db } from '../db/index.js';
import { users, type NewUser, type User } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

// Simple password hashing using PBKDF2-like approach with crypto
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(32).toString('hex');
    
    pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      resolve(false);
      return;
    }
    const [salt, hash] = parts;
    if (!salt || !hash) {
      resolve(false);
      return;
    }
    
    pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      
      const storedBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = derivedKey;
      
      // Use timing-safe comparison to prevent timing attacks
      if (storedBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }
      
      resolve(timingSafeEqual(storedBuffer, derivedBuffer));
    });
  });
}

/**
 * Generate a simple JWT-like token
 */
export function generateToken(userId: number, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId.toString(),
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  })).toString('base64url');
  
  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const signature = createHash('sha256')
    .update(`${header}.${payload}.${secret}`)
    .digest('base64url');
  
  return `${header}.${payload}.${signature}`;
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): { sub: string; email: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature) {
      return null;
    }
    
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expectedSignature = createHash('sha256')
      .update(`${header}.${payload}.${secret}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Auth service class
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    
    if (existing.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
    }).returning();
    
    if (!newUser) {
      throw new Error('Failed to create user');
    }
    
    const token = generateToken(newUser.id, newUser.email);
    
    logger.info({ userId: newUser.id, email: newUser.email }, 'User registered');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    return { user: userWithoutPassword, token };
  }
  
  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
    
    const token = generateToken(user.id, user.email);
    
    logger.info({ userId: user.id, email: user.email }, 'User logged in');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }
  
  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<Omit<User, 'passwordHash'> | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) return null;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
