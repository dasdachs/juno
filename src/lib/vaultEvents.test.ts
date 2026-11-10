import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Mod = typeof import('./vaultEvents');

async function fresh(): Promise<Mod> {
  vi.resetModules();
  return import('./vaultEvents');
}

class FakeChannel {
  static instances: FakeChannel[] = [];
  onmessage: ((m: MessageEvent) => void) | null = null;
  posted: unknown[] = [];
  constructor(public name: string) {
    FakeChannel.instances.push(this);
  }
  postMessage(m: unknown) {
    this.posted.push(m);
  }
}

describe('vaultEvents', () => {
  beforeEach(() => {
    FakeChannel.instances = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emitLocal delivers to listeners until they unsubscribe', async () => {
    const { onVaultEvent, emitLocal } = await fresh();
    const a = vi.fn();
    const b = vi.fn();
    const offA = onVaultEvent(a);
    onVaultEvent(b);
    emitLocal('settings');
    expect(a).toHaveBeenCalledWith('settings');
    expect(b).toHaveBeenCalledWith('settings');
    offA();
    emitLocal('rotated');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('announce posts to other tabs but does not call listeners in this tab', async () => {
    vi.stubGlobal('BroadcastChannel', FakeChannel);
    const { onVaultEvent, announce } = await fresh();
    const l = vi.fn();
    onVaultEvent(l);
    announce('rotated');
    expect(l).not.toHaveBeenCalled();
    expect(FakeChannel.instances).toHaveLength(1);
    expect(FakeChannel.instances[0].name).toBe('juno-vault');
    expect(FakeChannel.instances[0].posted).toEqual(['rotated']);
  });

  it('turns rotated/wiped messages from other tabs into local events and ignores others', async () => {
    vi.stubGlobal('BroadcastChannel', FakeChannel);
    const { onVaultEvent } = await fresh();
    const l = vi.fn();
    onVaultEvent(l);
    const ch = FakeChannel.instances[0];
    ch.onmessage!({ data: 'wiped' } as MessageEvent);
    ch.onmessage!({ data: 'settings' } as MessageEvent);
    ch.onmessage!({ data: 'junk' } as MessageEvent);
    expect(l).toHaveBeenCalledTimes(1);
    expect(l).toHaveBeenCalledWith('wiped');
  });

  it('announce does not throw without BroadcastChannel', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const { announce, onVaultEvent } = await fresh();
    expect(() => announce('wiped')).not.toThrow();
    expect(() => onVaultEvent(() => {})()).not.toThrow();
  });

  it('announce swallows a postMessage failure', async () => {
    class Throwing extends FakeChannel {
      postMessage() {
        throw new Error('closed');
      }
    }
    vi.stubGlobal('BroadcastChannel', Throwing);
    const { announce } = await fresh();
    expect(() => announce('rotated')).not.toThrow();
  });
});
