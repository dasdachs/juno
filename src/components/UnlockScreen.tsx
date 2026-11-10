import { Button, Card, Notice } from './ui';
import { BusyLabel } from './unlock/BusyLabel';
import { PasswordInputs } from './unlock/PasswordInputs';
import { UnlockFooter } from './unlock/UnlockFooter';
import { UnlockIntro } from './unlock/UnlockIntro';
import { useUnlockForm } from './unlock/useUnlockForm';

export function UnlockScreen() {
  const { hasVault, fields, onSubmit } = useUnlockForm();
  const { error, isLoading } = fields;

  return (
    <main className="centered-screen">
      <Card variant="elevated" className="onboarding-card stack">
        <UnlockIntro hasVault={hasVault} />

        <form onSubmit={onSubmit} className="stack">
          <PasswordInputs fields={fields} hasVault={hasVault} />

          {error && <Notice tone="error">{error}</Notice>}

          {isLoading ? (
            <Button type="submit" disabled fullWidth>
              <BusyLabel>{hasVault ? 'Unlocking...' : 'Creating vault...'}</BusyLabel>
            </Button>
          ) : (
            <Button type="submit" icon={hasVault ? 'lock' : 'add'} fullWidth>
              {hasVault ? 'Unlock Vault' : 'Create Vault'}
            </Button>
          )}
        </form>

        <UnlockFooter hasVault={hasVault} />
      </Card>
    </main>
  );
}
