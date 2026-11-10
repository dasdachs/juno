import { Link } from 'react-router-dom';
import { Card, Icon } from '../ui';

export function ProfileLinkCard() {
  return (
    <Card variant="outlined" className="settings-card">
      <ul className="list">
        <li>
          <Link to="/profile">
            <span className="icon-badge primary-container">
              <Icon name="person" />
            </span>
            <div className="max">
              <div className="headline">Profile</div>
              <div className="supporting">Manage your profile settings</div>
            </div>
            <Icon name="chevron_right" />
          </Link>
        </li>
      </ul>
    </Card>
  );
}
