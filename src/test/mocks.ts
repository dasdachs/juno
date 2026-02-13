import { vi } from 'vitest';

// Mock crypto module functions
export const mockCrypto = {
  initCrypto: vi.fn(() => Promise.resolve()),
  isUnlocked: vi.fn(() => true),
  lock: vi.fn(),
  unlock: vi.fn(() => Promise.resolve(true)),
  createVault: vi.fn(() => Promise.resolve()),
  changePassword: vi.fn(() => Promise.resolve(true)),
  generateId: vi.fn(() => `mock-id-${Math.random().toString(36).slice(2)}`),
  encryptRecord: vi.fn((record) => ({
    id: record.id,
    nonce: 'mock-nonce',
    ciphertext: 'mock-ciphertext',
    category: record.type,
    version: 1,
    timestamp: Date.now(),
  })),
  decryptRecord: vi.fn((encrypted) => ({
    id: encrypted.id,
    type: encrypted.category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: { date: Date.now() },
    tags: [],
  })),
  encryptCycleData: vi.fn((cycle) => ({
    id: cycle.id,
    nonce: 'mock-nonce',
    ciphertext: 'mock-ciphertext',
    startDate: cycle.startDate,
    version: 1,
  })),
  decryptCycleData: vi.fn((encrypted) => ({
    id: encrypted.id,
    cycleNumber: 1,
    startDate: encrypted.startDate || Date.now(),
  })),
  encryptUserProfile: vi.fn((profile) => ({
    id: profile.id,
    nonce: 'mock-nonce',
    ciphertext: 'mock-ciphertext',
    version: 1,
  })),
  decryptUserProfile: vi.fn(() => ({
    id: 'primary',
    weekStartsOn: 0 as const,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })),
};

// Create mock db instance
export function createMockDb() {
  return {
    records: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      orderBy: vi.fn(() => ({
        reverse: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          reverse: vi.fn(() => ({
            sortBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    },
    cycles: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      orderBy: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    },
    userProfile: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    keyStore: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    settings: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
  };
}

// Mock db operations helpers
export const mockDbOperations = {
  hasExistingVault: vi.fn(() => Promise.resolve(false)),
  clearAllData: vi.fn(() => Promise.resolve()),
  getSettings: vi.fn(() =>
    Promise.resolve({
      id: 'primary',
      sessionTimeout: 15 * 60 * 1000,
      periodReminderEnabled: false,
      periodReminderDays: 3,
    })
  ),
  updateSettings: vi.fn(() => Promise.resolve()),
  hasUserProfile: vi.fn(() => Promise.resolve(false)),
};

// Reset all mocks
export function resetAllMocks() {
  Object.values(mockCrypto).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  Object.values(mockDbOperations).forEach((fn) => fn.mockClear());
}
