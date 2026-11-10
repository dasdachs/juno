import { Icon } from '../ui';

/** App mark, name and the one-line instruction above the password form. */
export function UnlockIntro({ hasVault }: { hasVault: boolean }) {
  return (
    <header className="center-align stack tight">
      <div>
        <span className="icon-badge large primary-container">
          <Icon name="shield" size="large" />
        </span>
      </div>
      <h1 className="h4">Juno</h1>
      <p className="muted">
        {hasVault
          ? 'Enter your password to unlock your vault'
          : 'Create a password to secure your health data'}
      </p>
    </header>
  );
}
