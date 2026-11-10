import { useState } from 'react';
import { getSettings } from '../../lib/db';
import { SyncEngine } from '../../lib/sync/SyncEngine';
import { FileSyncAdapter } from '../../lib/sync/adapters/FileSyncAdapter';
import { checkPasswordStrength } from '../../lib/passwordPolicy';
import type { SyncStatus } from './useSyncStatus';

/** Passphrase state and the push (export an encrypted sync file) action. */
export function useSyncPush({ setIsSyncing, setSyncMessage, setLastSyncAt }: SyncStatus) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  const handlePush = async () => {
    setSyncMessage('');

    // The sync file leaves this device, so it is encrypted under a passphrase
    // held to the same bar as a backup password.
    const strengthError = checkPasswordStrength(passphrase);
    if (strengthError) {
      setSyncMessage(`Error: ${strengthError}`);
      return;
    }
    // A mistyped passphrase would make the file unreadable for good
    if (passphrase !== confirmPassphrase) {
      setSyncMessage('Error: Passphrases do not match');
      return;
    }

    setIsSyncing(true);
    const passphraseValue = passphrase;
    setPassphrase('');
    setConfirmPassphrase('');

    try {
      const adapter = new FileSyncAdapter();
      const engine = new SyncEngine(adapter);
      const { unreadable } = await engine.push(passphraseValue);
      setSyncMessage(
        unreadable > 0
          ? `Encrypted sync file downloaded. ${unreadable} damaged entries could not be read and were left out.`
          : 'Encrypted sync file downloaded successfully'
      );

      // Reload settings to get updated lastSyncAt
      const settings = await getSettings();
      setLastSyncAt(settings.lastSyncAt);
    } catch (err) {
      setSyncMessage(`Error: ${err instanceof Error ? err.message : 'Push failed'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return { passphrase, setPassphrase, confirmPassphrase, setConfirmPassphrase, handlePush };
}
