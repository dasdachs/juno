import { Card, Icon } from '../ui';

export function AboutCard() {
  return (
    <Card variant="outlined" className="settings-about">
      <div className="row top-align">
        <Icon name="info" />
        <div className="max">
          <p className="headline">Juno</p>
          <p className="supporting">Version 1.0.0</p>
          <p className="small-text muted">
            Your data is encrypted and stored locally on this device.
          </p>
        </div>
      </div>
    </Card>
  );
}
