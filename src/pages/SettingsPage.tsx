import { useAuth } from '../contexts/AuthContext';
import { AboutCard } from '../components/settings/AboutCard';
import { DataSection } from '../components/settings/DataSection';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { ProfileLinkCard } from '../components/settings/ProfileLinkCard';
import { SecuritySection } from '../components/settings/SecuritySection';
import { SyncSettings } from '../components/settings/SyncSettings';
import { Button, Card } from '../components/ui';

export function SettingsPage() {
  const { lock } = useAuth();

  return (
    <div className="page-container settings-page">
      <h1 className="h5">Settings</h1>

      <ProfileLinkCard />
      <SecuritySection />
      <PreferencesSection />

      <section>
        <h2 className="section-title">Sync</h2>
        <Card variant="outlined" className="settings-card">
          <SyncSettings />
        </Card>
      </section>

      <DataSection />
      <AboutCard />

      <Button variant="tonal" icon="lock" fullWidth onClick={lock}>
        Lock App
      </Button>
    </div>
  );
}
