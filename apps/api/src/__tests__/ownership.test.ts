import { describe, it, expect } from 'vitest';
import { assertOwnership } from '../lib/ownershipGuard';
import { AppError } from '../errors/AppError';

describe('assertOwnership', () => {
  it('does not throw when resourceUserId matches requestUserId', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    expect(() => assertOwnership(id, id)).not.toThrow();
  });

  it('throws AppError(403) when IDs differ', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    const attackerId = '22222222-2222-2222-2222-222222222222';
    expect(() => assertOwnership(ownerId, attackerId)).toThrow(AppError);
  });

  it('thrown AppError has statusCode 403', () => {
    const ownerId = 'owner-id';
    const attackerId = 'attacker-id';
    try {
      assertOwnership(ownerId, attackerId);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  it('thrown AppError message is "Forbidden"', () => {
    try {
      assertOwnership('owner', 'attacker');
    } catch (err) {
      expect((err as AppError).message).toBe('Forbidden');
    }
  });

  it('throws when one ID is empty string', () => {
    expect(() => assertOwnership('owner', '')).toThrow(AppError);
  });
});
