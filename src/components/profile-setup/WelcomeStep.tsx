import { Button, Icon } from '../ui';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="center-align stack">
      <div>
        <span className="icon-badge large primary">
          <Icon name="favorite" size="large" filled />
        </span>
      </div>
      <h1 className="h4">Welcome to Juno</h1>
      <p>Your private period tracker. All your data stays on your device, encrypted and secure.</p>
      <p className="supporting">Let's set up a few things to give you the best experience.</p>
      <Button onClick={onNext} fullWidth>
        Get Started
      </Button>
    </div>
  );
}
