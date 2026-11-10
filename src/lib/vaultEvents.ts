// Cross-tab and in-app notifications about changes that invalidate what an
// open tab holds in memory.
//
// - 'rotated': the vault key was replaced (password change). A tab still
//   holding the old key would write rows nothing can open, so it must lock.
// - 'wiped': all data was deleted. Other tabs must lock and reload rather
//   than quietly recreate the database.
// - 'settings': app settings changed (same tab only).

export type VaultEvent = 'rotated' | 'wiped' | 'settings';

type Listener = (event: VaultEvent) => void;

const CHANNEL_NAME = 'juno-vault';
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (channel || typeof BroadcastChannel === 'undefined') return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (message: MessageEvent) => {
    if (message.data === 'rotated' || message.data === 'wiped') {
      emitLocal(message.data);
    }
  };
  return channel;
}

/** Notify listeners in this tab. */
export function emitLocal(event: VaultEvent): void {
  listeners.forEach((listener) => listener(event));
}

/** Notify other tabs (not this one). */
export function announce(event: 'rotated' | 'wiped'): void {
  try {
    getChannel()?.postMessage(event);
  } catch {
    // Channel unavailable: other tabs fail closed on their next decrypt
  }
}

export function onVaultEvent(listener: Listener): () => void {
  getChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
