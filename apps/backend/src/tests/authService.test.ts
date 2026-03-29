import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';

// authService imports db/index.ts at module load time, which throws without DATABASE_URL.
// We only test the pure token/password functions here, so mock the DB out entirely.
import { vi } from 'vitest';
vi.mock('../db/index.js', () => ({ db: {} }));

import { generateToken, verifyToken, hashPassword, verifyPassword } from '../services/authService.js';

// These tests only cover the token and password functions.
// They do NOT touch the database (register/login are tested separately).

describe('generateToken / verifyToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-for-vitest';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('generates a token with 3 dot-separated parts (header.payload.signature)', () => {
    const token = generateToken(1, 'user@example.com');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken returns the correct userId and email', () => {
    const token = generateToken(42, 'test@example.com');
    const decoded = verifyToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('42');
    expect(decoded!.email).toBe('test@example.com');
  });

  it('verifyToken returns null for a tampered token', () => {
    const token = generateToken(1, 'user@example.com');
    const [header, payload] = token.split('.');
    const tampered = `${header}.${payload}.invalidsignature`;

    expect(verifyToken(tampered)).toBeNull();
  });

  it('verifyToken returns null for a malformed token (wrong number of parts)', () => {
    expect(verifyToken('notavalidtoken')).toBeNull();
    expect(verifyToken('only.two')).toBeNull();
  });

  it('verifyToken returns null for an expired token', () => {
    // Build a token whose exp is in the past
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: '1',
        email: 'old@example.com',
        iat: 0,
        exp: 1, // Unix timestamp 1 is long in the past
      })
    ).toString('base64url');

    const secret = process.env.JWT_SECRET!;
    const sig = createHash('sha256')
      .update(`${header}.${expiredPayload}.${secret}`)
      .digest('base64url');

    const expiredToken = `${header}.${expiredPayload}.${sig}`;
    expect(verifyToken(expiredToken)).toBeNull();
  });

  it('generateToken throws if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateToken(1, 'user@example.com')).toThrow('JWT_SECRET environment variable is required');
  });
});

describe('hashPassword / verifyPassword', () => {
  it('generates a hash in salt:derivedKey format', async () => {
    const hash = await hashPassword('mypassword123');
    const parts = hash.split(':');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(64); // 32 bytes hex = 64 chars
  });

  it('verifies correct password against its hash', async () => {
    const hash = await hashPassword('correctpassword');
    expect(await verifyPassword('correctpassword', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('correctpassword');
    expect(await verifyPassword('wrongpassword', hash)).toBe(false);
  });

  it('two hashes of the same password are different (different salts)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });

  it('returns false for a malformed hash (no colon separator)', async () => {
    expect(await verifyPassword('anything', 'nocolonhere')).toBe(false);
  });
});
