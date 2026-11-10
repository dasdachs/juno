import zxcvbn from 'zxcvbn';
import { MIN_PASSWORD_SCORE } from '../../lib/passwordPolicy';
import { cx } from '../ui';

const getStrengthLabel = (score: number) => {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return labels[score];
};

/** Live strength meter shown while choosing a vault password. */
export function PasswordStrength({ password }: { password: string }) {
  const passwordStrength = zxcvbn(password);
  const tooWeak = passwordStrength.score < MIN_PASSWORD_SCORE;

  return (
    <div className="stack tight">
      <div className="row supporting">
        <span className="max">Password strength</span>
        <span className={cx('bold', tooWeak ? 'error-text' : 'primary-text')}>
          {getStrengthLabel(passwordStrength.score)}
          {tooWeak ? ' - Too weak' : ''}
        </span>
      </div>
      <progress
        className={cx('strength-meter', tooWeak && 'weak')}
        aria-label="Password strength"
        value={passwordStrength.score + 1}
        max={5}
      />
      {passwordStrength.feedback.warning && (
        <p className="small-text tertiary-text">{passwordStrength.feedback.warning}</p>
      )}
      {tooWeak && password.length >= 12 && (
        <p className="small-text error-text">
          Password is too easy to guess. Try a longer phrase of unrelated words.
        </p>
      )}
    </div>
  );
}
