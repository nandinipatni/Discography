import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Returns a bcrypt hash of the given plaintext password.
 * Cost factor 12 is a good balance between security and latency (~300 ms on modern hardware).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Returns true if the plaintext password matches the stored bcrypt hash.
 * Always runs in constant time — never short-circuit or compare manually.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
