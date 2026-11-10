import { Button, Card, Icon } from './ui';

interface ErrorFallbackProps {
  onReset: () => void;
  onReload: () => void;
}

/** Full-screen message shown by `ErrorBoundary` when rendering fails. */
export function ErrorFallback({ onReset, onReload }: ErrorFallbackProps) {
  return (
    <main className="centered-screen">
      <Card variant="elevated" className="onboarding-card center-align stack">
        <div>
          <span className="icon-badge large error-container">
            <Icon name="warning" size="large" />
          </span>
        </div>
        <h2 className="h5">Something went wrong</h2>
        <p className="muted">We encountered an unexpected error. Your data is safe.</p>
        <div className="button-row onboarding-actions">
          <Button variant="outlined" onClick={onReset}>
            Try Again
          </Button>
          <Button onClick={onReload}>Reload App</Button>
        </div>
      </Card>
    </main>
  );
}
