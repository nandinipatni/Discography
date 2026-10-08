import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../lib/password';

describe('password helpers', () => {
  it('hashPassword returns a bcrypt hash (starts with $2b$)', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('hashPassword produces different hashes for the same input (unique salts)', async () => {
    const hash1 = await hashPassword('mypassword123');
    const hash2 = await hashPassword('mypassword123');
    expect(hash1).not.toBe(hash2);
  });

  it('comparePassword returns true for correct password', async () => {
    const hash = await hashPassword('correct_password');
    const result = await comparePassword('correct_password', hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct_password');
    const result = await comparePassword('wrong_password', hash);
    expect(result).toBe(false);
  });

  it('comparePassword returns false for empty string', async () => {
    const hash = await hashPassword('correct_password');
    const result = await comparePassword('', hash);
    expect(result).toBe(false);
  });
});
