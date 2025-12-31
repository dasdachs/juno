import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UnlockScreen } from './components/UnlockScreen';
import { Layout } from './components/Layout';
import { ProfileSetup } from './components/ProfileSetup';
import {
  CalendarPage,
  InsightsPage,
  HistoryPage,
  SettingsPage,
  ProfilePage,
} from './pages';
import { useProfile } from './hooks/useProfile';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnlockScreen />;
  }

  return <>{children}</>;
}

function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { hasCompletedSetup, isLoading, refresh } = useProfile();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasCompletedSetup) {
      setShowSetup(true);
    }
  }, [isLoading, hasCompletedSetup]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <ProfileSetup
        onComplete={() => {
          refresh();
          setShowSetup(false);
        }}
      />
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OnboardingCheck>
              <Layout />
            </OnboardingCheck>
          </ProtectedRoute>
        }
      >
        <Route index element={<CalendarPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
