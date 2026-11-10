import zxcvbn from 'zxcvbn';
import { MIN_PASSWORD_SCORE } from '../../lib/passwordPolicy';

const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

/** zxcvbn score for a backup password as a bar, a label and an optional warning. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const passwordStrength = password ? zxcvbn(password) : null;

  if (!password || !passwordStrength) return null;

  return (
    <div className="stack tight">
      <div className="row">
        <div className="max strength-track">
          <div
            className="strength-bar"
            data-score={passwordStrength.score}
            style={{
              width: `${((passwordStrength.score + 1) / 5) * 100}%`,
            }}
          />
        </div>
        <span className="small-text muted">
          {STRENGTH_LABELS[passwordStrength.score]}
          {passwordStrength.score < MIN_PASSWORD_SCORE ? ' - Too weak' : ''}
        </span>
      </div>
      {passwordStrength.feedback.warning && (
        <p className="small-text tertiary-text">{passwordStrength.feedback.warning}</p>
      )}
    </div>
  );
}
