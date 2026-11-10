import zxcvbn from 'zxcvbn';

export const MIN_PASSWORD_LENGTH = 12;

// zxcvbn score 3 = "safely unguessable": at least 10^8 guesses. Everything
// rests on the password once a device or backup file is in someone else's
// hands, so anything weaker is refused.
export const MIN_PASSWORD_SCORE = 3;

/** Returns an error message, or null if the password is acceptable. */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (zxcvbn(password).score < MIN_PASSWORD_SCORE) {
    return 'Password is too easy to guess. Try a longer phrase of unrelated words.';
  }
  return null;
}
