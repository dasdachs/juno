import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeSwitcher from './settings/ThemeSwitcher';
import { Button, IconButton, NavigationBar, TopAppBar } from './ui';

const NAV_ITEMS = [
  { to: '/', icon: 'calendar_month', label: 'Calendar' },
  { to: '/insights', icon: 'trending_up', label: 'Insights' },
  { to: '/history', icon: 'history', label: 'History' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export function Layout() {
  const { lock } = useAuth();
  const navigate = useNavigate();

  const handleLock = () => {
    lock();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <NavigationBar variant="drawer" items={NAV_ITEMS}>
        <div className="max" />
        <ThemeSwitcher />
        <Button variant="text" icon="lock" onClick={handleLock}>
          Lock App
        </Button>
      </NavigationBar>

      <TopAppBar
        title="Juno"
        leading={<span className="app-mark" aria-hidden="true">J</span>}
        actions={<IconButton icon="lock" label="Lock app" onClick={handleLock} />}
      />

      <main className="responsive">
        <Outlet />
      </main>

      <NavigationBar variant="bar" items={NAV_ITEMS} />
    </div>
  );
}
