import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { AlertCircle, Download } from 'lucide-react';

export function UpdateNotification() {
  const { isUpdateAvailable, isUpdating, reloadApp } = usePWAUpdate();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-rose-500 dark:bg-rose-600 text-white p-4 shadow-lg z-50 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium">App Update Available</h3>
          <p className="text-sm text-rose-100 dark:text-rose-200 mt-1">
            A new version of Juno is available. Reload to get the latest features and security improvements.
          </p>
          <button
            onClick={reloadApp}
            disabled={isUpdating}
            className="mt-3 flex items-center gap-2 px-3 py-2 bg-white text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-gray-100 font-medium text-sm transition-colors duration-200 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isUpdating ? 'Reloading...' : 'Reload Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
