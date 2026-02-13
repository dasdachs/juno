import { useEffect, useState, useCallback } from 'react';

export interface PWAUpdateState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function usePWAUpdate() {
  const [state, setState] = useState<PWAUpdateState>({
    isUpdateAvailable: false,
    isUpdating: false,
    error: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const handleServiceWorkerUpdate = () => {
      setState((prev) => ({
        ...prev,
        isUpdateAvailable: true,
      }));
    };

    const handleControllerChange = () => {
      // Controller changed means the new service worker is active
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        isUpdateAvailable: false,
      }));
      // Prompt user to reload
      console.log('App update ready. User should reload to see new version.');
    };

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register(
          '/sw.js',
          { scope: '/' }
        );

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration?.update();
        }, 60 * 60 * 1000);

        // Listen for service worker updates
        registration.addEventListener('updatefound', handleServiceWorkerUpdate);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to register service worker',
        }));
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Register if not already registered (vite-plugin-pwa should handle this, but be explicit)
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        registerServiceWorker();
      }
    });

    return () => {
      if (registration) {
        registration.removeEventListener('updatefound', handleServiceWorkerUpdate);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const reloadApp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isUpdating: true,
    }));
    window.location.reload();
  }, []);

  return {
    ...state,
    reloadApp,
  };
}
