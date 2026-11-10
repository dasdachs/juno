import { describe, it, expect } from 'vitest';
import { checkPasswordStrength, MIN_PASSWORD_SCORE, MIN_PASSWORD_LENGTH } from './passwordPolicy';

describe('passwordPolicy', () => {
  it('has the expected thresholds', () => {
    expect(MIN_PASSWORD_SCORE).toBe(3);
    expect(MIN_PASSWORD_LENGTH).toBe(12);
  });

  it('rejects passwords shorter than 12 characters', () => {
    expect(checkPasswordStrength('Sh0rt!pw')).toMatch(/at least 12/);
    expect(checkPasswordStrength('')).toMatch(/at least 12/);
  });

  it('rejects long but guessable passwords', () => {
    for (const pw of ['passwordpassword', 'aaaaaaaaaaaaaaaa']) {
      expect(checkPasswordStrength(pw)).toMatch(/too easy to guess/);
    }
  });

  it('accepts a strong multi-word passphrase', () => {
    expect(checkPasswordStrength('violet harbor tractor mellow quartz')).toBeNull();
  });
});
